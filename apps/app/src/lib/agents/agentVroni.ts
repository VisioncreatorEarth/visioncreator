import type { AgentResponse, ClaudeResponse } from '../types/agent.types';
import { conversationManager } from '$lib/stores/intentStore';
import { client } from '$lib/wundergraph';
import { agentLogger } from '$lib/utils/logger';
import { dynamicView } from '$lib/stores';

export class VroniAgent {
    private readonly agentName = 'vroni';
    private readonly systemPrompt = `You are Vroni, the UI and Navigation specialist. Your role is to handle all view-related requests.

IMPORTANT: You must ALWAYS use the compose_view tool to generate view configurations.

Available components and their purposes:
- o-HelloEarth: Main dashboard/welcome view for general overview and home screen
- o-Bring: Shopping and item management for lists and purchases
- o-Banking: Financial information, transactions, and account management
- o-AirBNB: Accommodation bookings and property management
- o-Splitwise: Expense sharing and group cost tracking
- o-Kanban: Task management, to-do lists, and project organization

Analyze the user's request and select the most appropriate component. Examples:
- "Show my tasks" → o-Kanban
- "I need to see my shopping list" → o-Bring
- "Show me my expenses" → o-Splitwise
- "Check my account" → o-Banking
- "Show my bookings" → o-AirBNB
- "Go to dashboard" → o-HelloEarth

Always respond with a compose_view tool use that specifies the appropriate component based on the user's intent.`;

    private readonly tools = [
        {
            name: "compose_view",
            description: "Generate a view configuration for the UI",
            input_schema: {
                type: "object",
                properties: {
                    component: {
                        type: "string",
                        description: "The component to display",
                        enum: ["o-HelloEarth", "o-Bring", "o-Banking", "o-AirBNB", "o-Splitwise", "o-Kanban"]
                    }
                },
                required: ["component"]
            }
        }
    ];

    async processRequest(userMessage: string, context?: any): Promise<AgentResponse> {
        const pendingMsgId = crypto.randomUUID();

        try {
            agentLogger.log(this.agentName, 'Starting view request', {
                userMessage,
                contextPresent: !!context,
                historyLength: context?.conversationHistory?.length
            });

            conversationManager.addMessage({
                id: pendingMsgId,
                agent: this.agentName,
                content: 'Preparing your view...',
                timestamp: new Date().toISOString(),
                status: 'pending'
            });

            const messages = [
                ...(context?.conversationHistory || [])
                    .filter(msg => msg.content && msg.status === 'complete')
                    .map(msg => ({
                        role: msg.agent === 'user' ? 'user' : 'assistant',
                        content: msg.content
                    })),
                { role: 'user', content: userMessage }
            ];


            const claudeResponse = await client.mutate<ClaudeResponse>({
                operationName: 'askClaude',
                input: {
                    messages,
                    system: this.systemPrompt,
                    tools: this.tools,
                    temperature: 0.7
                }
            });

            const toolUseContent = claudeResponse.data.content.find(c => c.type === 'tool_use');

            agentLogger.log(this.agentName, 'Tool use content found', {
                toolUseContent,
                hasToolUse: !!toolUseContent,
                properties: toolUseContent ? Object.keys(toolUseContent) : []
            });

            if (!toolUseContent || toolUseContent.name !== 'compose_view' || !toolUseContent.input?.component) {
                agentLogger.log(this.agentName, 'Invalid tool use validation', {
                    hasToolUseContent: !!toolUseContent,
                    name: toolUseContent?.name,
                    hasComponent: !!toolUseContent?.input?.component,
                    rawContent: claudeResponse.data.content
                });
                throw new Error('Invalid view configuration response');
            }

            const selectedComponent = toolUseContent.input.component;

            const validComponents = ["o-HelloEarth", "o-Bring", "o-Banking", "o-AirBNB", "o-Splitwise", "o-Kanban"];
            if (!validComponents.includes(selectedComponent)) {
                agentLogger.log(this.agentName, 'Invalid component selected', {
                    selectedComponent,
                    validComponents
                });
                throw new Error(`Invalid component selected: ${selectedComponent}`);
            }

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
                        id: "ContentArea",
                        component: selectedComponent,
                        slot: "content"
                    }
                ]
            };

            dynamicView.set({ view: viewConfig });

            conversationManager.updateMessage(pendingMsgId, {
                content: `Navigating to ${selectedComponent}...`,
                status: 'complete',
                payload: {
                    type: 'view',
                    data: {
                        view: viewConfig,
                        action: 'showView',
                        context: {
                            delegatedFrom: context?.delegatedFrom,
                            originalUserMessage: context?.userMessage
                        }
                    }
                }
            });

            return {
                success: true,
                view: viewConfig,
                context: {
                    delegatedFrom: context?.delegatedFrom,
                    originalUserMessage: context?.userMessage
                }
            };

        } catch (error) {
            agentLogger.log(this.agentName, 'Error processing view request', {
                error: error instanceof Error ? {
                    message: error.message,
                    stack: error.stack,
                    name: error.name
                } : error,
                userMessage,
                context,
                timestamp: new Date().toISOString()
            }, 'error');

            conversationManager.updateMessage(pendingMsgId, {
                content: 'Sorry, I could not process that view request.',
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
}

export const vroniAgent = new VroniAgent();