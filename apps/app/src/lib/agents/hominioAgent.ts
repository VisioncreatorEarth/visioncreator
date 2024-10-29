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
            // Add user message to conversation
            conversationManager.addMessage(userMessage, 'user', 'complete');

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
                    messages: [{ role: 'user', content: userMessage }],
                    system: `You are Hominio, a coordinator agent. Your main tasks:
                    1. For ANY email/mail/message sending requests -> use actionAgent
                    2. For name update requests -> use actionAgent
                    3. For view creation -> use viewAgent
                    4. For component modifications -> use componentAgent
                    
                    IMPORTANT: ANY mention of email, mail, message, or writing should be directed to actionAgent.
                    Even if the request is informal or in different languages, if it's about sending a message, use actionAgent.`,
                    tools: coordinatorTools,
                    temperature: 0
                })
            });

            const claudeResponse = await response.json();
            const toolCall = claudeResponse.content.find(c => c.type === 'tool_use');

            if (!toolCall) {
                conversationManager.addMessage(
                    "I can help you send emails or update your name. Would you like to do either of those?",
                    'agent',
                    'complete',
                    'hominio'
                );
                return;
            }

            const selectedAgent = toolCall.name;
            const delegationMessages = {
                actionAgent: (userMessage: string) => {
                    if (userMessage.toLowerCase().includes('name')) {
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
                context: conversationManager.getCurrentConversation()?.messages || []
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
}

export const hominioAgent = new HominioAgent();
