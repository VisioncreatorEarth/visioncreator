import { persist, createIndexedDBStorage } from '@macfja/svelte-persistent-store';
import { writable } from 'svelte/store';
import { conversationManager } from '$lib/stores/intentStore';
import { client } from '$lib/wundergraph';
import type { AgentResponse } from '../types/agent.types';
import { dynamicView } from '$lib/stores';
import { eventBus } from '$lib/composables/eventBus';

// Define a shared type for icons
export type CategoryType = 'fruits' | 'vegetables' | 'dairy' | 'meat' | 'bakery' | 'beverages' | 'snacks' | 'household' | 'other';

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
    other: 'mdi:shopping'
} as const;

// Update the itemIconMap with guaranteed existing MDI icons
export const itemIconMap = {
    // Fruits
    'banana': 'mdi:food-apple-outline',
    'bananas': 'mdi:food-apple-outline',
    'apple': 'mdi:food-apple',
    'apples': 'mdi:food-apple',
    'orange': 'mdi:fruit-citrus',
    'oranges': 'mdi:fruit-citrus',
    'pear': 'mdi:food-apple-outline',
    'pears': 'mdi:food-apple-outline',
    'mango': 'mdi:food-apple-outline',
    'mangos': 'mdi:food-apple-outline',

    // Vegetables
    'carrot': 'mdi:carrot',
    'carrots': 'mdi:carrot',
    'potato': 'mdi:food',
    'potatoes': 'mdi:food',
    'tomato': 'mdi:food',
    'tomatoes': 'mdi:food',

    // Dairy
    'milk': 'mdi:bottle-tonic',
    'cheese': 'mdi:food',
    'eggs': 'mdi:egg',

    // Beverages
    'water': 'mdi:bottle-water',
    'coca-cola': 'mdi:bottle-soda',
    'cola': 'mdi:bottle-soda',
    'beer': 'mdi:beer',
    'coffee': 'mdi:coffee',

    // Household
    'paper bags': 'mdi:shopping-outline',
    'glass': 'mdi:glass-fragile',
    'hammer': 'mdi:hammer',
    'nails': 'mdi:nail',
    'soap': 'mdi:hand-wash',
    'toilet paper': 'mdi:paper-roll'
} as const;

// Add a function to get category icon
export function getCategoryIcon(category: CategoryType): string {
    const fallbackIcon = 'mdi:shopping-outline';
    return categoryIcons[category] || fallbackIcon;
}

// Update preselectedItems to use the shared icons
export const preselectedItems = [
    { name: 'Apple', icon: 'mdi:fruit-apple', category: 'fruits' },
    { name: 'Banana', icon: 'mdi:fruit-banana', category: 'fruits' },
    { name: 'Orange', icon: 'mdi:fruit-orange', category: 'fruits' },
    { name: 'Pear', icon: 'mdi:fruit-pear', category: 'fruits' },
    { name: 'Mango', icon: categoryIcons.fruits, category: 'fruits' },
    { name: 'Carrot', icon: 'mdi:carrot', category: 'vegetables' },
    { name: 'Potato', icon: 'mdi:potato', category: 'vegetables' },
    { name: 'Garlic', icon: categoryIcons.vegetables, category: 'vegetables' },
    { name: 'Milk', icon: 'mdi:bottle-soda', category: 'dairy' },
    { name: 'Cheese', icon: 'mdi:cheese', category: 'dairy' },
    { name: 'Bread', icon: 'mdi:bread-slice', category: 'bakery' },
    { name: 'Water', icon: 'mdi:bottle-water', category: 'beverages' },
    { name: 'Coca-Cola', icon: 'simple-icons:coca-cola', category: 'beverages' },
    { name: 'Beer', icon: 'mdi:beer', category: 'beverages' },
    { name: 'Chips', icon: 'emojione-monotone:potato-chips', category: 'snacks' },
    { name: 'Soap', icon: 'mdi:soap', category: 'household' },
    { name: 'Salt', icon: 'mdi:shaker-outline', category: 'household' },
    { name: 'Hammer', icon: 'mdi:hammer', category: 'household' },
    { name: 'Nails', icon: 'mdi:nail', category: 'household' },
    { name: 'Tape', icon: 'mdi:tape-measure', category: 'household' }
] as const;

export class BertAgent {
    private readonly agentName = 'bert';

    private getSystemPrompt(): string {
        return `You are Bert, the Smart Shopping List Assistant. Your task is to manage and categorize shopping lists intelligently. 

Current shopping list items:
${this.getCurrentListItems()}

Available predefined items and categories:
${preselectedItems.map(item => item.name).join(', ')}

IMPORTANT RULES:
1. Always categorize items into these specific categories:
   - fruits: Fresh fruits and fruit products
   - vegetables: Fresh vegetables and vegetable products
   - dairy: Dairy products, eggs, milk, cheese
   - meat: Meat, poultry, fish, seafood
   - bakery: Bread, pastries, baked goods
   - beverages: All drinks including water, soda, alcohol
   - snacks: Chips, nuts, candies, sweets
   - household: Cleaning supplies, paper products
   - other: Items that don't fit above categories

2. Handle similar items and variations:
   - Merge singular/plural forms
   - Identify brand names (e.g., "Coca-Cola" → beverages)
   - Use predefined names when available
   - Avoid duplicates

3. Smart categorization examples:
   - "Cola" or "Pepsi" → beverages
   - "Apple" or "Bananas" → fruits
   - "Toilet paper" or "Soap" → household
   - "Chips" or "Cookies" → snacks

Always respond using the smart_shopping_list tool with categorized operations.
Include detailed categorization in your response.
please always translate everything to english, no matter the input lagnauge. 
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
                                                "other"
                                            ]
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
            // First, switch to o-Bring view
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

            // Process operations
            for (const op of operations) {
                switch (op.type) {
                    case 'add':
                        if (op.items.length > 0) {
                            responseMessages.push(this.handleAddItems(op.items, language));
                        }
                        break;
                    case 'remove':
                        if (op.items.length > 0) {
                            responseMessages.push(this.handleRemoveItems(op.items, language));
                        }
                        break;
                    case 'clear':
                        responseMessages.push(this.handleClearList(language));
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
                    data: { operations },
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

    private handleAddItems(items: Array<{ name: string; category: string }>, language: string): string {
        const newItems = items.map(item => {
            const normalizedName = item.name.toLowerCase().trim();
            // Try both singular and plural forms
            const icon = itemIconMap[normalizedName] ||
                itemIconMap[normalizedName.endsWith('s') ? normalizedName.slice(0, -1) : normalizedName + 's'] ||
                categoryIcons[item.category as CategoryType] ||
                'mdi:shopping';

            return {
                id: Date.now() + Math.random(),
                name: this.capitalizeFirstLetter(item.name),
                category: item.category as CategoryType,
                icon: icon
            };
        });

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
}

export const bertAgent = new BertAgent();