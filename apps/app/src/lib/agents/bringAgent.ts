import { conversationManager } from '$lib/stores/intentStore';
import { writable } from 'svelte/store';

// Create a store for the shopping list
export const bringListStore = writable<Array<{ id: number; name: string; icon: string }>>([]);

// Add more generic icons for categorizing custom items
const genericIcons = {
    food: 'mdi:food',
    drink: 'mdi:cup',
    household: 'mdi:home',
    personal: 'mdi:account',
    default: 'mdi:shopping'
} as const;

// Keep preselectedItems for matching when possible
const preselectedItems = [
    { name: 'Apfel', icon: 'mdi:fruit-apple' },
    { name: 'Banane', icon: 'mdi:fruit-banana' },
    { name: 'Brot', icon: 'mdi:bread-slice' },
    { name: 'Karotte', icon: 'mdi:carrot' },
    { name: 'Käse', icon: 'mdi:cheese' },
    { name: 'Ei', icon: 'mdi:egg' },
    { name: 'Fisch', icon: 'mdi:fish' },
    { name: 'Milch', icon: 'mdi:bottle-soda' },
    { name: 'Tomate', icon: 'mdi:fruit-tomato' },
    { name: 'Hühnchen', icon: 'mdi:food-drumstick' },
    { name: 'Kartoffel', icon: 'mdi:potato' },
    { name: 'Zwiebel', icon: 'mdi:onion' },
    { name: 'Knoblauch', icon: 'mdi:garlic' }
];

const bertSystemPrompt = `You are Bert, the Shopping List Assistant. Your task is to extract shopping items from user messages in both German and English.
Always return a structured JSON response with the following format:
{
    "items": ["item1", "item2", ...],
    "language": "de|en"
}
Only include actual shopping items, no other words. Normalize item names to match our predefined list where possible.`;

export async function bringAgent(request: any) {
    try {
        const userMessage = request.task;
        const messageHistory = request.context || [];

        // Get current list state
        let currentList: Array<{ name: string; icon: string }> = [];
        bringListStore.subscribe(value => {
            currentList = value;
        })();

        console.log('[Bert] Processing request:', userMessage);

        conversationManager.addMessage(
            'Processing your shopping list request...',
            'bert',
            'pending'
        );

        const systemPrompt = `You are Bert, the Shopping List Assistant. Extract shopping items and determine operations.

Current shopping list items:
${currentList.map(item => item.name).join(', ') || 'List is empty'}

Available predefined items:
${preselectedItems.map(item => item.name).join(', ')}

You can accept ANY items and handle multiple operations in a single request:
1. Adding new items ("add tomatoes and milk")
2. Removing existing items ("remove bread")
3. Replacing items ("replace milk with almond milk")
4. Mixed operations ("add tomatoes and remove bread")

Try to categorize custom items as: food, drink, household, or personal.
Respond with separate arrays for additions and removals.`;

        const response = await fetch('/local/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userMessage }
                ],
                tools: [{
                    name: 'extractShoppingItems',
                    description: 'Process shopping list operations',
                    input_schema: {
                        type: 'object',
                        properties: {
                            operations: {
                                type: 'array',
                                items: {
                                    type: 'object',
                                    properties: {
                                        type: {
                                            type: 'string',
                                            enum: ['add', 'remove', 'clear']
                                        },
                                        items: {
                                            type: 'array',
                                            items: {
                                                type: 'object',
                                                properties: {
                                                    name: { type: 'string' },
                                                    category: {
                                                        type: 'string',
                                                        enum: ['food', 'drink', 'household', 'personal']
                                                    }
                                                },
                                                required: ['name']
                                            }
                                        }
                                    },
                                    required: ['type', 'items']
                                }
                            },
                            language: {
                                type: 'string',
                                enum: ['de', 'en']
                            }
                        },
                        required: ['operations', 'language']
                    }
                }],
                temperature: 0.1
            })
        });

        const data = await response.json();
        console.log('[Bert] Claude response:', data);

        const toolCall = data.content?.find(c => c.type === 'tool_calls' || c.type === 'tool_use');
        if (!toolCall) {
            console.error('[Bert] No tool call found in response:', data);
            throw new Error('No tool call in response');
        }

        const toolInput = toolCall.input || toolCall.tool_calls?.[0]?.parameters;
        if (!toolInput?.operations || !toolInput?.language) {
            console.error('[Bert] Invalid tool input:', toolInput);
            throw new Error('Invalid tool input');
        }

        const { operations, language } = toolInput;

        // Process all operations in sequence
        let responseMessages: string[] = [];

        for (const op of operations) {
            switch (op.type) {
                case 'add':
                    if (op.items.length > 0) {
                        const addResult = handleAddItems(op.items, language);
                        responseMessages.push(addResult.message.content);
                    }
                    break;
                case 'remove':
                    if (op.items.length > 0) {
                        const removeResult = handleRemoveItems(op.items, language);
                        responseMessages.push(removeResult.message.content);
                    }
                    break;
                case 'clear':
                    const clearResult = handleClearList(language);
                    responseMessages.push(clearResult.message.content);
                    break;
            }
        }

        // Combine all response messages
        const finalMessage = responseMessages.join(' ');
        conversationManager.addMessage(finalMessage, 'bert', 'complete');

        return {
            success: true,
            message: {
                agent: 'bert',
                content: finalMessage
            }
        };

    } catch (error) {
        console.error('[Bert] Error:', error);
        conversationManager.addMessage(
            'Sorry, I could not process that shopping list request.',
            'bert',
            'error'
        );
        throw error;
    }
}

