import { persist, createIndexedDBStorage } from '@macfja/svelte-persistent-store';
import { writable } from 'svelte/store';
import { conversationManager } from '$lib/stores/intentStore';
import { client } from '$lib/wundergraph';
import type { AgentResponse } from '../types/agent.types';
import { dynamicView } from '$lib/stores';
import { eventBus } from '$lib/composables/eventBus';

// Define a shared type for icons
export type CategoryType = 'fruits' | 'vegetables' | 'dairy' | 'meat' | 'bakery' | 'beverages' | 'snacks' | 'household' | 'grains' | 'other';

export interface ShoppingItem {
    id: number;
    name: string;
    category: CategoryType;
    icon?: string;
}

// Persistent store for shopping list
export const shoppingListStore = persist(
    writable<ShoppingItem[]>([]),
    createIndexedDBStorage(),
    'bert-shopping-list'
);

// Categories are defined here for the agent to use
export const categories = {
    fruits: 'Fruits',
    vegetables: 'Vegetables',
    dairy: 'Dairy & Eggs',
    meat: 'Meat & Fish',
    bakery: 'Bakery',
    beverages: 'Beverages',
    snacks: 'Snacks',
    household: 'Household',
    grains: 'Pasta & Grains',
    other: 'Other'
} as const;

// Update the categoryIcons with more reliable MDI icons
export const categoryIcons = {
    fruits: 'mdi:fruit-watermelon',
    vegetables: 'mdi:carrot',
    dairy: 'mdi:milk',
    meat: 'mdi:food-steak',
    bakery: 'mdi:bread-slice',
    beverages: 'mdi:cup',
    snacks: 'mdi:cookie',
    household: 'mdi:home',
    grains: 'mdi:pasta',
    other: 'mdi:shopping'
} as const;

// Add a function to get category icon
export function getCategoryIcon(category: CategoryType): string {
    const fallbackIcon = 'mdi:shopping-outline';
    return categoryIcons[category] || fallbackIcon;
}

export class BertAgent {
    private readonly agentName = 'bert';

    private getSystemPrompt(): string {
        return `You are Bert, the Smart Shopping List Assistant. Your task is to manage and categorize shopping lists intelligently.

        Current shopping list items:
        ${this.getCurrentListItems()}

        IMPORTANT RULES:
        1. For combined operations (like clear and add), return all operations in a single response:
           Example: 
           {
             "operations": [
               {"type": "clear", "items": []},
               {"type": "add", "items": [{"name": "Apple", "category": "fruits", "icon": "mdi:food-apple"}]}
             ]
           }

        2. Always categorize items into these specific categories:
        - fruits: Fresh fruits and fruit products
        - vegetables: Fresh vegetables and vegetable products
        - dairy: Dairy products, eggs, milk, cheese
        - meat: Meat, poultry, fish, seafood
        - bakery: Bread, pastries, baked goods
        - beverages: All drinks including water, soda, alcohol
        - snacks: Chips, nuts, candies, sweets
        - household: Cleaning supplies, paper products
        - grains: Pasta, rice, quinoa, cereals, grains
        - other: Items that don't fit above categories

        3. Handle similar items and variations:
        - Merge singular/plural forms
        - Identify brand names (e.g., "Coca-Cola" → beverages)
        - Use predefined names when available
        - Avoid duplicates at all costs

        4. Smart categorization examples:
        - "Cola" or "Pepsi" → beverages
        - "Apple" or "Bananas" → fruits
        - "Toilet paper" or "Soap" → household
        - "Chips" or "Cookies" → snacks

        Always respond using the smart_shopping_list tool with categorized operations.
        Include detailed categorization in your response.
        please always translate everything to english, no matter the input lagnauge. 

        When adding items, you should select the most appropriate Material Design Icon (MDI) for each item.
        Follow these icon selection rules:
        1. Always use MDI icons starting with 'mdi:'
        2. Choose the most specific and appropriate icon for the item
        3. Common patterns:
           - Food items: mdi:food, mdi:food-apple, mdi:bread-slice, etc.
           - Beverages: mdi:bottle-water, mdi:cup, mdi:beer, etc.
           - Household: mdi:broom, mdi:tools, mdi:hammer, etc.
        4. If no specific icon exists, use a relevant category icon
        5. Format: { name: "Item Name", category: "category", icon: "mdi:specific-icon" }

        Current shopping list items:
        ${this.getCurrentListItems()}

        Available categories:
        ${Object.entries(categories).map(([id, name]) => `${id}: ${name}`).join('\n')}
        `;
    }

    private readonly tools = [{
        name: "smart_shopping_list",
        description: "Intelligently manage shopping list with automatic categorization",
        input_schema: {
            type: "object",
            properties: {
                operations: {
                    type: "array",
                    items: {
                        type: "object",
                        properties: {
                            type: {
                                type: "string",
                                enum: ["add", "remove", "clear", "merge", "update"]
                            },
                            items: {
                                type: "array",
                                items: {
                                    type: "object",
                                    properties: {
                                        name: { type: "string" },
                                        category: {
                                            type: "string",
                                            enum: [
                                                "fruits",
                                                "vegetables",
                                                "dairy",
                                                "meat",
                                                "bakery",
                                                "beverages",
                                                "snacks",
                                                "household",
                                                "grains",
                                                "other"
                                            ]
                                        },
                                        icon: {
                                            type: "string",
                                            description: "MDI icon identifier (e.g., mdi:water, mdi:food-apple)"
                                        },
                                        similarTo: { type: "string" },
                                        reason: { type: "string" }
                                    },
                                    required: ["name", "category"]
                                }
                            }
                        },
                        required: ["type", "items"]
                    }
                }
            },
            required: ["operations"]
        }
    }];

