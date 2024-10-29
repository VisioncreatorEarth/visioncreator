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
                    enum: ['updateName', 'sendMail'],
                    description: 'The type of form action to perform'
                },
                values: {
                    type: 'object',
                    description: 'Dynamic key-value pairs for form fields',
                    additionalProperties: true
                }
            },
            required: ['task', 'action', 'values']
        }
    }
];

const actionSystemPrompts = {
    updateName: `You are Ali, the Action Agent. For name updates:
        1. Extract the desired name from the user's message
        2. Use the updateName action
        3. Set the name value in the values object
        4. If no clear name is provided, ask for clarification
        
        Example: For "change name to John", use:
        {
            action: "updateName",
            values: { name: "John" }
        }`,

    sendMail: `You are Ali, the Action Agent. For email requests:
        1. Create a clear subject line
        2. Format the message content
        3. Use the sendMail action
        4. Set both subject and body in the values object
        
        Example: For "send email about meeting", use:
        {
            action: "sendMail",
            values: { 
                subject: "Meeting Request",
                body: "..."
            }
        }`
};

export async function actionAgent(request: any) {
    try {
        const userMessage = request.task;

        // Initial pending message
        conversationManager.addMessage(
            `Processing your request...`,
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
                system: `You are an action parser. Extract form data from user messages.
                    For emails/messages (including informal or foreign language requests):
                    {
                        "action": "sendMail",
                        "values": {
                            "subject": "Extracted or generated subject",
                            "body": "Extracted or formatted message body"
                        }
                    }
                    For name updates:
                    {
                        "action": "updateName",
                        "values": {
                            "name": "Extracted name"
                        }
                    }`,
                tools: [{
                    name: 'extractFormAction',
                    description: 'Extract form action and values',
                    input_schema: {
                        type: 'object',
                        properties: {
                            action: {
                                type: 'string',
                                enum: ['sendMail', 'updateName']
                            },
                            values: {
                                type: 'object',
                                additionalProperties: true
                            }
                        },
                        required: ['action', 'values']
                    }
                }],
                temperature: 0
            })
        });

        const data = await response.json();
        console.log('Claude response:', data);

        const toolCall = data.content?.find(c => c.type === 'tool_use');

        if (!toolCall?.input?.action || !toolCall?.input?.values) {
            throw new Error('Invalid tool response');
        }

        const { action, values } = toolCall.input;

        // Get the view template and create a deep copy
        const view = JSON.parse(JSON.stringify(actionViews[action]));

        // Enhanced form field value setting
        if (view.children[0].data.form.fields) {
            view.children[0].data.form.fields = view.children[0].data.form.fields.map(field => {
                const fieldValue = values[field.name];
                return {
                    ...field,
                    value: fieldValue ? fieldValue.trim() : ''
                };
            });
        }

        const actionMessages = {
            updateName: `I've prepared a form to update your name to "${values.name}". Please review and confirm:`,
            sendMail: "I've formatted your message. Please review and confirm:"
        };

        const message = actionMessages[action] || "Please review your request:";

        const responsePayload = {
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

        return responsePayload;

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
