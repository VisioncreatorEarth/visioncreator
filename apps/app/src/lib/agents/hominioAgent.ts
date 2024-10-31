import type { AgentResponse, AgentType, ClaudeResponse, MockResponse } from '../types/agent.types';
import { conversationManager } from '$lib/stores/intentStore';
import { client } from '$lib/wundergraph';

export class HominioAgent {
    private readonly tools: AgentTool[] = [
        {
            name: "delegate_task",
            description: "Delegate a user request to the appropriate agent",
            input_schema: {
                type: "object",
                properties: {
                    to: {
                        type: "string",
                        description: "The agent to delegate to (ali, vroni, walter, bert)",
                        enum: ["ali", "vroni", "walter", "bert"]
                    },
                    task: {
                        type: "string",
                        description: "The specific task to be performed"
                    },
                    reasoning: {
                        type: "string",
                        description: "Why this agent was chosen"
                    }
                },
                required: ["to", "task", "reasoning"]
            }
        }
    ];

    private readonly systemPrompt = `You are Hominio, a friendly delegation agent that helps users by routing their requests to specialized sub-agents. When you need clarification:
1. Be friendly and helpful
2. Explain why you need more information
3. Provide specific examples of what information would help
4. Format your response in a conversational way

Your available agents are:

1. Ali (ali): Actions & Operations
   - Sending emails
   - Form submissions
   - Task execution

2. Vroni (vroni): UI & Navigation
   - View switching
   - Page navigation
   - UI components

3. Walter (walter): Data & APIs
   - Database queries
   - API operations
   - Data fetching

4. Bert (bert): Lists & Collections
   - Shopping lists
   - Task lists
   - Collection management`;

    async processRequest(userMessage: string): Promise<AgentResponse> {
        let pendingMsgId = crypto.randomUUID();

        try {
            console.log('HominioAgent - Starting request processing:', { userMessage });

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
                id: pendingMsgId,
                agent: 'hominio',
                content: 'Let me help you with that...',
                timestamp: new Date().toISOString(),
                status: 'pending'
            });

            const response = await client.mutate<ClaudeResponse>({
                operationName: 'askClaude',
                input: {
                    messages: [{ role: 'user', content: userMessage }],
                    system: this.systemPrompt,
                    tools: this.tools,
                    temperature: 0.7
                }
            });

            if (!response?.data?.content?.length) {
                throw new Error('Invalid or empty Claude response');
            }

            const textContent = response.data.content.find(c => c.type === 'text')?.text;
            const toolUse = response.data.content.find(c => c.type === 'tool_use');

            // Update Hominio's message with text content
            if (textContent) {
                conversationManager.updateMessage(pendingMsgId, {
                    content: textContent,
                    status: 'complete',
                    payload: {
                        type: 'text',
                        data: { originalResponse: response.data }
                    }
                });
            }

            // Handle delegation
            if (toolUse?.name === 'delegate_task' && toolUse.input) {
                const { to, task, reasoning } = toolUse.input;
                const mockResponse = this.getMockResponse(to, task);

                conversationManager.addMessage({
                    id: crypto.randomUUID(),
                    agent: to,
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

            return { success: true };

        } catch (error) {
            console.error('HominioAgent - Error:', error);

            conversationManager.updateMessage(pendingMsgId, {
                content: 'I encountered an error. Could you please try again?',
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

