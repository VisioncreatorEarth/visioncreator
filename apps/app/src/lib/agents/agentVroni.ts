import type { AgentResponse, ClaudeResponse } from '../types/agent.types';
import { conversationManager } from '$lib/stores/intentStore';
import { client } from '$lib/wundergraph';
import { agentLogger } from '$lib/utils/logger';

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
                context,
                timestamp: new Date().toISOString()
            });

            conversationManager.addMessage({
                id: pendingMsgId,
                agent: this.agentName,
                content: 'Preparing your view...',
                timestamp: new Date().toISOString(),
                status: 'pending'
            });

            // Log the request to Claude
            agentLogger.log(this.agentName, 'Sending request to Claude', {
                messages: [{ role: 'user', content: userMessage }],
                systemPromptLength: this.systemPrompt.length,
                tools: this.tools.map(t => t.name)
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

            // Detailed logging of Claude response
            agentLogger.log(this.agentName, 'Claude response structure', {
                hasData: !!claudeResponse?.data,
                contentLength: claudeResponse?.data?.content?.length,
                contentTypes: claudeResponse?.data?.content?.map(c => ({
                    type: c.type,
                    hasText: !!c.text,
                    hasToolUse: !!c.tool_use,
                    toolUseName: c.tool_use?.name,
                    toolUseInput: c.tool_use?.input
                }))
            });

            // Validate response structure
            if (!claudeResponse?.data?.content) {
                agentLogger.log(this.agentName, 'Missing content in Claude response', {
                    response: claudeResponse?.data
                });
                throw new Error('Invalid Claude response structure');
            }

            // Log each content item separately
            claudeResponse.data.content.forEach((item, index) => {
                agentLogger.log(this.agentName, `Content item ${index}`, {
                    type: item.type,
                    text: item.text,
                    toolUse: item.tool_use,
                    hasToolUse: !!item.tool_use
                });
            });

            // Extract and validate tool use
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

            // Validate component name
            const validComponents = ["o-HelloEarth", "o-Bring", "o-Banking", "o-AirBNB", "o-Splitwise", "o-Kanban"];
            if (!validComponents.includes(selectedComponent)) {
                agentLogger.log(this.agentName, 'Invalid component selected', {
                    selectedComponent,
                    validComponents
                });
                throw new Error(`Invalid component selected: ${selectedComponent}`);
            }

            // Generate view configuration
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

            agentLogger.log(this.agentName, 'View configuration generated', {
                viewConfig,
                selectedComponent,
                timestamp: new Date().toISOString()
            });

            // Update message with view configuration
            conversationManager.updateMessage(pendingMsgId, {
                content: `Navigating to ${selectedComponent}...`,
                status: 'complete',
                payload: {
                    type: 'view',
                    data: {
                        view: viewConfig,
                        action: 'showView'
                    }
                }
            });

            return { success: true };

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