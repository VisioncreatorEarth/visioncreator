import type { AgentResponse, ClaudeResponse } from '../types/agent.types';
import { conversationManager } from '$lib/stores/intentStore';
import { client } from '$lib/wundergraph';
import { agentLogger } from '$lib/utils/logger';
import { persist, createIndexedDBStorage } from '@macfja/svelte-persistent-store';
import { writable } from 'svelte/store';

export class AliAgent {
    private readonly agentName = 'ali';
    private formContextStore = persist(
        writable<Record<string, any>[]>([]),
        createIndexedDBStorage(),
        'ali-form-context'
    );

    private getSystemPrompt(context?: any): string {
        let formContext = '';
        let conversationHistory = '';

        // Get form context from persistent store
        this.formContextStore.subscribe(forms => {
            if (forms.length > 0) {
                formContext = `\nCurrent Form Context:\n${JSON.stringify(forms, null, 2)}`;
            }
        })();

        // Get conversation history from hominio
        if (context?.delegatedFrom) {
            const messages = conversationManager.getMessageContext();
            conversationHistory = messages
                .map(msg => `[${msg.agent}]: ${msg.content}${msg.payload ? `\n<payload>${JSON.stringify(msg.payload)}</payload>` : ''
                    }`)
                .join('\n');
        }

        return `You are Ali, the Action Agent. Your role is to handle action-based requests like updating user information and managing emails.

IMPORTANT GUIDELINES:

1. Email Style:
- Always write in English, regardless of input language
- Use a warm, personal, and sympathetic tone
- Keep it professional but friendly
- Be direct and clear
- Include greetings and sign-offs as specified by user

2. Email Context:
- For updates/edits, maintain the core message while adjusting style/length
- For translations, keep the same structure but in English
- Remember previous context (subject, key points, sign-offs)

3. Name Updates:
- Handle name changes professionally
- Confirm the new name clearly
- Keep it simple and direct

${formContext}

CONVERSATION HISTORY:
${conversationHistory}

ALWAYS use the extractFormAction tool with this format:

For emails:
{
  "action": "sendMail",
  "values": {
    "subject": "Clear, concise subject",
    "body": "Warm, personal content in English"
  }
}

For name updates:
{
  "action": "updateName",
  "values": {
    "name": "New name value"
  }
}

Remember: Keep the core message intact while adapting style and language as needed.`;
    }

    private readonly tools = [
        {
            name: 'extractFormAction',
            description: 'Extract form action and field values from user messages',
            input_schema: {
                type: 'object',
                properties: {
                    action: {
                        type: 'string',
                        enum: ['updateName', 'sendMail'],
                        description: 'The type of form action to perform'
                    },
                    values: {
                        type: 'object',
                        description: 'Form field values',
                        additionalProperties: true
                    }
                },
                required: ['action', 'values']
            }
        }
    ];

    private getFieldsForAction(action: string, values: Record<string, any>) {
        switch (action) {
            case 'updateName':
                return [{
                    name: 'name',
                    type: 'text',
                    title: 'What is your name?',
                    value: values.name || ''
                }];
            case 'sendMail':
                return [
                    {
                        name: 'subject',
                        type: 'text',
                        title: "What's the topic?",
                        value: values.subject || ''
                    },
                    {
                        name: 'body',
                        type: 'textarea',
                        title: 'Your message',
                        value: values.body || ''
                    }
                ];
            default:
                return Object.entries(values).map(([name, value]) => ({
                    name,
                    type: typeof value === 'string' ? 'text' : 'textarea',
                    title: name.charAt(0).toUpperCase() + name.slice(1),
                    value: value || ''
                }));
        }
    }

