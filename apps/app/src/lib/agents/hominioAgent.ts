import { conversationManager } from '$lib/stores/intentStore';

export const coordinatorTools = [
    {
        name: 'actionAgent',
        description: 'MUST be used for form-based actions like "update name" or "send mail". Use this for ANY email/mail related requests or name updates.',
        input_schema: {
            type: 'object',
            properties: {
                task: { type: 'string', description: 'The action task to be performed' }
            },
            required: ['task']
        }
    },
    {
        name: 'viewAgent',
        description: 'Use for showing or creating component views when no form action is required.',
        input_schema: {
            type: 'object',
            properties: {
                task: { type: 'string', description: 'The view creation task' }
            },
            required: ['task']
        }
    },
    {
        name: 'componentAgent',
        description: 'Use for modifying or creating new Svelte components.',
        input_schema: {
            type: 'object',
            properties: {
                task: { type: 'string', description: 'The component modification task' }
            },
            required: ['task']
        }
    }
];

export class HominioAgent {
    async processRequest(userMessage: string) {
        try {
            // Get current conversation context first
            const currentContext = conversationManager.getCurrentConversation()?.messages || [];

            // Add initial analysis message
            conversationManager.addMessage(
                "I'm analyzing your request...",
                'hominio',
                'pending'
            );

            // Check if this is a follow-up edit request
            const isEditRequest = this.isEmailEditRequest(userMessage, currentContext);
            const lastEmailDraft = currentContext
                .reverse()
                .find(msg => msg.payload?.action === 'sendMail');

            // Direct messages to Ali based on request type
            if (isEditRequest && lastEmailDraft) {
                conversationManager.addMessage(
                    "Ali, the user wants to modify their previous email draft. Please help them make the requested changes.",
                    'hominio',
                    'complete'
                );
            } else if (userMessage.toLowerCase().includes('mail') || userMessage.toLowerCase().includes('email')) {
                conversationManager.addMessage(
                    "Ali, please help compose a new email based on the user's request.",
                    'hominio',
                    'complete'
                );
            } else if (userMessage.toLowerCase().includes('name')) {
                conversationManager.addMessage(
                    "Ali, please prepare a name update form based on the user's request.",
                    'hominio',
                    'complete'
                );
            }

            // Delegate to action agent with full context
            return await this.delegateToAgent('actionAgent', {
                task: userMessage,
                context: currentContext
            });

        } catch (error) {
            console.error('Hominio Agent Error:', error);
            conversationManager.addMessage(
                'An error occurred while processing your request.',
                'hominio',
                'error'
            );
            throw error;
        }
    }

    private async delegateToAgent(selectedAgent: string, params: any) {
        const agents = {
            actionAgent: () => import('./actionAgent').then(m => m.actionAgent),
            viewAgent: () => import('./viewAgent').then(m => m.viewAgent),
            componentAgent: () => import('./componentAgent').then(m => m.componentAgent)
        };

        try {
            const agent = await agents[selectedAgent]();
            return await agent(params);
        } catch (error) {
            console.error(`Error delegating to ${selectedAgent}:`, error);
            throw error;
        }
    }

    private isEmailEditRequest(message: string, context: any[]): boolean {
        const lastEmailDraft = context
            .reverse()
            .find(msg => msg.payload?.action === 'sendMail');

        if (!lastEmailDraft) return false;

        const editKeywords = [
            'edit', 'update', 'modify', 'change', 'revise',
            'add', 'include', 'append', 'extend',
            'remove', 'delete', 'take out',
            'subject', 'title', 'topic',
            'signature', 'sign', 'name',
            'more', 'details', 'points', 'information'
        ];

        return editKeywords.some(keyword =>
            message.toLowerCase().includes(keyword)
        );
    }
}

export const hominioAgent = new HominioAgent();
