import { conversationManager } from '$lib/stores/intentStore';

const actionViews = {
    updateName: (formId: string) => ({
        id: 'UpdateNameContainer',
        layout: {
            rows: '1fr auto',
            areas: `"main"`
        },
        children: [
            {
                id: `HominioForm_${formId}`,
                component: 'HominioForm',
                slot: 'main',
                data: {
                    formId,
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
    }),
    sendMail: (formId: string) => ({
        id: 'SendMailContainer',
        layout: {
            rows: '1fr auto',
            areas: `"main"`,
            style: 'margin-left: -1rem; margin-right: -1rem;'
        },
        children: [
            {
                id: `HominioForm_${formId}`,
                component: 'HominioForm',
                slot: 'main',
                data: {
                    formId,
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
    })
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

        // Get the last email draft if it exists
        const lastEmailDraft = messageHistory
            .reverse()
            .find(msg => msg.payload?.action === 'sendMail');

        const systemPrompt = `You are Ali, the Action Agent. Analyze the conversation history and user's request to:
1. For name updates: Extract name from messages like "change name to X"
2. For emails: 
   - Create new emails or modify existing drafts
   - Maintain context and previous content when editing
   - Keep formatting and structure consistent
   - Preserve signatures and personal details

Current conversation context:
${messageHistory.map(msg => `[${msg.agent}]: ${msg.content}${msg.payload ? `\nPayload: ${JSON.stringify(msg.payload)}` : ''
            }`).join('\n')}

Last email draft: ${lastEmailDraft ? JSON.stringify(lastEmailDraft.payload) : 'None'}

Instructions:
- When editing emails, preserve existing structure and only modify requested parts
- Keep all formatting, including line breaks and sections
- Maintain existing signatures, just update the name if requested
- For new emails, create a well-structured format with clear sections`;

        conversationManager.addMessage(
            "Processing your request...",
            'ali',
            'pending'
        );

        const response = await fetch('/local/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userMessage }
                ],
                tools: [{
                    name: 'extractFormAction',
                    description: 'Extract form action and values',
                    input_schema: {
                        type: 'object',
                        properties: {
                            action: {
                                type: 'string',
                                enum: ['updateName', 'sendMail']
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
        const formId = crypto.randomUUID();

        // Get the view template with unique ID
        const view = actionViews[action](formId);

        // Enhanced form field value setting with validation
        if (view.children[0].data.form.fields) {
            view.children[0].data.form.fields = view.children[0].data.form.fields.map(field => {
                const fieldValue = values[field.name];
                // Ensure we have a valid value
                if (!fieldValue && action === 'updateName') {
                    // Extract name from the last user message if not provided
                    const nameMatch = userMessage.match(/(?:change|update|set).*name.*to\s+["']?([^"']+)["']?/i);
                    if (nameMatch) {
                        values[field.name] = nameMatch[1].trim();
                    }
                }
                return {
                    ...field,
                    value: values[field.name] ? values[field.name].trim() : ''
                };
            });
        }

        // Enhanced message for form updates
        const actionMessages = {
            updateName: `I've prepared a name update form with "${values.name}". Please review:`,
            sendMail: lastEmailDraft
                ? "I've updated the email draft with your changes. Please review:"
                : "I've formatted your new email. Please review:"
        };

        const message = actionMessages[action] || "Please review your request:";

        conversationManager.addMessage(
            message,
            'ali',
            'complete',
            {
                view,
                action
            }
        );

        return {
            success: true,
            message: {
                agent: 'ali',
                content: message,
                payload: {
                    view,
                    action
                }
            }
        };

    } catch (error) {
        console.error('Action Agent Error:', error);
        conversationManager.addMessage(
            'Sorry, I could not process that action.',
            'ali',
            'error'
        );
        throw error;
    }
}
