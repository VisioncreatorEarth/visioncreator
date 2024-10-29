import { conversationManager } from '$lib/stores/intentStore';
import { writable } from 'svelte/store';

// Create a store for the shopping list
export const bringListStore = writable<Array<{ id: number; name: string; icon: string }>>([]);

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

        const systemPrompt = `You are Bert, the Shopping List Assistant. Your task is to extract shopping items from user messages in both German and English.

Available predefined items:
${preselectedItems.map(item => item.name).join(', ')}

Current conversation context:
${messageHistory.map(msg => `[${msg.agent}]: ${msg.content}`).join('\n')}

Instructions:
1. Extract all shopping items from the user message
2. Match items to predefined list where possible
3. Detect the language (de/en) of the request
4. Return only actual shopping items, no other words`;

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
                    description: 'Extract shopping items and language',
                    input_schema: {
                        type: 'object',
                        properties: {
                            items: {
                                type: 'array',
                                items: { type: 'string' }
                            },
                            language: {
                                type: 'string',
                                enum: ['de', 'en']
                            }
                        },
                        required: ['items', 'language']
                    }
                }],
                temperature: 0.1
            })
        });

        const data = await response.json();
        console.log('[Bert] Claude response:', data);

        const toolCall = data.content?.find(c => c.type === 'tool_use');

        if (!toolCall?.input?.items || !toolCall?.input?.language) {
            throw new Error('Invalid tool response');
        }

        const { items, language } = toolCall.input;

        if (items.length === 0) {
            console.warn('[Bert] No items found in message');
            conversationManager.addMessage(
                'I could not identify any items in your request. Please try again.',
                'bert',
                'error'
            );
            throw new Error('No items found in message');
        }

        const newItems = items.map(itemName => {
            const predefined = preselectedItems.find(
                item => item.name.toLowerCase() === itemName.toLowerCase()
            );

            return {
                id: Date.now() + Math.random(),
                name: predefined?.name || itemName,
                icon: predefined?.icon || 'mdi:shopping'
            };
        });

        console.log('[Bert] Adding items:', newItems);

        bringListStore.update(list => {
            const updatedList = [...list, ...newItems];
            console.log('[Bert] Updated list:', updatedList);
            return updatedList;
        });

        const responseMessage = language === 'de'
            ? `Ich habe ${items.join(', ')} zu deiner Einkaufsliste hinzugefügt.`
            : `Added ${items.join(', ')} to your shopping list.`;

        console.log('[Bert] Response:', responseMessage);

        conversationManager.addMessage(
            responseMessage,
            'bert',
            'complete'
        );

        return {
            success: true,
            message: {
                agent: 'bert',
                content: responseMessage
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