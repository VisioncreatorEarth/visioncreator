import { conversationManager } from '$lib/stores/intentStore';
import type { Message } from '$lib/stores/intentStore';
import { viewAgent } from '$lib/agents/viewAgent';
import { actionAgent } from '$lib/agents/actionAgent';
import { bringAgent } from '$lib/agents/bringAgent';
import { client } from '$lib/wundergraph';

export class HominioAgent {
    async processRequest(userMessage: string) {
        try {
            const currentContext = conversationManager.getCurrentConversation()?.messages || [];
            conversationManager.addMessage(userMessage, 'user', 'complete');

            const requestAnalysis = this.analyzeRequest(userMessage, currentContext);
            conversationManager.addMessage(
                "Let me get to work on that for you...",
                'hominio',
                'pending'
            );

            if (requestAnalysis.type === 'shopping') {
                try {
                    const [viewResult, shoppingResult] = await Promise.all([
                        this.delegateToAgent('view', {
                            task: 'open bring list view',
                            context: currentContext,
                            type: 'view'
                        }),
                        this.delegateToAgent('shopping', {
                            task: userMessage,
                            context: currentContext,
                            type: 'shopping'
                        })
                    ]);

                    return {
                        success: true,
                        message: {
                            agent: 'bert',
                            content: shoppingResult.message.content,
                            payload: viewResult.message?.payload
                        }
                    };

                } catch (error) {
                    console.error('Shopping request error:', error);
                    conversationManager.addMessage(
                        "I encountered an issue while processing your request. Please try again.",
                        'hominio',
                        'error'
                    );
                    throw error;
                }
            }

            const delegationMessage = await this.createDelegationMessage(userMessage, requestAnalysis.type, currentContext);

            if (typeof delegationMessage === 'object') {
                conversationManager.addMessage(
                    delegationMessage.content || JSON.stringify(delegationMessage),
                    'hominio',
                    'complete'
                );
            } else {
                conversationManager.addMessage(
                    delegationMessage,
                    'hominio',
                    'complete'
                );
            }

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
            console.error('HominioAgent error:', error);
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
"Hey [Agent], [task type]: [structured version of user request]"

For view requests, delegate to Vroni.
For other actions, delegate to Ali.

Examples:
User: "Can you update my name to Samuel?"
Response: "Hey Ali, updateName: Please update the user's name to Samuel"

User: "Show me banking"
Response: "Hey Vroni, view: Please show the banking view"`;

        try {
            // Convert conversation history to proper message format
            const conversationHistory = context.map(msg => ({
                role: msg.agent === 'user' ? 'user' : 'assistant',
                content: msg.content
            }));

            // Add the current user message
            conversationHistory.push({
                role: 'user',
                content: sanitizedMessage
            });

            const response = await client.mutate({
                operationName: 'askHominio',
                input: {
                    messages: conversationHistory,
                    system: systemPrompt,
                    temperature: 0
                }
            });

            if (response.data?.content) {
                if (typeof response.data.content === 'object' && 'text' in response.data.content) {
                    return response.data.content.text;
                }
                if (typeof response.data.content === 'string') {
                    return response.data.content;
                }
            }

            // Fallback to a default formatted message
            const agent = type === 'view' ? 'Vroni' : 'Ali';
            return `Hey ${agent}, ${type}: ${sanitizedMessage}`;

        } catch (error) {
            console.error('Error generating delegation message:', error);
            const agent = type === 'view' ? 'Vroni' : 'Ali';
            return `Hey ${agent}, ${type}: ${sanitizedMessage}`;
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
                    return await viewAgent(params);
                case 'shopping':
                    return await bringAgent(params);
                case 'action':
                    return await actionAgent(params);
                default:
                    throw new Error(`Unknown agent: ${selectedAgent}`);
            }
        } catch (error) {
            console.error(`Error delegating to ${selectedAgent}:`, error);
            throw error;
        }
    }

    private analyzeRequest(message: string, context: Message[]) {
        const msg = message.toLowerCase();

        // Shopping list related keywords - expanded for both German and English
        const shoppingKeywords = [
            'list', 'liste', 'einkauf', 'bring',
            'add', 'put', 'place', 'hinzufügen', 'füge', 'packe',
            'kaufen', 'buy', 'purchase', 'get'
        ];

        // Check for shopping list requests first
        if (shoppingKeywords.some(keyword => msg.includes(keyword))) {
            return { understood: true, isKnownSkill: true, type: 'shopping' };
        }

        // View request detection
        const viewKeywords = [
            'show', 'open', 'navigate', 'go to', 'switch to', 'display',
            'zeige', 'öffne', 'gehe zu', 'wechsle zu'
        ];

        const isViewRequest = (
            viewKeywords.some(keyword => msg.includes(keyword)) ||
            msg.match(/^(show|open|go to|switch to|display|zeige|öffne)\s+\w+/)
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