    private getCurrentListItems(): string {
        let items: string[] = [];
        shoppingListStore.subscribe(list => {
            items = list.map(item => item.name);
        })();
        return items.join(', ') || 'List is empty';
    }

    private switchToBringView() {
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
                    component: "o-Bring",
                    slot: "content"
                }
            ]
        };

        dynamicView.set({ view: viewConfig });
        return viewConfig;
    }

    private capitalizeFirstLetter(str: string): string {
        return str.split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
    }

    async processRequest(task: string, context?: any): Promise<AgentResponse> {
        const requestId = crypto.randomUUID();

        try {
            const viewConfig = this.switchToBringView();

            // Add pending message
            conversationManager.addMessage({
                id: requestId,
                agent: this.agentName,
                content: 'Processing your shopping list request...',
                status: 'pending',
                timestamp: new Date().toISOString(),
                payload: {
                    type: 'view',
                    data: {
                        view: viewConfig,
                        success: true
                    }
                }
            });

            const claudeResponse = await client.mutate({
                operationName: 'askClaude',
                input: {
                    messages: [{ role: 'user', content: task }],
                    system: this.getSystemPrompt(),
                    tools: this.tools
                }
            });

            const toolUse = claudeResponse.data?.content?.find(c => c.type === 'tool_use');
            if (!toolUse?.input) {
                throw new Error('Invalid tool response');
            }

            const { operations, language } = toolUse.input;
            const responseMessages: string[] = [];

            // Sort operations to ensure clear happens before add
            const sortedOperations = this.sortOperations(operations);

            // Process operations
            for (const op of sortedOperations) {
                switch (op.type) {
                    case 'clear':
                        responseMessages.push(this.handleClearList(language));
                        break;
                    case 'remove':
                        if (op.items.length > 0) {
                            responseMessages.push(this.handleRemoveItems(op.items, language));
                        }
                        break;
                    case 'add':
                        if (op.items.length > 0) {
                            responseMessages.push(this.handleAddItems(op.items, language));
                        }
                        break;
                }
            }

            const finalMessage = responseMessages.join(' ');

            // Update message with success
            conversationManager.updateMessage(requestId, {
                content: finalMessage,
                status: 'complete',
                payload: {
                    type: 'shopping_list',
                    data: { operations: sortedOperations },
                    view: viewConfig
                }
            });

            return {
                success: true,
                message: {
                    agent: this.agentName,
                    content: finalMessage
                },
                view: viewConfig,
                viewUpdated: true,
                context: context?.delegatedFrom ? {
                    delegatedFrom: context.delegatedFrom,
                    originalUserMessage: context.userMessage
                } : undefined
            };

        } catch (error) {
            // Handle error
            conversationManager.updateMessage(requestId, {
                content: "Sorry, I couldn't process that shopping list request.",
                status: 'error',
                payload: {
                    type: 'error',
                    data: { error: error instanceof Error ? error.message : 'Unknown error' }
                }
            });

            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    private handleAddItems(items: Array<{ name: string; category: string; icon?: string }>, language: string): string {
        const newItems = items.map(item => ({
            id: Date.now() + Math.random(),
            name: this.capitalizeFirstLetter(item.name),
            category: item.category as CategoryType,
            icon: item.icon || categoryIcons[item.category as CategoryType] || 'mdi:shopping'
        }));

        console.log('Adding items to store:', newItems); // Debug log

        shoppingListStore.update(list => [...list, ...newItems]);

        eventBus.emit('intent:stateChange', {
            state: 'SHOPPING_LIST_UPDATE',
            items: newItems,
            operation: 'add'
        });

        return `Added ${newItems.map(i => i.name).join(', ')} to your shopping list.`;
    }

    private handleRemoveItems(items: Array<{ name: string }>, language: string): string {
        let removedItems: string[] = [];

        shoppingListStore.update(list => {
            removedItems = items.map(i => this.capitalizeFirstLetter(i.name));
            return list.filter(item => !items.some(removeItem =>
                item.name.toLowerCase() === removeItem.name.toLowerCase()
            ));
        });

        eventBus.emit('intent:stateChange', {
            state: 'SHOPPING_LIST_UPDATE',
            items: removedItems,
            operation: 'remove'
        });

        return `Removed ${removedItems.join(', ')} from your shopping list.`;
    }

    private handleClearList(language: string): string {
        shoppingListStore.set([]);
        return 'I have cleared your shopping list.';
    }

    // Add this new method to sort operations
    private sortOperations(operations: any[]): any[] {
        const operationOrder = {
            'clear': 1,
            'remove': 2,
            'add': 3,
            'merge': 4,
            'update': 5
        };

        return [...operations].sort((a, b) =>
            (operationOrder[a.type] || 99) - (operationOrder[b.type] || 99)
        );
    }
}

export const bertAgent = new BertAgent();