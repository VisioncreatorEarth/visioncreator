import type { AgentResponse } from '../types/agent.types';
import { conversationManager } from '$lib/stores/intentStore';
import { client } from '$lib/wundergraph';
import { get } from 'svelte/store';
import { Me } from '$lib/stores';
import { eventBus } from '$lib/composables/eventBus';

export class WalterAgent {
    private readonly agentName = 'walter';

    async processRequest(userMessage: string, context?: any): Promise<AgentResponse> {
        const pendingMsgId = crypto.randomUUID();
        const { operation, input } = context;

        try {
            // Add user ID if not provided
            let fullInput = { ...input };
            if (!('id' in fullInput)) {
                const currentUser = get(Me);
                if (currentUser?.id) {
                    fullInput.id = currentUser.id;
                }
            }

            // Execute operation
            const result = await client.mutate({
                operationName: operation,
                input: fullInput
            });

            if (result.error) {
                throw new Error(result.error.message);
            }

            // Emit success event
            eventBus.emit(operation);

            // Add success message to conversation
            conversationManager.addMessage({
                id: pendingMsgId,
                agent: this.agentName,
                content: `Successfully processed ${operation}: ${result.data?.message || 'Operation completed'}`,
                status: 'complete',
                payload: {
                    type: 'response',
                    data: result.data
                }
            });

            return {
                success: true,
                message: {
                    agent: this.agentName,
                    content: result.data?.message || `Operation ${operation} completed successfully!`,
                    payload: {
                        type: 'response',
                        data: result.data
                    }
                }
            };

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';

            // Add error message to conversation
            conversationManager.addMessage({
                id: pendingMsgId,
                agent: this.agentName,
                content: `Failed to process ${operation}: ${errorMessage}`,
                status: 'error',
                payload: {
                    type: 'error',
                    data: { error: errorMessage }
                }
            });

            return {
                success: false,
                error: errorMessage
            };
        }
    }
} 