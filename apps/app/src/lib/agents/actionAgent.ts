import { conversationManager } from '$lib/stores/intentStore';
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
                    submitAction: 'updateMe'
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
                            value: '' // Will be populated by AI, make sure to deliver a short title, less than 40 
                        },
                        {
                            name: 'body',
                            type: 'textarea',
                            title: 'Your message',
                            description: 'Paint us a picture with your words',
                            value: '' // Will be populated by AI, write a nice text based on the users request, just like an official personal mail. 
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

export async function actionAgent(request: any) {
    try {
        const userMessage = request.task;
        console.log('Action agent processing message:', userMessage);
        conversationManager.addMessage(
            'Processing your action request...',
            'agent',
            'pending',
            'ali'
        );

        // Call Claude through our server endpoint
        const response = await fetch('/local/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                messages: [{ role: 'user', content: userMessage }],
                system: `Extract form action data. Return JSON with action (updateName|sendMail) and values.`
            })
        });

        const data = await response.json();
        let extractedData = null;

        if (data.content?.[0]?.text) {
            try {
                extractedData = JSON.parse(data.content[0].text);
            } catch (e) {
                console.error('Failed to parse response:', e);
            }
        }

        if (extractedData?.action && actionViews[extractedData.action]) {
            const view = JSON.parse(JSON.stringify(actionViews[extractedData.action]));

            // Update field values
            view.children[0].data.form.fields = view.children[0].data.form.fields.map(field => ({
                ...field,
                value: extractedData.values[field.name] || ''
            }));

            conversationManager.addMessage(
                `Form prepared for: ${extractedData.action}`,
                'agent',
                'complete',
                'ali',
                [{
                    type: 'action',
                    content: {
                        action: extractedData.action,
                        view: view
                    }
                }]
            );

            return { success: true, view };
        }

        throw new Error('Could not process action');
    } catch (error) {
        console.error('Action Agent Error:', error);
        conversationManager.addMessage(
            'Sorry, I could not process that action.',
            'agent',
            'error',
            'ali'
        );
        return { error: true };
    }
}
