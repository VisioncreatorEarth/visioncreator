import { conversationManager } from '$lib/stores/intentStore';

const actionViews = {
    updateName: {
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
                                value: ''
                            }
                        ],
                        validators: 'updateName',
                        submitAction: 'updateMe'
                    }
                }
            }
        ]
    },
    sendMail: {
        id: 'SendMailContainer',
        layout: {
            rows: '1fr auto',
            areas: `"main"`,
            style: 'margin-left: -1rem; margin-right: -1rem;'
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
                                value: ''
                            },
                            {
                                name: 'body',
                                type: 'textarea',
                                title: 'Your message',
                                value: ''
                            }
                        ],
                        validators: 'sendMail',
                        submitAction: 'sendMail'
                    }
                }
            }
        ]
    }
};

export const actionAgentTools = [
    {
        name: 'extractFormAction',
        description: 'Extract form action and field values from user messages',
        input_schema: {
            type: 'object',
            properties: {
                task: {
                    type: 'string',
                    description: 'The user message to process'
                },
                action: {
                    type: 'string',
                    enum: Object.keys(actionViews), // Dynamically use all available actions
                    description: 'The type of form action'
                },
                values: {
                    type: 'object',
                    description: 'Dynamic key-value pairs for form fields',
                    additionalProperties: true // Allow any field names
                }
            },
            required: ['task', 'action', 'values']
        }
    }
];

const actionSystemPrompts = {
    updateName: `You are Ali, the Action Agent. For name updates:
        1. Extract the desired name from the user's message
        2. Keep it simple and direct
        3. Only extract the name value
        4. If no clear name is provided, ask for clarification
        
        Use the updateName action with the appropriate name value.`,

    sendMail: `You are Ali, the Action Agent. Your task is to convert any request into an email format:
        1. Create a clear subject line summarizing the request
        2. Convert the message content into proper email format
        3. Ensure the content is in English (translate if necessary)
        4. Maintain a professional tone
        
        Extract these components and use the sendMail action with appropriate subject and body values.
        If the message is already in English, maintain its original meaning while formatting it as an email.`
    // Add more action-specific prompts as needed
};

export async function actionAgent(request: any) {
    try {
        const userMessage = request.task;
        const requestedAction = request.action || 'sendMail'; // Default to sendMail if no action specified

        console.log('Action agent processing message:', userMessage, 'Action:', requestedAction);

        conversationManager.addMessage(
            `Processing your ${requestedAction} request...`,
            'agent',
            'pending',
            'ali'
        );

        const response = await fetch('/local/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                messages: [{
                    role: 'user',
                    content: userMessage
                }],
                system: actionSystemPrompts[requestedAction],
                tools: actionAgentTools,
                temperature: 0
            })
        });

        const data = await response.json();
        console.log('Claude response:', data);

        const toolCall = data.content?.find(c => c.type === 'tool_use');

        if (!toolCall || !toolCall.input) {
            throw new Error('Invalid tool response');
        }

        const { action, values } = toolCall.input;

        // Get the view template
        const view = JSON.parse(JSON.stringify(actionViews[action]));

        // Generic field value update
        if (view.children[0].data.form.fields) {
            view.children[0].data.form.fields = view.children[0].data.form.fields.map(field => ({
                ...field,
                value: values[field.name] || ''
            }));
        }

        // Action-specific messages
        const actionMessages = {
            updateName: "I've processed your name update request. Please review:",
            sendMail: "I've formatted your request as an email. Please review and confirm:",
            // Add more action-specific messages as needed
        };

        const message = actionMessages[action] || "Please review your request:";

        // Add message to conversation with the action payload
        conversationManager.addMessage(
            message,
            'agent',
            'complete',
            'ali',
            [{
                type: 'action',
                content: {
                    action,
                    view,
                    tool_use_id: request.tool_use_id,
                    original_message: userMessage,
                    processed_values: values
                }
            }]
        );

        return {
            success: true,
            message: {
                role: 'assistant',
                content: message,
                metadata: {
                    type: 'action',
                    action,
                    view,
                    tool_use_id: request.tool_use_id,
                    original_message: userMessage,
                    processed_values: values
                }
            }
        };

    } catch (error) {
        console.error('Action Agent Error:', error);
        conversationManager.addMessage(
            'Sorry, I could not process that action.',
            'agent',
            'error',
            'ali'
        );
        throw error;
    }
}
