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

            // Add user message to conversation
            conversationManager.addMessage(userMessage, 'user', 'complete');

            // Check if this is a follow-up edit request
            const isEditRequest = this.isEmailEditRequest(userMessage, currentContext);

            // Log Hominio thinking state
            conversationManager.addMessage(
                "I'm analyzing your request...",
                'agent',
                'pending',
                'hominio'
            );

            const response = await fetch('/local/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [
                        ...currentContext.map(msg => ({
                            role: msg.role === 'user' ? 'user' : 'assistant',
                            content: msg.content
                        })),
                        { role: 'user', content: userMessage }
                    ],
                    system: `You are Hominio, a coordinator agent.
                        ${isEditRequest ? 'IMPORTANT: Current request is to modify an existing email draft - ALWAYS use actionAgent for this.' : ''}
                        
                        Your tasks:
                        1. For ANY email/mail/message requests -> use actionAgent
                           - This includes new emails AND edit requests
                           - This includes requests to add names/signatures to emails
                        2. For explicit name update requests (NOT email signatures) -> use actionAgent
                        3. For view creation -> use viewAgent
                        4. For component modifications -> use componentAgent
                        
                        IMPORTANT: If the request mentions making an email shorter, adding a name to it, 
                        or any other email modifications -> this is an email edit request, use actionAgent`,
                    tools: coordinatorTools,
                    temperature: 0
                })
            });

            const claudeResponse = await response.json();
            const toolCall = claudeResponse.content.find(c => c.type === 'tool_use');

            if (!toolCall) {
                conversationManager.addMessage(
                    "I currently have 2 skills: writing mails to the team and updating your name. Nothing else works for now. Please try again.",
                    'agent',
                    'complete',
                    'hominio'
                );
                return;
            }

            const selectedAgent = toolCall.name;
            const delegationMessages = {
                actionAgent: (userMessage: string) => {
                    if (this.isEmailEditRequest(userMessage, currentContext)) {
                        return "I'll have Ali help you modify that email.";
                    }
                    if (userMessage.toLowerCase().includes('name') && !userMessage.toLowerCase().includes('mail')) {
                        return "I understand you want to update your name. I'll delegate this to Ali, our Action Agent.";
                    }
                    return "I'll have Ali help you send that message.";
                },
                viewAgent: "I'll have Walter create a view for you.",
                componentAgent: "I'll have our Component Agent modify that for you."
            };

            conversationManager.addMessage(
                typeof delegationMessages[selectedAgent] === 'function'
                    ? delegationMessages[selectedAgent](userMessage)
                    : delegationMessages[selectedAgent],
                'agent',
                'complete',
                'hominio'
            );

            return await this.delegateToAgent(selectedAgent, {
                task: userMessage,
                toolCall,
                tool_use_id: toolCall.tool_use_id,
                context: currentContext
            });

        } catch (error) {
            console.error('Error in Hominio:', error);
            conversationManager.addMessage(
                'Sorry, I encountered an error.',
                'agent',
                'error',
                'hominio'
            );
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
            const response = await agent(params);

            // Handle the agent response consistently
            if (response?.success && response.message?.metadata?.type === 'action') {
                // The action agent now handles its own message adding
                return response;
            }

            return response;
        } catch (error) {
            console.error(`Error delegating to ${selectedAgent}:`, error);
            throw error;
        }
    }

    private isEmailEditRequest(message: string, context: any[]): boolean {
        // Check if there's a previous email draft
        const hasEmailDraft = context.some(msg =>
            msg.metadata?.type === 'action' &&
            msg.metadata?.action === 'sendMail'
        );

        if (!hasEmailDraft) return false;

        // Enhanced edit request detection patterns
        const editPatterns = [
            /make.*shorter|make.*precise|edit|update|modify|change/i,
            /half.*length|shorter|longer|brief|concise/i,
            /add.*name|sign.*with|put.*name/i,
            /remove|delete|fix|adjust/i,
            /the (last|previous) (mail|email|message)/i
        ];

        // Check for name addition without explicit name update request
        const isNameAddition = message.toLowerCase().includes('name') &&
            !message.toLowerCase().includes('update name') &&
            !message.toLowerCase().includes('change name');

        return hasEmailDraft && (
            editPatterns.some(pattern => pattern.test(message)) ||
            isNameAddition
        );
    }
}

export const hominioAgent = new HominioAgent();
