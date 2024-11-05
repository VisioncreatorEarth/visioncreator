import { persist, createIndexedDBStorage } from '@macfja/svelte-persistent-store';
import { writable } from 'svelte/store';
import { conversationManager } from '$lib/stores/intentStore';
import { client } from '$lib/wundergraph';
import type { AgentResponse } from '../types/agent.types';
import { dynamicView } from '$lib/stores';

// Define the ShoppingItem interface
interface ShoppingItem {
    id: number;
    name: string;
    icon: string;
}

// Persistent store for shopping list
export const shoppingListStore = persist(
    writable<ShoppingItem[]>([]),
    createIndexedDBStorage(),
    'bert-shopping-list'
);

// Generic icons for categorizing items
const genericIcons = {
    food: 'mdi:food',
    drink: 'mdi:cup',
    household: 'mdi:home',
    personal: 'mdi:account',
    default: 'mdi:shopping'
} as const;

// Update preselectedItems to English
export const preselectedItems = [
    { name: 'Apple', icon: 'mdi:fruit-apple' },
    { name: 'Banana', icon: 'mdi:fruit-banana' },
    { name: 'Bread', icon: 'mdi:bread-slice' },
    { name: 'Carrot', icon: 'mdi:carrot' },
    { name: 'Cheese', icon: 'mdi:cheese' },
    { name: 'Egg', icon: 'mdi:egg' },
    { name: 'Fish', icon: 'mdi:fish' },
    { name: 'Milk', icon: 'mdi:bottle-soda' },
    { name: 'Tomato', icon: 'mdi:fruit-tomato' },
    { name: 'Chicken', icon: 'mdi:food-drumstick' },
    { name: 'Potato', icon: 'mdi:potato' },
    { name: 'Onion', icon: 'mdi:onion' },
    { name: 'Garlic', icon: 'mdi:garlic' },
    { name: 'Paper Towels', icon: 'mdi:paper-roll' },
    { name: 'Toilet Paper', icon: 'mdi:toilet-paper' },
    { name: 'Shampoo', icon: 'mdi:shampoo' },
    { name: 'Toothpaste', icon: 'mdi:toothpaste' },
    { name: 'Coffee Beans', icon: 'mdi:coffee' },
    { name: 'Tea', icon: 'mdi:tea' },
    { name: 'Wine', icon: 'mdi:wine' }
] as const;

export class BertAgent {
    private readonly agentName = 'bert';

    private getSystemPrompt(): string {
        return `You are Bert, the Shopping List Assistant. Your task is to manage shopping lists intelligently.
IMPORTANT: Always process requests in English, regardless of input language.

Current shopping list items:
${this.getCurrentListItems()}

Available predefined items:
${preselectedItems.map(item => item.name).join(', ')}

IMPORTANT RULES:
1. Always check for and handle similar items:
   - Detect singular/plural variations (e.g., "apple" vs "apples")
   - Identify similar items (e.g., "coconut" and "coconuts" should be merged)
   - Use the more common or predefined form when merging items
   - Avoid creating duplicate entries

2. Standardize item names:
   - Always capitalize the first letter of each word
   - Use predefined names when available
   - Maintain consistent naming across the list

3. Handle operations intelligently:
   - When adding items, merge with existing similar items
   - When removing items, remove all similar variations
   - When clearing, remove all items

4. Categorize new items appropriately:
   - food: edible items
   - drink: beverages
   - household: cleaning and home supplies
   - personal: hygiene and personal care items

Always respond using the shopping_list_operation tool with detailed operations.
Always set language to "en" in your response.
Include merge and update operations in your response when handling similar items.`;
    }

    private readonly tools = [{
        name: "shopping_list_operation",
        description: "Process shopping list operations intelligently",
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
                                        similarTo: { type: "string" },
                                        category: {
                                            type: "string",
                                            enum: ["food", "drink", "household", "personal"]
                                        },
                                        reason: {
                                            type: "string",
                                            description: "Reason for merge or update"
                                        }
                                    },
                                    required: ["name"]
                                }
                            }
                        },
                        required: ["type", "items"]
                    }
                },
                language: {
                    type: "string",
                    enum: ["en"],
                    default: "en"
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

    private handleAddItems(items: Array<{ name: string; category?: string }>, language: string): string {
        const newItems = items.map(item => {
            // Try to match with predefined items (case-insensitive)
            const predefined = preselectedItems.find(
                pre => pre.name.toLowerCase() === item.name.toLowerCase()
            );

            if (predefined) {
                return {
                    id: Date.now() + Math.random(),
                    name: predefined.name, // Use predefined capitalization
                    icon: predefined.icon
                };
            }

            // For custom items, capitalize first letter and use category-based icons
            return {
                id: Date.now() + Math.random(),
                name: this.capitalizeFirstLetter(item.name),
                icon: item.category ?
                    genericIcons[item.category as keyof typeof genericIcons] :
                    genericIcons.default
            };
        });

        shoppingListStore.update(list => [...list, ...newItems]);

        return `Added ${newItems.map(i => i.name).join(', ')} to your shopping list.`;
    }

    private handleRemoveItems(items: Array<{ name: string }>, language: string): string {
        shoppingListStore.update(list =>
            list.filter(item => !items.some(removeItem =>
                item.name.toLowerCase() === removeItem.name.toLowerCase()
            ))
        );

        return `Removed ${items.map(i => this.capitalizeFirstLetter(i.name)).join(', ')} from your shopping list.`;
    }

    private handleClearList(language: string): string {
        shoppingListStore.set([]);
        return 'I have cleared your shopping list.';
    }
}

export const bertAgent = new BertAgent();