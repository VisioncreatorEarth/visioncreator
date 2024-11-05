import type { AgentResponse, AgentType, ClaudeResponse, MockResponse } from '../types/agent.types';
import { conversationManager } from '$lib/stores/intentStore';
import { client } from '$lib/wundergraph';
import { vroniAgent } from './agentVroni';
import { aliAgent } from './agentAli';
import { persist, createIndexedDBStorage } from '@macfja/svelte-persistent-store';
import { writable } from 'svelte/store';

export class HominioAgent {
    private readonly agentName = 'hominio';
    private delegationStore = persist(
        writable<Record<string, any>[]>([]),
        createIndexedDBStorage(),
        'hominio-delegation-context'
    );

    private getSystemPrompt(context?: any): string {
        let delegationHistory = '';
        let conversationHistory = '';

        // Get delegation history from persistent store
        this.delegationStore.subscribe(history => {
            if (history.length > 0) {
                delegationHistory = `\nDelegation History:\n${JSON.stringify(history, null, 2)}`;
            }
        })();

        // Get full conversation history
        const messages = conversationManager.getMessageContext();
        conversationHistory = messages
            .map(msg => `[${msg.agent}]: ${msg.content}${msg.payload ? `\n<payload>${JSON.stringify(msg.payload)}</payload>` : ''
                }`)
            .join('\n');

        return `You are Hominio, the delegation specialist. Your role is to analyze user requests and delegate tasks to the appropriate specialized agent.

${delegationHistory}

CONVERSATION HISTORY:
${conversationHistory}

IMPORTANT: You must ALWAYS use the delegate_task tool to assign tasks to the appropriate agent.

When delegating:
1. Create a warm, friendly message for the user (1-2 sentences)
   - Use a personal, empathetic tone
   - Include relevant emojis
   - Focus on what you're going to help them with
   - Examples:
     - "I'll help you update your name right away! ✨"
     - "Let me show you your banking information! 🏦"
     - "I'll get that email started for you! 📧"

2. Provide technical reasoning for the system (not shown to user)
   - Explain why this agent was chosen
   - Include relevant context
   - Be precise and technical

Available agents and their responsibilities:

1. ali (Action Agent):
   - Handles all user information updates (e.g., "change my name to X")
   - Manages email composition and editing
   - Processes form submissions and data updates
   - Examples:
     - "I want to change my name to X"
     - "Update my name"
     - "Write an email"
     - "Edit the last email"

2. vroni (UI/Navigation Agent):
   - Handles navigation requests
   - Shows dashboards and views
   - Manages UI components and layouts
   - Examples:
     - "Show me the dashboard"
     - "Open the Kanban board"
     - "Take me to settings"

DELEGATION RULES:
- For name changes or email tasks → ALWAYS delegate to ali
- For viewing or navigation requests → ALWAYS delegate to vroni

Examples of correct delegation:
1. User: "I want to change my name to John"
   → Delegate to ali: "Hey ali, please help update the user's name to John"

2. User: "Show me the settings"
   → Delegate to vroni: "Vroni, please show the user their settings view"

3. User: "I need to write an email"
   → Delegate to ali: "Hey ali, please help the user compose a new email"

Please analyze the conversation context carefully to understand the user's true intent before delegating.`;
    }

    private readonly tools = [
        {
            name: "delegate_task",
            description: "Delegate a user request to the appropriate agent",
            input_schema: {
                type: "object",
                properties: {
                    to: {
                        type: "string",
                        description: "The agent to delegate to (ali, vroni)",
                        enum: ["ali", "vroni"]
                    },
                    task: {
                        type: "string",
                        description: "The specific task to be performed"
                    },
                    userMessage: {
                        type: "string",
                        description: "A friendly, personal message to show to the user"
                    },
                    reasoning: {
                        type: "string",
                        description: "Technical explanation of why this agent was chosen"
                    }
                },
                required: ["to", "task", "userMessage", "reasoning"]
            }
        }
    ];

