import { conversationManager } from '$lib/stores/intentStore';

export class HominioAgent {
    async processRequest(userMessage: string) {
        try {
            const currentContext = conversationManager.getCurrentConversation()?.messages || [];
            conversationManager.addMessage(userMessage, 'user', 'complete');

            const requestAnalysis = this.analyzeRequest(userMessage, currentContext);

            if (!requestAnalysis.understood) {
                conversationManager.addMessage(
                    "I'm not quite sure what you'd like me to do. I can help you with writing new emails, editing existing emails, or updating your name. Could you please clarify your request?",
                    'hominio',
                    'complete'
                );
                return null;
            }

            if (!requestAnalysis.isKnownSkill) {
                conversationManager.addMessage(
                    "I can only help with writing emails, editing existing emails, or updating your name. I'm not able to help with other requests yet. Would you like help with any of these?",
                    'hominio',
                    'complete'
                );
                return null;
            }

            if (!requestAnalysis.type) {
                conversationManager.addMessage(
                    "I understand you want help, but could you be more specific about what you'd like me to do?",
                    'hominio',
                    'complete'
                );
                return null;
            }

            conversationManager.addMessage(
                "Let me get to work on that for you...",
                'hominio',
                'pending'
            );

            // Generate AI delegation message using structured approach
            const delegationMessage = await this.createDelegationMessage(userMessage, requestAnalysis.type, currentContext);
            conversationManager.addMessage(delegationMessage, 'hominio', 'complete');

            try {
                const result = await this.delegateToAgent('actionAgent', {
                    task: userMessage,
                    context: currentContext,
                    type: requestAnalysis.type
                });
                return result;
            } catch (error) {
                console.error('Delegation error:', error);
                conversationManager.addMessage(
                    "I apologize, but I encountered an issue while processing your request. Could you try rephrasing it?",
                    'hominio',
                    'complete'
                );
                return null;
            }

        } catch (error) {
            console.error('Hominio Agent Error:', error);
            conversationManager.addMessage(
                'I apologize, but something went wrong. Please try again.',
                'hominio',
                'error'
            );
            return null;
        }
    }

    private async createDelegationMessage(userMessage: string, type: string, context: any[]): Promise<string> {
        const sanitizedMessage = this.sanitizeRequest(userMessage);

        const systemPrompt = `You are Hominio, a request clarification specialist. Your role is to:
1. Take user requests and add minimal but crucial structure
2. Preserve the user's intent while adding necessary context
3. Keep delegations extremely concise

Format all responses as:
"Ali, [task type]: [structured version of user request]"

Add only essential specifications. Do not implement or expand the content.

Example:
User: "Can you update my name to Samuel?"
Response: "Ali, updateName: Please update the user's name to Samuel"`;

        try {
            const response = await fetch('/local/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: sanitizedMessage }
                    ],
                    tools: [{
                        name: 'createDelegationMessage',
                        description: 'Create a clear task definition for Ali',
                        input_schema: {
                            type: 'object',
                            properties: {
                                message: {
                                    type: 'string',
                                    description: 'The task definition message'
                                }
                            },
                            required: ['message']
                        }
                    }]
                })
            });

            const data = await response.json();
            console.log('Claude delegation response:', data);

            // Handle both tool_calls and tool_use formats
            const toolCall = data.content?.find(c => c.type === 'tool_calls' || c.type === 'tool_use');

            if (toolCall?.input?.message) {
                return toolCall.input.message;
            }

            // Fallback to content if no tool call
            if (data.content?.[0]?.text) {
                const text = data.content[0].text;
                if (text.includes('Ali,')) {
                    return text;
                }
            }

            throw new Error('Invalid delegation message response');

        } catch (error) {
            console.error('Error generating delegation message:', error);
            // Improved fallback message
            return `Ali, ${type}: Please help process the user's request to "${sanitizedMessage}"`;
        }
    }

    private sanitizeRequest(message: string): string {
        return message
            .replace(/fucking|shit|damn|crap/gi, '')
            .replace(/\s+/g, ' ')
            .trim();
    }

    private async delegateToAgent(selectedAgent: string, params: any) {
        const agents = {
            actionAgent: () => import('./actionAgent').then(m => m.actionAgent),
            viewAgent: () => import('./viewAgent').then(m => m.viewAgent),
            componentAgent: () => import('./componentAgent').then(m => m.componentAgent)
        };

        try {
            const agent = await agents[selectedAgent]();
            const result = await agent(params);

            if (!result) {
                throw new Error('Agent returned no result');
            }

            return result;
        } catch (error) {
            console.error(`Error delegating to ${selectedAgent}:`, error);
            throw error;
        }
    }

    private analyzeRequest(message: string, context: any[]): {
        understood: boolean;
        isKnownSkill: boolean;
        type?: 'editEmail' | 'newEmail' | 'updateName' | null;
    } {
        const msg = message.toLowerCase();

        if (this.isEmailEditRequest(message, context)) {
            return { understood: true, isKnownSkill: true, type: 'editEmail' };
        }

        if (msg.includes('mail') || msg.includes('email') ||
            msg.includes('write') || msg.includes('send')) {
            return { understood: true, isKnownSkill: true, type: 'newEmail' };
        }

        if (msg.includes('name') && !msg.includes('mail') && !msg.includes('email')) {
            return { understood: true, isKnownSkill: true, type: 'updateName' };
        }

        const unknownSkillIndicators = [
            'create', 'make', 'build', 'show', 'view', 'display',
            'delete', 'remove', 'add', 'component', 'page', 'feature'
        ];

        if (unknownSkillIndicators.some(indicator => msg.includes(indicator))) {
            return { understood: true, isKnownSkill: false, type: null };
        }

        return { understood: false, isKnownSkill: false, type: null };
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
