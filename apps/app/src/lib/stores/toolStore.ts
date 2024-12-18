import { writable, get } from 'svelte/store';
import { client } from '$lib/wundergraph';
import { goto } from '$app/navigation';
import { browser } from '$app/environment';
import { eventBus } from '$lib/composables/eventBus';

// Types
interface ShoppingItem {
    name: string;
    category: string;
    quantity?: number;
    unit?: string;
    icon?: string;
}

interface ConfirmationData {
    title: string;
    message: string;
    action: () => Promise<any>;
    data?: any;
}

interface ToolState {
    currentItems: ShoppingItem[];
    addedItems: ShoppingItem[];
    removedItems: ShoppingItem[];
    pendingConfirmation: ConfirmationData | null;
}

async function performOperation(operation: string, input: Record<string, unknown>) {
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
                message: result.data.message || `Operation ${operation} completed successfully!`
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
        pendingConfirmation: null
    });

    return {
        subscribe,
        reset: () => set({
            currentItems: [],
            addedItems: [],
            removedItems: [],
            pendingConfirmation: null
        }),

        setPendingConfirmation: (confirmation: ConfirmationData | null) => {
            update(state => ({ ...state, pendingConfirmation: confirmation }));
        },

        confirmAction: async () => {
            const state = get({ subscribe });
            if (state.pendingConfirmation) {
                try {
                    await state.pendingConfirmation.action();
                } finally {
                    update(state => ({ ...state, pendingConfirmation: null }));
                }
            }
        },

        cancelAction: () => {
            update(state => ({ ...state, pendingConfirmation: null }));
        },

        // Tool implementations
        updateShoppingList: async (parameters: any) => {
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

        updateName: async (parameters: any) => {
            const store = get({ subscribe });
            if (!store.pendingConfirmation) {
                // Set up confirmation
                update(state => ({
                    ...state,
                    pendingConfirmation: {
                        title: 'Update Name',
                        message: `Are you sure you want to change your name to "${parameters.name}"?`,
                        action: async () => {
                            const result = await performOperation('updateMe', {
                                name: parameters.name
                            });

                            if (!result.success) {
                                throw new Error(result.message);
                            }

                            return 'Name updated successfully';
                        },
                        data: { name: parameters.name }
                    }
                }));
                return 'Confirmation required';
            }
            throw new Error('Another confirmation is pending');
        }
    };
}

export const toolStore = createToolStore(); 