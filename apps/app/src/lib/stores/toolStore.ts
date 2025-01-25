import { writable, get } from 'svelte/store';
import { client } from '$lib/wundergraph';
import { goto } from '$app/navigation';
import { browser } from '$app/environment';
import { eventBus } from '$lib/composables/eventBus';
import { proposals, addProposal, type Proposal } from './proposalStore';

// Mock data and types
const MOCK_USER = {
    name: 'Demo User',
    id: 'demo-user-1',
    email: 'demo@example.com'
};

// Types
interface ShoppingItem {
    name: string;
    category: string;
    quantity?: number;
    unit?: string;
    icon?: string;
}

type ActionResult = {
    success: boolean;
    message: string;
    data?: Record<string, unknown>;
};

interface ConfirmationData {
    title: string;
    message: string;
    action: () => Promise<ActionResult>;
    data?: Record<string, unknown>;
    pendingResponse?: boolean;
    updateParams?: (newParams: Record<string, unknown>) => void;
}

interface ProposalCreationData {
    title: string;
    description: string;
    expectedResults: string;
    state: 'idea';
}

interface ToolState {
    currentItems: ShoppingItem[];
    addedItems: ShoppingItem[];
    removedItems: ShoppingItem[];
    pendingConfirmation: ConfirmationData | null;
    pendingProposal: ProposalCreationData | null;
}

interface OperationResult {
    success: boolean;
    message: string;
    data?: Record<string, unknown>;
    error?: Error;
}

type ToolResponse = {
    status: 'awaiting_confirmation' | 'pending_update' | 'error';
    message: string;
};

interface UpdateNameParams {
    name: string;
}

interface ShoppingListParams {
    items: ShoppingItem[];
}

type OperationName = 'updateMe' | 'createShoppingList' | 'addItemsToShoppingList';

interface UpdateParams {
    name?: string;
    [key: string]: unknown;
}

async function performOperation(operation: OperationName, input: UpdateParams): Promise<OperationResult> {
    try {
        const result = await client.mutate({
            operationName: operation,
            input
        });

        if (!result.error && result.data) {
            eventBus.emit(operation);
            return {
                success: true,
                data: result.data,
                message: 'Operation completed successfully!'
            };
        } else {
            throw new Error(result.error?.message || `Operation ${operation} failed`);
        }
    } catch (error) {
        console.error(`[Error] Operation ${operation} failed:`, error);
        return {
            success: false,
            message: error instanceof Error ? error.message : `An error occurred during ${operation}`,
            error: error instanceof Error ? error : new Error(`Unknown error during ${operation}`)
        };
    }
}

