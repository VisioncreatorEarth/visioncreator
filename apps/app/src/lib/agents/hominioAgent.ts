import { conversationManager } from '$lib/stores/intentStore';
import type { Message } from '$lib/stores/intentStore';
import { viewAgent } from '$lib/agents/viewAgent';
import { actionAgent } from '$lib/agents/actionAgent';

export class HominioAgent {
    async processRequest(userMessage: string) {
        try {
            const currentContext = conversationManager.getCurrentConversation()?.messages || [];
            conversationManager.addMessage(userMessage, 'user', 'complete');

            const requestAnalysis = this.analyzeRequest(userMessage, currentContext);

            if (!requestAnalysis.understood) {
                conversationManager.addMessage(
                    "I'm not quite sure what you'd like me to do. I can help you with writing emails, editing emails, updating your name, or navigating to different views. Could you please clarify your request?",
                    'hominio',
                    'complete'
                );
                return null;
            }

            if (!requestAnalysis.isKnownSkill) {
                conversationManager.addMessage(
                    "I can help you with writing emails, editing emails, updating your name, or navigating to different views like banking, bring, or splitwise. What would you like to do?",
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
                const agent = requestAnalysis.type === 'view' ? 'view' : 'action';
                const result = await this.delegateToAgent(agent, {
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

        try {
            const response = await fetch('/local/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [
                        {
                            role: 'system',
                            content: `You are Hominio, a request clarification specialist. Your role is to:
1. Take user requests and add minimal but crucial structure
2. Preserve the user's intent while adding necessary context
3. Keep delegations extremely concise

Format all responses as:
"[Agent], [task type]: [structured version of user request]"

For view requests, delegate to Vroni.
For other actions, delegate to Ali.

Examples:
User: "Can you update my name to Samuel?"
Response: "Ali, updateName: Please update the user's name to Samuel"

User: "Show me banking"
Response: "Vroni, view: Please show the banking view"`
                        },
                        { role: 'user', content: sanitizedMessage }
                    ],
                    temperature: 0
                })
            });

            const data = await response.json();
            console.log('Claude delegation response:', data);

            if (data.content?.[0]?.text) {
                return data.content[0].text;
            }

            throw new Error('Invalid delegation message response');

        } catch (error) {
            console.error('Error generating delegation message:', error);
            const agent = type === 'view' ? 'Vroni' : 'Ali';
            return `${agent}, ${type}: ${sanitizedMessage}`;
        }
    }

    private sanitizeRequest(message: string): string {
        return message
            .replace(/fucking|shit|damn|crap/gi, '')
            .replace(/\s+/g, ' ')
            .trim();
    }

    private async delegateToAgent(selectedAgent: string, params: any) {
        try {
            console.log('Delegating to agent:', selectedAgent, 'with params:', params);

            switch (selectedAgent) {
                case 'view':
                    if (!viewAgent) {
                        throw new Error('viewAgent not loaded');
                    }
                    return await viewAgent(params);
                case 'action':
                    if (!actionAgent) {
                        throw new Error('actionAgent not loaded');
                    }
                    return await actionAgent(params);
                default:
                    throw new Error(`Unknown agent: ${selectedAgent}`);
            }
        } catch (error) {
            console.error(`Error delegating to ${selectedAgent} agent:`, error);
            throw error;
        }
    }

    private analyzeRequest(message: string, context: Message[]) {
        const msg = message.toLowerCase();

        // Check for view requests first
        const viewKeywords = [
            'show', 'open', 'navigate', 'go to', 'switch to', 'display',
            'banking', 'bring', 'splitwise', 'airbnb', 'kanban', 'helloearth'
        ];

        // More specific view command detection
        const isViewRequest = (
            viewKeywords.some(keyword => msg.includes(keyword)) ||
            msg.match(/^(show|open|go to|switch to|display)\s+\w+/)
        );

        if (isViewRequest) {
            return { understood: true, isKnownSkill: true, type: 'view' };
        }

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
            'create', 'make', 'build', 'view', 'display',
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