    async processRequest(userMessage: string): Promise<AgentResponse> {
        const requestId = crypto.randomUUID();

        try {
            // Store delegation request
            this.delegationStore.update(history => {
                const newHistory = [...history, {
                    requestId,
                    userMessage,
                    timestamp: new Date().toISOString()
                }];
                return newHistory.slice(-5); // Keep last 5 delegation requests
            });

            const currentConversation = conversationManager.getCurrentConversation();

            // Add user message
            conversationManager.addMessage({
                id: crypto.randomUUID(),
                agent: 'user',
                content: userMessage,
                timestamp: new Date().toISOString(),
                status: 'complete'
            });

            // Add pending message
            conversationManager.addMessage({
                id: requestId,
                agent: this.agentName,
                content: 'Analyzing your request...',
                status: 'pending',
                timestamp: new Date().toISOString()
            });

            const messages = this.prepareMessagesForClaude(
                currentConversation?.messages || [],
                userMessage
            );

            const claudeResponse = await client.mutate<ClaudeResponse>({
                operationName: 'askClaude',
                input: {
                    messages,
                    system: this.getSystemPrompt(),
                    tools: this.tools
                }
            });

            // Extract tool use from Claude response
            const toolUseContent = claudeResponse?.data?.content?.find(c => c.type === 'tool_use');

            if (!toolUseContent) {
                throw new Error('No tool use response found');
            }

            // Extract delegation details
            const delegation = toolUseContent?.input;
            if (!delegation || !delegation.to || !delegation.task || !delegation.userMessage) {
                throw new Error('Invalid delegation structure');
            }

            // Update message with Claude's generated friendly message
            conversationManager.updateMessage(requestId, {
                content: delegation.userMessage,
                status: 'complete',
                payload: {
                    type: 'delegation',
                    data: {
                        to: delegation.to,
                        task: delegation.task,
                        reasoning: delegation.reasoning
                    }
                }
            });

            // Handle delegation
            if (delegation.to === 'vroni') {
                return await vroniAgent.processRequest(delegation.task, {
                    delegatedFrom: {
                        agent: this.agentName,
                        reasoning: delegation.reasoning
                    },
                    userMessage,
                });
            } else if (delegation.to === 'ali') {
                return await aliAgent.processRequest(delegation.task, {
                    delegatedFrom: {
                        agent: this.agentName,
                        reasoning: delegation.reasoning
                    },
                    userMessage,
                });
            }

            throw new Error(`Unsupported delegation target: ${delegation.to}`);

        } catch (error) {
            conversationManager.updateMessage(requestId, {
                content: "I'm sorry, I couldn't process that request right now. Could you try asking in a different way? 🙏",
                status: 'error',
                payload: {
                    type: 'error',
                    data: {
                        error: error instanceof Error ? error.message : 'Unknown error'
                    }
                }
            });

            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    private prepareMessagesForClaude(conversationHistory: Message[], currentMessage: string): { role: 'user' | 'assistant', content: string }[] {
        const messages: { role: 'user' | 'assistant', content: string }[] = [];

        for (const msg of conversationHistory) {
            if (msg.status === 'complete') {
                if (msg.agent === 'user') {
                    messages.push({
                        role: 'user',
                        content: msg.content
                    });
                } else {
                    // Format assistant messages to include agent name and payload
                    let content = `[${msg.agent}] ${msg.content}`;
                    if (msg.payload) {
                        content += `\n<payload type="${msg.payload.type}">${JSON.stringify(msg.payload.data)}</payload>`;
                    }
                    messages.push({
                        role: 'assistant',
                        content
                    });
                }
            }
        }

        // Add current message if not already in history
        if (!messages.some(m => m.role === 'user' && m.content === currentMessage)) {
            messages.push({
                role: 'user',
                content: currentMessage
            });
        }

        return messages;
    }

    private handleMockResponse(agent: string, task: string, reasoning: string) {
        const mockResponse = this.getMockResponse(agent, task);

        conversationManager.addMessage({
            id: crypto.randomUUID(),
            agent: agent as AgentType,
            content: mockResponse.content,
            timestamp: new Date().toISOString(),
            status: 'complete',
            payload: {
                type: mockResponse.type,
                data: mockResponse.data,
                reasoning
            }
        });
    }

    private getMockResponse(agent: string, task: string): MockResponse {
        const mockResponses: Record<string, (task: string) => MockResponse> = {
            vroni: (task: string) => ({
                type: 'navigation',
                content: `Navigating to ${task.toLowerCase()}...`,
                data: {
                    view: task.toLowerCase().replace(/[^a-z0-9]/g, '-'),
                    action: 'navigate'
                }
            }),
            ali: (task: string) => ({
                type: 'action',
                content: `Executing task: ${task}`,
                data: {
                    action: 'email',
                    status: 'completed'
                }
            }),
            banki: (task: string) => ({
                type: 'banking',
                content: `Here's your banking information`,
                data: {
                    balance: '$5,000',
                    recentTransactions: [
                        { date: '2024-03-31', amount: -50, description: 'Coffee Shop' },
                        { date: '2024-03-30', amount: 1000, description: 'Salary' }
                    ]
                }
            })
        };

        return mockResponses[agent]?.(task) || {
            type: 'unknown',
            content: `Processing: ${task}`,
            data: null
        };
    }
}

export const hominioAgent = new HominioAgent();