    async processRequest(userMessage: string, context?: any): Promise<AgentResponse> {
        const pendingMsgId = crypto.randomUUID();
        const requestId = crypto.randomUUID();

        try {
            agentLogger.log(this.agentName, `[${requestId}] Starting action request`, {
                userMessage,
                contextPresent: !!context
            });

            // Add the current request to the form context store
            this.formContextStore.update(forms => {
                const newForms = [...forms, {
                    requestId,
                    userMessage,
                    timestamp: new Date().toISOString()
                }];
                // Keep only last 5 requests
                return newForms.slice(-5);
            });

            conversationManager.addMessage({
                id: pendingMsgId,
                agent: this.agentName,
                content: 'Processing your request...',
                timestamp: new Date().toISOString(),
                status: 'pending'
            });

            const claudeResponse = await this.getClaudeResponse(userMessage, requestId);
            const toolUseResult = this.extractToolUse(claudeResponse, requestId);

            if (!toolUseResult.success) {
                throw new Error(toolUseResult.error);
            }

            const { action, values } = toolUseResult.data;
            const formId = crypto.randomUUID();

            // Store the form context
            this.formContextStore.update(forms => {
                const newForms = [...forms, { action, values, formId, timestamp: new Date().toISOString() }];
                // Keep only the last 5 forms
                return newForms.slice(-5);
            });

            agentLogger.log(this.agentName, `[${requestId}] Creating form configuration`, {
                action,
                values,
                formId
            });

            const viewConfig = this.createViewConfig(action, values, formId);
            const message = this.createResponseMessage(action, values);

            agentLogger.log(this.agentName, `[${requestId}] Request processed successfully`, {
                action,
                formId,
                messageId: pendingMsgId
            });

            conversationManager.updateMessage(pendingMsgId, {
                content: message,
                status: 'complete',
                payload: {
                    type: 'action',
                    data: viewConfig
                }
            });

            return {
                success: true,
                message: {
                    agent: this.agentName,
                    content: message,
                    payload: {
                        type: 'action',
                        data: viewConfig
                    }
                }
            };

        } catch (error) {
            agentLogger.error(this.agentName, `[${requestId}] Request failed`, {
                error: error instanceof Error ? error.message : 'Unknown error',
                userMessage,
                timestamp: new Date().toISOString()
            });

            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            conversationManager.updateMessage(pendingMsgId, {
                content: `Sorry, I couldn't process that: ${errorMessage}`,
                status: 'error',
                payload: { type: 'error', data: { error: errorMessage } }
            });
            return { success: false, error: errorMessage };
        }
    }

    private async getClaudeResponse(userMessage: string, requestId: string) {
        agentLogger.log(this.agentName, `[${requestId}] Calling Claude API`, {
            userMessage,
            systemPromptLength: this.getSystemPrompt().length,
            toolsCount: this.tools.length
        });

        const response = await client.mutate<ClaudeResponse>({
            operationName: 'askClaude',
            input: {
                messages: [{ role: 'user', content: userMessage }],
                system: this.getSystemPrompt(),
                tools: this.tools,
                temperature: 0.7
            }
        });

        agentLogger.log(this.agentName, `[${requestId}] Claude API response received`, {
            responseId: response.data.id,
            contentTypes: response.data.content.map(c => c.type)
        });

        return response;
    }

    private extractToolUse(response: ClaudeResponse, requestId: string): {
        success: boolean;
        data?: { action: string; values: Record<string, any> };
        error?: string
    } {
        const toolUseContent = response.data.content.find(c => c.type === 'tool_use');

        agentLogger.log(this.agentName, `[${requestId}] Extracting tool use`, {
            hasToolUse: !!toolUseContent,
            toolUseContent: toolUseContent ? JSON.stringify(toolUseContent) : 'none'
        });

        if (!toolUseContent?.input) {
            return {
                success: false,
                error: 'No valid tool use response from Claude'
            };
        }

        try {
            const { action, values } = toolUseContent.input;

            if (!action || !values) {
                return {
                    success: false,
                    error: 'Invalid tool use format: missing action or values'
                };
            }

            return {
                success: true,
                data: { action, values }
            };
        } catch (error) {
            return {
                success: false,
                error: 'Failed to parse tool use response'
            };
        }
    }

    private createViewConfig(action: string, values: Record<string, any>, formId: string) {
        return {
            id: "MainContainer",
            layout: {
                areas: "'content'",
                columns: "1fr",
                rows: "1fr",
                overflow: "auto",
                style: "p-4 max-w-7xl mx-auto"
            },
            children: [
                {
                    id: `${action}Container`,
                    component: 'HominioForm',
                    slot: 'content',
                    data: {
                        formId,
                        form: {
                            fields: this.getFieldsForAction(action, values),
                            validators: action,
                            submitAction: action === 'updateName' ? 'updateMe' : 'sendMail'
                        }
                    }
                }
            ]
        };
    }

    private createResponseMessage(action: string, values: Record<string, any>): string {
        const messages = {
            updateName: `I've prepared a name update form with "${values.name}". Please review:`,
            sendMail: "I've prepared an email for you. Please review:"
        };

        return messages[action] || "Please review your request:";
    }
}

export const aliAgent = new AliAgent();