import type { AgentResponse, ClaudeResponse } from '../types/agent.types';
import { conversationManager } from '$lib/stores/intentStore';
import { client } from '$lib/wundergraph';
import { agentLogger } from '$lib/utils/logger';

export class VroniAgent {
    private readonly agentName = 'vroni';
    private readonly tools = [
        {
            name: "compose_view",
            description: "Generate a view configuration based on user request",
            input_schema: {
                type: "object",
                properties: {
                    component: {
                        type: "string",
                        enum: ["o-HelloEarth", "o-Bring", "o-Banking", "o-AirBNB", "o-Splitwise", "o-Kanban"],
                        description: "The main component to display"
                    }
                },
                required: ["component"]
            }
        }
    ];

    private readonly systemPrompt = `You are Vroni, the View Agent. Your role is to analyze user requests and return appropriate view configurations.

Available components (always prepend with "o-"):
- o-HelloEarth: Main dashboard/welcome view
- o-Bring: Shopping and item management
- o-Banking: Financial information and transactions
- o-AirBNB: Accommodation bookings and management
- o-Splitwise: Expense sharing and tracking
- o-Kanban: Task and project management

Always generate a view configuration with this exact structure:
{
    "id": "MainContainer",
    "layout": {
        "areas": "'content'",
        "columns": "1fr",
        "rows": "1fr",
        "overflow": "auto",
        "style": "p-4 max-w-7xl mx-auto"
    },
    "children": [
        {
            "id": "ContentArea",
            "component": "o-[SelectedComponent]",
            "slot": "content"
        }
    ]
}

Maintain context awareness by considering previous messages in the conversation.
Respond in a friendly, helpful manner and explain your view choices when appropriate.`;

    async processRequest(userMessage: string, context?: any): Promise<AgentResponse> {
        const pendingMsgId = crypto.randomUUID();

        try {
            agentLogger.log(this.agentName, 'Starting view request', {
                userMessage,
                context
            });

            // Add Vroni's message
            conversationManager.addMessage({
                id: pendingMsgId,
                agent: this.agentName,
                content: 'Preparing your view...',
                timestamp: new Date().toISOString(),
                status: 'pending'
            });

            // For Banking view
            if (userMessage.toLowerCase().includes('banking')) {
                agentLogger.log(this.agentName, 'Preparing Banking view configuration');

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
                            component: "o-Banking",
                            slot: "content"
                        }
                    ]
                };

                agentLogger.log(this.agentName, 'View configuration generated', {
                    viewConfig
                });

                // Update message with view configuration
                conversationManager.updateMessage(pendingMsgId, {
                    content: 'Navigating to Banking view...',
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
            }

            agentLogger.log(this.agentName, 'Unsupported view request', {
                userMessage
            }, 'warn');

            throw new Error(`Unsupported view request: ${userMessage}`);

        } catch (error) {
            agentLogger.log(this.agentName, 'Error processing view request', {
                error,
                userMessage,
                context
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