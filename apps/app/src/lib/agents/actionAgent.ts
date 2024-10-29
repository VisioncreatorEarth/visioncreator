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
        1. ALWAYS compose emails in professional English, regardless of input language
        2. Create a clear subject line in English
        3. Format the message content in English
        4. Use the sendMail action
        5. For follow-up edits:
           - Review previous message history
           - Identify the last email draft
           - Apply requested changes while maintaining English format
        
        Example for new email: 
        {
            action: "sendMail",
            values: { 
                subject: "Meeting Request",
                body: "Professional English content..."
            }
        }

        Example for edit request:
        - Find latest draft from context
        - Apply changes while keeping English format
        - Return updated full draft`
};

export async function actionAgent(request: any) {
    try {
        const userMessage = request.task;
        const messageHistory = request.context || [];

        // Find latest email draft from context
        const lastEmailDraft = messageHistory
            .reverse()
            .find(msg =>
                msg.metadata?.type === 'action' &&
                msg.metadata?.action === 'sendMail'
            )?.metadata?.processed_values;

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
                messages: [
                    {
                        role: 'system',
                        content: lastEmailDraft ?
                            `You are editing an existing email draft:
                            Subject: ${lastEmailDraft.subject}
                            Content: ${lastEmailDraft.body}
                            
                            Apply the user's requested changes to this existing draft.
                            Return the modified version in the same format.
                            Keep the same subject unless specifically asked to change it.`
                            : 'Create a new email draft based on the user request.'
                    },
                    {
                        role: 'user',
                        content: userMessage
                    }
                ],
                system: `You are an action parser. For email requests:
                    1. If editing existing draft (indicated by system message):
                       - Modify the existing content according to user's request
                       - Keep same subject unless asked to change
                       - Return modified version
                    2. If new email:
                       - Create fresh content
                       - Generate appropriate subject
                    
                    Always return in format:
                    {
                        "action": "sendMail",
                        "values": {
                            "subject": "Subject line",
                            "body": "Email content"
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
                                properties: {
                                    subject: { type: 'string' },
                                    body: { type: 'string' }
                                },
                                required: ['subject', 'body']
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