function handleAddItems(items: Array<{ name: string; category?: string }>, language: string) {
    if (items.length === 0) {
        throw new Error('No items to add');
    }

    const newItems = items.map(item => {
        // Try to match with predefined items first
        const predefined = preselectedItems.find(
            pre => pre.name.toLowerCase() === item.name.toLowerCase()
        );

        if (predefined) {
            return {
                id: Date.now() + Math.random(),
                name: predefined.name,
                icon: predefined.icon
            };
        }

        // For custom items, use category-based icons
        let icon = genericIcons.default;
        if (item.category) {
            icon = genericIcons[item.category as keyof typeof genericIcons] || genericIcons.default;
        }

        return {
            id: Date.now() + Math.random(),
            name: item.name,
            icon
        };
    });

    bringListStore.update(list => [...list, ...newItems]);

    const itemNames = items.map(item => item.name);
    const responseMessage = language === 'de'
        ? `Ich habe ${itemNames.join(', ')} zu deiner Einkaufsliste hinzugefügt.`
        : `Added ${itemNames.join(', ')} to your shopping list.`;

    conversationManager.addMessage(responseMessage, 'bert', 'complete');

    return {
        success: true,
        message: {
            agent: 'bert',
            content: responseMessage
        }
    };
}

function handleRemoveItems(items: Array<{ name: string }>, language: string) {
    bringListStore.update(list => {
        const remainingItems = list.filter(item =>
            !items.some(removeItem =>
                item.name.toLowerCase() === removeItem.name.toLowerCase()
            )
        );
        return remainingItems;
    });

    const itemNames = items.map(item => item.name);
    const responseMessage = language === 'de'
        ? `Ich habe ${itemNames.join(', ')} von deiner Einkaufsliste entfernt.`
        : `Removed ${itemNames.join(', ')} from your shopping list.`;

    conversationManager.addMessage(responseMessage, 'bert', 'complete');

    return {
        success: true,
        message: {
            agent: 'bert',
            content: responseMessage
        }
    };
}

function handleClearList(language: string) {
    bringListStore.set([]);

    const responseMessage = language === 'de'
        ? 'Ich habe deine Einkaufsliste geleert.'
        : 'I have cleared your shopping list.';

    conversationManager.addMessage(responseMessage, 'bert', 'complete');

    return {
        success: true,
        message: {
            agent: 'bert',
            content: responseMessage
        }
    };
}