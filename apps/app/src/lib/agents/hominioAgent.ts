import type { AgentResponse, AgentType, ClaudeResponse, MockResponse } from '../types/agent.types';
import { conversationManager } from '$lib/stores/intentStore';
import { client } from '$lib/wundergraph';
import { vroniAgent } from './agentVroni';

export class HominioAgent {
    private readonly systemPrompt = `You are Hominio, the delegation specialist. Your role is to analyze user requests and delegate tasks to the appropriate specialized agent.

IMPORTANT: You must ALWAYS use the delegate_task tool to assign tasks to other agents. Never try to handle tasks directly.

Available agents:
- vroni: UI and Navigation specialist (handles ALL view-related requests)
- ali: Task management specialist


For ANY request related to viewing, navigating, or showing UI components, ALWAYS delegate to vroni.
For task management requests, delegate to ali.
`;

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
                    reasoning: {
                        type: "string",
                        description: "Why this agent was chosen"
                    }
                },
                required: ["to", "task", "reasoning"]
            }
        }
    ];

    private readonly agentName = 'hominio';

    async processRequest(userMessage: string): Promise<AgentResponse> {
        const pendingMsgId = crypto.randomUUID();

        try {
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
                id: pendingMsgId,
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
                    system: this.systemPrompt,
                    tools: this.tools
                }
            });

            // Extract the text response from Claude
            const textContent = claudeResponse?.data?.content?.find(c => c.type === 'text');
            if (textContent?.text) {
                // Update the pending message with Claude's delegation text
                conversationManager.updateMessage(pendingMsgId, {
                    content: textContent.text,
                    status: 'processing'
                });
            }

            // Extract tool use from Claude response
            const toolUseContent = claudeResponse?.data?.content?.find(c => c.type === 'tool_use');

            if (!toolUseContent) {
                throw new Error('No tool use response found');
            }

            // Extract delegation details
            const delegation = toolUseContent?.input;
            if (!delegation || !delegation.to || !delegation.task) {
                throw new Error('Invalid delegation structure');
            }

            // Handle delegation to Vroni with full context
            if (delegation.to === 'vroni') {
                return await vroniAgent.processRequest(delegation.task, {
                    delegatedFrom: {
                        agent: this.agentName,
                        reasoning: delegation.reasoning
                    },
                    conversationHistory: currentConversation?.messages || [],
                    userMessage
                });
            }

            throw new Error(`Unsupported delegation target: ${delegation.to}`);

        } catch (error) {
            conversationManager.updateMessage(pendingMsgId, {
                content: 'Sorry, I could not process that request.',
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

    private prepareMessagesForClaude(conversationHistory: Message[], currentMessage: string) {
        const messages = [];

        // Add conversation history
        for (const msg of conversationHistory) {
            if (msg.status === 'complete') {
                if (msg.agent === 'user') {
                    messages.push({
                        role: 'user',
                        content: msg.content
                    });
                } else {
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
