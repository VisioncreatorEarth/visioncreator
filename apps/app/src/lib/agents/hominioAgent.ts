import type { AgentResponse, AgentType, ClaudeResponse, MockResponse } from '../types/agent.types';
import { conversationManager } from '$lib/stores/intentStore';
import { client } from '$lib/wundergraph';
import { vroniAgent } from './agentVroni';
import { agentLogger } from '$lib/utils/logger';

export class HominioAgent {
    private readonly systemPrompt = `You are Hominio, the delegation specialist. Your role is to analyze user requests and delegate tasks to the appropriate specialized agent.

IMPORTANT: You must ALWAYS use the delegate_task tool to assign tasks to other agents. Never try to handle tasks directly.

Available agents:
- vroni: UI and Navigation specialist (handles ALL view-related requests)
- ali: Task management specialist
- walter: Data analysis specialist
- bert: General assistance specialist

For ANY request related to viewing, navigating, or showing UI components, ALWAYS delegate to vroni.
For task management requests, delegate to ali.
For data analysis requests, delegate to walter.
For general assistance, delegate to bert.`;

    private readonly tools = [
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

    private readonly agentName = 'hominio';

    async processRequest(userMessage: string): Promise<AgentResponse> {
        const pendingMsgId = crypto.randomUUID();

        try {
            agentLogger.log(this.agentName, 'Starting request processing', { userMessage });

            // First add the user's message to the conversation
            conversationManager.addMessage({
                id: crypto.randomUUID(),
                agent: 'user',
                content: userMessage,
                timestamp: new Date().toISOString(),
                status: 'complete'
            });

            // Then add Hominio's pending message
            conversationManager.addMessage({
                id: pendingMsgId,
                agent: this.agentName,
                content: 'Let me help you with that...',
                timestamp: new Date().toISOString(),
                status: 'pending'
            });

            const claudeResponse = await client.mutate<ClaudeResponse>({
                operationName: 'askClaude',
                input: {
                    messages: [{ role: 'user', content: userMessage }],
                    system: this.systemPrompt,
                    tools: this.tools,
                    temperature: 0.7
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
                agentLogger.log(this.agentName, 'No tool use found in response', {
                    content: claudeResponse?.data?.content
                });
                throw new Error('No tool use response found');
            }

            // Extract delegation details
            const delegation = toolUseContent.input;
            if (!delegation || !delegation.to || !delegation.task) {
                throw new Error('Invalid delegation structure');
            }

            // Handle delegation to Vroni
            if (delegation.to === 'vroni') {
                agentLogger.log(this.agentName, 'Delegating to Vroni', {
                    task: delegation.task,
                    reasoning: delegation.reasoning
                });

                return await vroniAgent.processRequest(delegation.task, {
                    delegatedFrom: {
                        agent: this.agentName,
                        reasoning: delegation.reasoning
                    },
                    conversationHistory: []
                });
            }

            throw new Error(`Unsupported delegation target: ${delegation.to}`);

        } catch (error) {
            agentLogger.log(this.agentName, 'Error processing request', {
                error,
                userMessage
            }, 'error');

            conversationManager.updateMessage(pendingMsgId, {
                content: 'I encountered an error while processing your request. Could you please try again?',
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

