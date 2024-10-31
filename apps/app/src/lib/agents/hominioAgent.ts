import { type AgentResponse, type ClaudeResponse } from '../types/agent.types';
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
        try {
            console.log('HominioAgent - Processing request:', { userMessage });

            // Add user message
            conversationManager.addMessage({
                agent: 'user',
                content: userMessage,
                status: 'complete'
            });

            // Add pending hominio message
            const pendingMsg = conversationManager.addMessage({
                agent: 'hominio',
                content: 'Let me help you with that...',
                status: 'pending'
            });

            const response = await client.mutate<ClaudeResponse>({
                operationName: 'askHominio',
                input: {
                    messages: [{ role: 'user', content: userMessage }],
                    system: this.systemPrompt,
                    tools: this.tools,
                    temperature: 0.7
                }
            });

            console.log('HominioAgent - Claude response:', response);

            if (!response?.data?.askHominio) {
                throw new Error('Invalid response from Claude');
            }

            const claudeResponse = response.data.askHominio;

            // Handle clarification requests
            if (claudeResponse.stop_reason === 'end_turn') {
                const clarificationMsg = {
                    agent: 'hominio' as const,
                    content: claudeResponse.content,
                    status: 'complete' as const,
                    payload: {
                        type: 'clarification',
                        content: claudeResponse.content,
                        examples: claudeResponse.content.split('\n').filter(line => line.startsWith('-')),
                        needsResponse: true
                    }
                };

                // Update pending message with clarification
                conversationManager.updateMessage(pendingMsg.id, clarificationMsg);

                return {
                    success: true,
                    message: {
                        id: pendingMsg.id,
                        ...clarificationMsg
                    }
                };
            }

            // Handle tool use
            if (claudeResponse.stop_reason === 'tool_use') {
                const toolCall = JSON.parse(claudeResponse.content);
                console.log('HominioAgent - Tool call:', toolCall);

                const delegation = toolCall.delegate_task;

                // Update hominio message
                conversationManager.updateMessage(pendingMsg.id, {
                    content: `I'll help you with that! I'm delegating this to ${delegation.to} who will ${delegation.task}`,
                    status: 'complete',
                    payload: {
                        type: 'delegation',
                        content: delegation
                    }
                });

                // Add delegated agent message
                const agentMsg = conversationManager.addMessage({
                    agent: delegation.to,
                    content: `Working on: ${delegation.task}`,
                    status: 'pending',
                    payload: {
                        type: 'task',
                        content: {
                            task: delegation.task,
                            reasoning: delegation.reasoning
                        }
                    }
                });

                return {
                    success: true,
                    message: {
                        id: agentMsg.id,
                        agent: delegation.to,
                        content: delegation.task,
                        status: 'pending',
                        payload: { delegation }
                    }
                };
            }

            throw new Error('Unexpected response type from Claude');

        } catch (error) {
            console.error('HominioAgent - Error:', error);

            const errorMsg = error instanceof Error ? error.message : 'Unknown error';

            const errorResponse = {
                success: false,
                message: {
                    agent: 'hominio',
                    content: `I encountered an error: ${errorMsg}. Could you please try again?`,
                    status: 'error',
                    payload: {
                        type: 'error',
                        content: { error: errorMsg }
                    }
                }
            };

            conversationManager.addMessage({
                agent: 'hominio',
                content: errorResponse.message.content,
                status: 'error',
                payload: errorResponse.message.payload
            });

            return errorResponse;
        }
    }
}

export const hominioAgent = new HominioAgent();

