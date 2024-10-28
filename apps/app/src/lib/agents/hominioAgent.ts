import { conversationManager } from '$lib/stores/intentStore';

export const coordinatorTools = [
    {
        name: 'actionAgent',
        description: 'MUST be used for form-based actions like "update name" or "send mail".',
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
                    tools: coordinatorTools
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
                actionAgent: "I understand you want to update your name. I'll delegate this to Ali, our Action Agent.",
                viewAgent: "I'll have Walter create a view for you.",
                componentAgent: "I'll have our Component Agent modify that for you."
            };

            conversationManager.addMessage(
                delegationMessages[selectedAgent],
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

            // Handle the agent response
            if (response?.success) {
                if (selectedAgent === 'actionAgent' && response.view) {
                    conversationManager.addMessage(
                        "I'll help you update your name. Here's a form to do that:",
                        'agent',
                        'complete',
                        'ali',
                        [{
                            type: 'action',
                            content: {
                                action: 'updateName',
                                view: response.view
                            }
                        }]
                    );
                }
            }

            return response;
        } catch (error) {
            console.error(`Error delegating to ${selectedAgent}:`, error);
            throw error;
        }
    }
}

export const hominioAgent = new HominioAgent();
