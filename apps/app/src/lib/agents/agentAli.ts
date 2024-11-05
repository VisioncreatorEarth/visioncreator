import type { AgentResponse, ClaudeResponse } from '../types/agent.types';
import { conversationManager } from '$lib/stores/intentStore';
import { client } from '$lib/wundergraph';
import { agentLogger } from '$lib/utils/logger';

interface FormContext {
    formId: string;
    action: string;
    timestamp: string;
    values: Record<string, any>;
    component: string;
}

export class AliAgent {
    private readonly agentName = 'ali';

    // Generic form context tracking
    private formContexts: FormContext[] = [];
    private readonly MAX_CONTEXTS = 5; // Keep track of last 5 forms

    private readonly systemPrompt = `You are Ali, the Action Agent. Your role is to handle action-based requests like updating user information and managing emails.

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

    private addFormContext(context: FormContext) {
        this.formContexts.unshift(context);
        if (this.formContexts.length > this.MAX_CONTEXTS) {
            this.formContexts.pop();
        }
    }

    private getLatestFormContext(action: string) {
        return this.formContexts.find(ctx => ctx.action === action);
    }

    async processRequest(userMessage: string, context?: any): Promise<AgentResponse> {
        const pendingMsgId = crypto.randomUUID();

        try {
            agentLogger.log(this.agentName, 'Starting action request', {
                userMessage,
                contextPresent: !!context,
                formContexts: this.formContexts
            });

            conversationManager.addMessage({
                id: pendingMsgId,
                agent: this.agentName,
                content: 'Processing your request...',
                timestamp: new Date().toISOString(),
                status: 'pending'
            });

            // Get Claude's response
            const claudeResponse = await client.mutate<ClaudeResponse>({
                operationName: 'askClaude',
                input: {
                    messages: [{ role: 'user', content: userMessage }],
                    system: this.systemPrompt,
                    tools: this.tools,
                    temperature: 0.7
                }
            });

            const toolUseContent = claudeResponse.data.content.find(c => c.type === 'tool_use');
            if (!toolUseContent?.input) throw new Error('No valid response from Claude');

            const { action, values } = toolUseContent.input;
            const formId = crypto.randomUUID();

            // Simple form configuration
            const viewConfig = {
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

            // Store context for future reference
            this.addFormContext({
                formId,
                action,
                timestamp: new Date().toISOString(),
                values,
                component: 'HominioForm'
            });

            const messages = {
                updateName: `I've prepared a name update form with "${values.name}". Please review:`,
                sendMail: "I've prepared an email for you. Please review:"
            };

            const message = messages[action] || "Please review your request:";

            conversationManager.updateMessage(pendingMsgId, {
                content: message,
                status: 'complete',
                payload: {
                    type: 'action',
                    data: viewConfig
                }
            });

            return { success: true, message: { agent: this.agentName, content: message, payload: { type: 'action', data: viewConfig } } };

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            conversationManager.updateMessage(pendingMsgId, {
                content: `Sorry, I couldn't process that: ${errorMessage}`,
                status: 'error',
                payload: { type: 'error', data: { error: errorMessage } }
            });
            return { success: false, error: errorMessage };
        }
    }

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
}

export const aliAgent = new AliAgent();