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

        console.log('[Bert] Processing request:', userMessage);

        conversationManager.addMessage(
            'Processing your shopping list request...',
            'bert',
            'pending'
        );

        const response = await fetch('/local/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                messages: [
                    {
                        role: 'system',
                        content: `You are Bert, the Shopping List Assistant. Extract shopping items and determine operations.
You can accept ANY items, but try to match these common items when possible: ${preselectedItems.map(item => item.name).join(', ')}.
Also try to categorize custom items as: food, drink, household, or personal.`
                    },
                    { role: 'user', content: userMessage }
                ],
                tools: [{
                    name: 'extractShoppingItems',
                    description: 'Extract shopping items and operation from user message',
                    input_schema: {
                        type: 'object',
                        properties: {
                            operation: {
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
                            },
                            language: {
                                type: 'string',
                                enum: ['de', 'en']
                            }
                        },
                        required: ['operation', 'items', 'language']
                    }
                }],
                temperature: 0.1
            })
        });

        const data = await response.json();
        console.log('[Bert] Claude response:', data);

        // Improved error handling and response validation
        const toolCall = data.content?.find(c => c.type === 'tool_calls' || c.type === 'tool_use');
        if (!toolCall) {
            console.error('[Bert] No tool call found in response:', data);
            throw new Error('No tool call in response');
        }

        const toolInput = toolCall.input || toolCall.tool_calls?.[0]?.parameters;
        if (!toolInput) {
            console.error('[Bert] No tool input found:', toolCall);
            throw new Error('No tool input found');
        }

        const { operation, items, language } = toolInput;

        if (!operation || !Array.isArray(items) || !language) {
            console.error('[Bert] Invalid tool input format:', toolInput);
            throw new Error('Invalid tool input format');
        }

        console.log('[Bert] Extracted data:', { operation, items, language });

        // Handle different operations
        switch (operation) {
            case 'add':
                return handleAddItems(items, language);
            case 'remove':
                return handleRemoveItems(items, language);
            case 'clear':
                return handleClearList(language);
            default:
                throw new Error(`Unknown operation: ${operation}`);
        }

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