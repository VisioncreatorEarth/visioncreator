import type { AgentResponse, AgentType, ClaudeResponse, MockResponse } from '../types/agent.types';
import { conversationManager } from '$lib/stores/intentStore';
import { client } from '$lib/wundergraph';
import { vroniAgent } from './agentVroni';
import { agentLogger } from '$lib/utils/logger';

export class HominioAgent {
    private readonly systemPrompt = `You are Hominio, the delegation specialist. Your role is to analyze user requests and delegate tasks to the appropriate specialized agent.

IMPORTANT: You must ALWAYS use the delegate_task tool to assign tasks to other agents. Never try to handle tasks directly.

Available agents:
- vroni: UI and Navigation specialist (handles all view-related requests)
- ali: Task management specialist
- walter: Data analysis specialist
- bert: General assistance specialist

For ANY request related to viewing, navigating, or showing UI components, ALWAYS delegate to vroni.
For task management requests, delegate to ali.
For data analysis requests, delegate to walter.
For general assistance, delegate to bert.

When delegating:
1. Identify the appropriate agent
2. Use the delegate_task tool
3. Provide clear reasoning for the delegation

Example delegation for a view request:
{
  "type": "tool_use",
  "name": "delegate_task",
  "input": {
    "to": "vroni",
    "task": "Navigate to the banking view",
    "reasoning": "This is a UI navigation request that requires Vroni's expertise in handling view transitions"
  }
}`;

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
        let pendingMsgId = crypto.randomUUID();

        try {
            agentLogger.log(this.agentName, 'Starting request processing', { userMessage });

            // Add user message to conversation
            conversationManager.addMessage({
                id: crypto.randomUUID(),
                agent: 'user',
                content: userMessage,
                timestamp: new Date().toISOString(),
                status: 'complete'
            });

            // Initial Hominio message
            conversationManager.addMessage({
                id: pendingMsgId,
                agent: this.agentName,
                content: 'Let me help you with that...',
                timestamp: new Date().toISOString(),
                status: 'pending'
            });

            // First Claude call to get delegation
            const response = await client.mutate<ClaudeResponse>({
                operationName: 'askClaude',
                input: {
                    messages: [{
                        role: 'user',
                        content: userMessage
                    }],
                    system: this.systemPrompt,
                    tools: this.tools,
                    temperature: 0.7
                }
            });

            agentLogger.log(this.agentName, 'Initial Claude response', {
                response: response?.data
            });

            // Extract tool use from response
            const toolUse = response?.data?.content?.find(c => c.type === 'tool_use')?.tool_use;
            const textContent = response?.data?.content?.find(c => c.type === 'text')?.text;

            // Update Hominio's message with Claude's text response
            conversationManager.updateMessage(pendingMsgId, {
                content: textContent || 'Processing your request...',
                status: 'complete',
                payload: {
                    type: 'text',
                    data: { originalResponse: response.data }
                }
            });

            if (!toolUse) {
                // If no tool use, try direct view handling
                if (userMessage.toLowerCase().includes('banking')) {
                    agentLogger.log(this.agentName, 'Direct banking view request detected');
                    return await vroniAgent.processRequest('Show the Banking view', {
                        delegatedFrom: {
                            agent: this.agentName,
                            reasoning: 'Direct banking view request'
                        }
                    });
                }
                throw new Error('No tool use response and no direct view match');
            }

            const { id: toolUseId, name, input } = toolUse;

            agentLogger.log(this.agentName, 'Processing tool use', {
                toolUseId,
                name,
                input
            });

            if (name === 'delegate_task' && input.to === 'vroni') {
                // Execute Vroni delegation
                const vroniResponse = await vroniAgent.processRequest(input.task, {
                    delegatedFrom: {
                        agent: this.agentName,
                        reasoning: input.reasoning
                    }
                });

                agentLogger.log(this.agentName, 'Vroni response received', {
                    success: vroniResponse.success,
                    error: vroniResponse.error
                });

                // Send tool result back to Claude
                const toolResultResponse = await client.mutate<ClaudeResponse>({
                    operationName: 'askClaude',
                    input: {
                        messages: [
                            {
                                role: 'user',
                                content: [
                                    {
                                        type: 'tool_result',
                                        tool_use_id: toolUseId,
                                        content: vroniResponse.success
                                            ? 'View successfully displayed'
                                            : vroniResponse.error,
                                        is_error: !vroniResponse.success
                                    }
                                ]
                            }
                        ]
                    }
                });

                agentLogger.log(this.agentName, 'Tool result sent', {
                    toolResultResponse
                });

                return { success: true };
            }

            throw new Error(`Unexpected tool use: ${name}`);

        } catch (error) {
            agentLogger.log(this.agentName, 'Error processing request', { error }, 'error');

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