function createToolStore() {
    const { subscribe, set, update } = writable<ToolState>({
        currentItems: [],
        addedItems: [],
        removedItems: [],
        pendingConfirmation: null,
        pendingProposal: null
    });

    return {
        subscribe,
        reset: () => set({
            currentItems: [],
            addedItems: [],
            removedItems: [],
            pendingConfirmation: null,
            pendingProposal: null
        }),

        setPendingConfirmation: (confirmation: ConfirmationData | null) => {
            update(state => ({
                ...state,
                pendingConfirmation: confirmation ? {
                    ...confirmation,
                    pendingResponse: true
                } : null
            }));
        },

        confirmAction: async () => {
            const state = get({ subscribe });
            if (state.pendingConfirmation) {
                try {
                    const result = await state.pendingConfirmation.action();
                    eventBus.emit('tool:confirmation:completed', {
                        success: true,
                        action: state.pendingConfirmation.title,
                        data: result
                    });
                    return result;
                } catch (error) {
                    eventBus.emit('tool:confirmation:completed', {
                        success: false,
                        action: state.pendingConfirmation.title,
                        error: error
                    });
                    throw error;
                } finally {
                    update(state => ({ ...state, pendingConfirmation: null }));
                }
            }
        },

        cancelAction: () => {
            const state = get({ subscribe });
            if (state.pendingConfirmation) {
                eventBus.emit('tool:confirmation:completed', {
                    success: false,
                    action: state.pendingConfirmation.title,
                    cancelled: true
                });
            }
            update(state => ({ ...state, pendingConfirmation: null }));
        },

        // Tool implementations
        updateShoppingList: async (parameters: ShoppingListParams) => {
            try {
                // Handle double-stringified JSON
                let itemsArray;
                try {
                    if (typeof parameters.items === 'string') {
                        const parsed = JSON.parse(parameters.items);
                        itemsArray = typeof parsed === 'string' ? JSON.parse(parsed) : parsed;
                    } else {
                        itemsArray = parameters.items;
                    }
                } catch (e) {
                    console.error('Error parsing items:', e);
                    throw new Error('Invalid items format');
                }

                // Update store state
                update(state => ({
                    ...state,
                    currentItems: [...itemsArray],
                    addedItems: itemsArray.filter((item: any) => item.action === 'add'),
                    removedItems: itemsArray.filter((item: any) => item.action === 'remove')
                }));

                // Process added items
                const addedItems = itemsArray.filter((item: any) => item.action === 'add');
                if (addedItems.length > 0) {
                    const addResult = await performOperation('addItemsToShoppingList', {
                        action: 'add',
                        items: addedItems.map((item: ShoppingItem) => ({
                            name: item.name,
                            category: item.category,
                            quantity: item.quantity ? parseFloat(String(item.quantity)) : undefined,
                            unit: item.unit,
                            icon: item.icon
                        }))
                    });

                    if (!addResult.success) {
                        throw new Error(addResult.message);
                    }
                }

                // Process removed items
                const removedItems = itemsArray.filter((item: any) => item.action === 'remove');
                if (removedItems.length > 0) {
                    const removeResult = await performOperation('addItemsToShoppingList', {
                        action: 'remove',
                        items: removedItems.map((item: ShoppingItem) => ({
                            name: item.name,
                            category: item.category
                        }))
                    });

                    if (!removeResult.success) {
                        throw new Error(removeResult.message);
                    }
                }

                if (browser) {
                    goto('/me?view=HominioShopWithMe', { replaceState: true });
                }

                return 'Shopping list updated successfully';
            } catch (error) {
                console.error('Error updating shopping list:', error);
                throw new Error('Failed to update shopping list');
            }
        },

        switchView: async (parameters: any) => {
            try {
                const component = parameters.component;
                if (browser) {
                    goto(`/me?view=${component}`, { replaceState: true });
                }
                return `Switched to ${component} view`;
            } catch (error) {
                console.error('Error switching view:', error);
                throw new Error('Failed to switch view');
            }
        },

        updateName: async (parameters: UpdateNameParams) => {
            const store = get({ subscribe });
            if (!store.pendingConfirmation ||
                (store.pendingConfirmation.data?.name !== parameters.name)) {

                const createNameAction = (name: string) => async (): Promise<ActionResult> => {
                    const result = await performOperation('updateMe', {
                        name: name
                    });

                    if (!result.success) {
                        throw new Error(result.message);
                    }

                    return {
                        success: true,
                        message: `Name successfully updated to ${name}`,
                        data: { name }
                    };
                };

                update(state => ({
                    ...state,
                    pendingConfirmation: {
                        title: 'Update Name',
                        message: `Are you sure you want to change your name to "${parameters.name}"?`,
                        action: createNameAction(parameters.name),
                        data: { name: parameters.name },
                        pendingResponse: true,
                        updateParams: (newParams: UpdateParams) => {
                            update(state => ({
                                ...state,
                                pendingConfirmation: {
                                    ...state.pendingConfirmation!,
                                    message: `Are you sure you want to change your name to "${newParams.name}"?`,
                                    action: createNameAction(newParams.name as string),
                                    data: { name: newParams.name }
                                }
                            }));
                        }
                    }
                }));
                return {
                    status: 'awaiting_confirmation',
                    message: "I'll update your name after you confirm the change."
                };
            }
            return {
                status: 'pending_update',
                message: 'Would you like to update the name to something else?'
            };
        },

        // Add new tool for creating proposals
        createProposal: async (parameters: { proposal: { title: string; description: string; expectedResults: string } }) => {
            console.log('Starting proposal creation with parameters:', parameters);

            try {
                const { proposal } = parameters;
                console.log('Extracted proposal data:', proposal);

                // Create the proposal
                const result = await addProposal({
                    title: proposal.title,
                    description: proposal.description,
                    expectedResults: proposal.expectedResults,
                    state: 'idea'
                });
                console.log('Proposal creation result:', result);

                // Navigate to the proposal detail view
                if (browser) {
                    goto(`/me?view=Proposals&id=${result.id}`, { replaceState: true });
                }

                // Return success response in the format expected by UltravoxSession
                return {
                    status: 'awaiting_confirmation',
                    message: "I've created your proposal and opened it for you. Would you like to create another proposal?"
                };
            } catch (error) {
                console.error('Error creating proposal:', error);
                throw error;
            }
        }
    };
}

export const toolStore = createToolStore(); 