import type { AgentResponse } from '../types/agent.types';
import { client } from '$lib/wundergraph';
import { get } from 'svelte/store';
import { Me } from '$lib/stores';
import { eventBus } from '$lib/composables/eventBus';

export class AgentWalter {
    private readonly agentName = 'walter';

    async processRequest(userMessage: string, context?: any): Promise<AgentResponse> {
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

            // Return success response (no direct message adding)
            return {
                success: true,
                message: {
                    agent: this.agentName,
                    content: result.data?.message || `Successfully processed ${operation}`,
                    payload: {
                        type: 'response',
                        data: result.data
                    }
                }
            };

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';

            // Return error response (no direct message adding)
            return {
                success: false,
                error: errorMessage,
                message: {
                    agent: this.agentName,
                    content: `Failed to process ${operation}: ${errorMessage}`,
                    payload: {
                        type: 'error',
                        data: { error: errorMessage }
                    }
                }
            };
        }
    }
} 