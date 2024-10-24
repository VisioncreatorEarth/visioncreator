import type { Anthropic } from '@anthropic-ai/sdk';
import { z } from 'zod';

const UpdateNameSchema = z.object({
    name: z.string()
        .min(2, 'Name must be at least 2 characters')
        .max(50, 'Name must not exceed 50 characters')
});

const EmailSchema = z.object({
    subject: z.string()
        .min(3, 'Please share a topic for your message')
        .max(40, "Let's keep the subject concise"),
    body: z.string()
        .min(10, 'Your message is important to us')
        .max(2000, "Let's keep it a bit shorter")
});

const actionUpdateNameView = {
    id: 'UpdateNameContainer',
    layout: {
        rows: '1fr auto',
        areas: `"main"`
    },
    children: [
        {
            id: 'HominioForm',
            component: 'HominioForm',
            slot: 'main',
            data: {
                form: {
                    fields: [
                        {
                            name: 'name',
                            type: 'text',
                            title: 'What is your name?',
                            description: 'Please enter your first name',
                            value: '' // Will be populated by AI
                        }
                    ],
                    validators: 'updateName', // Now just passing the schema name
                    submitAction: 'updateName'
                }
            }
        }
    ]
};

const actionSendMailView = {
    id: 'SendMailContainer',
    layout: {
        rows: '1fr auto',
        areas: `"main"`
    },
    children: [
        {
            id: 'HominioForm',
            component: 'HominioForm',
            slot: 'main',
            data: {
                form: {
                    fields: [
                        {
                            name: 'subject',
                            type: 'text',
                            title: "What's the topic?",
                            description: 'Share a short title about what you want to talk to us',
                            value: '' // Will be populated by AI
                        },
                        {
                            name: 'body',
                            type: 'textarea',
                            title: 'Your message',
                            description: 'Paint us a picture with your words',
                            value: '' // Will be populated by AI
                        }
                    ],
                    validators: 'sendMail', // Now just passing the schema name
                    submitAction: 'sendMail'
                }
            }
        }
    ]
};

const actionViews = {
    updateName: actionUpdateNameView,
    sendMail: actionSendMailView
};

export async function actionAgent(anthropic: Anthropic, request: any) {
    try {
        const userMessage = request.agentInput?.task || request.messages[request.messages.length - 1].content;
        console.log('Action agent processing message:', userMessage);

        let action = '';
        let extractedValues = {};

        // Extract action and values from message
        if (userMessage.toLowerCase().includes('update') && userMessage.toLowerCase().includes('name')) {
            action = 'updateName';
            // Extract name value using regex
            const nameMatch = userMessage.match(/name to ([a-zA-Z]+)/i);
            if (nameMatch) {
                extractedValues = { name: nameMatch[1] };
            }
        } else if (userMessage.toLowerCase().includes('send') && userMessage.toLowerCase().includes('mail')) {
            action = 'sendMail';
            // Add mail extraction logic here if needed
        }

        if (action && actionViews[action]) {
            // Deep clone the view to avoid modifying the original
            const view = JSON.parse(JSON.stringify(actionViews[action]));

            // Update field values in the view
            view.children[0].data.form.fields = view.children[0].data.form.fields.map(field => ({
                ...field,
                value: extractedValues[field.name] || ''
            }));

            const actionConfig = {
                action: action,
                view: view,
                values: extractedValues
            };

            console.log('Action agent returning config:', JSON.stringify(actionConfig, null, 2));
            return {
                type: 'tool_result',
                tool_use_id: request.tool_use_id,
                content: actionConfig
            };
        }

        return {
            type: 'tool_result',
            tool_use_id: request.tool_use_id,
            content: "I couldn't determine the appropriate action for your request.",
            is_error: true
        };
    } catch (error) {
        console.error('Error in actionAgent:', error);
        return {
            type: 'tool_result',
            tool_use_id: request.tool_use_id,
            content: 'An error occurred while processing your request in the actionAgent.',
            is_error: true
        };
    }
}
