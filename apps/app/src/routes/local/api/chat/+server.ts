import { dev } from '$app/environment';
import { json } from '@sveltejs/kit';
import { Anthropic } from '@anthropic-ai/sdk';
import { env } from '$env/dynamic/private';
import { componentAgent } from '$lib/agents/componentAgent';
import { viewAgent } from '$lib/agents/viewAgent';
import { actionAgent } from '$lib/agents/actionAgent';
import { conversationManager } from '$lib/stores/intentStore';

let anthropic: Anthropic | null = null;

if (dev && env.SECRET_ANTHROPIC_API_KEY) {
    anthropic = new Anthropic({
        apiKey: env.SECRET_ANTHROPIC_API_KEY
    });
}

// Define available agents
const agents = {
    componentAgent,
    viewAgent,
    actionAgent
};

const coordinatorTools = [
    {
        name: 'actionAgent',
        description: 'MUST be used for form-based actions like "update name" or "send mail". This is the primary agent for handling user data updates and communications.',
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
                task: { type: 'string', description: 'The view creation task to be performed' }
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

export async function POST({ request }: { request: Request }) {
    if (!dev || !anthropic) {
        return json({ error: 'Service not available' }, { status: 403 });
    }

    try {
        const { messages, sessionId } = await request.json();

        // Start new conversation if needed
        if (!conversationManager.getCurrentConversation()) {
            conversationManager.startNewConversation();
        }

        const result = await masterCoordinator(anthropic, messages);
        return json(result);
    } catch (error) {
        console.error('Error:', error);
        return json({ error: 'Request processing failed' }, { status: 500 });
    }
}

export async function DELETE() {
    if (!dev) {
        return json({ error: 'Service not available' }, { status: 403 });
    }

    try {
        // Simply return success - the client side will handle the actual reset
        return json({ status: 'Context reset successful' });
    } catch (error) {
        console.error('Error in DELETE handler:', error);
        return json({ error: 'Internal server error' }, { status: 500 });
    }
}

async function masterCoordinator(anthropic: Anthropic, messages: any[]) {
    try {
        const processedMessages = processMessages(messages);
        const lastMessage = processedMessages[processedMessages.length - 1]?.content;

        // Add user message
        conversationManager.addMessage(lastMessage, 'user', 'complete');

        const coordinatorResponse = await anthropic.messages.create({
            model: 'claude-3-5-sonnet-20240620',
            max_tokens: 1000,
            messages: processedMessages,
            temperature: 0.7,
            tools: coordinatorTools
        });

        const toolCall = coordinatorResponse.content.find(c => c.type === 'tool_use');

        // Handle clarification needed with hardcoded message
        if (!toolCall) {
            const clarificationContent = "I currently have 2 skills: writing mails to the team and updating your name. Nothing else works for now. Please try again.";
            conversationManager.addMessage(
                clarificationContent,
                'agent',
                'complete',
                'hominio'
            );

            return {
                type: 'clarification_needed',
                content: clarificationContent,
                needsClarification: true,
                context: conversationManager.getCurrentConversation()?.messages || []
            };
        }

        // Add agent message
        conversationManager.addMessage(
            `I'll handle this request. Processing...`,
            'agent',
            'complete',
            toolCall.name as AgentType
        );

        // Pass full context to agents
        const agentResult = await agents[toolCall.name](anthropic, {
            messages: conversationManager.getCurrentConversation()?.messages || [],
            agentInput: {
                ...toolCall.input,
                originalRequest: lastMessage,
                context: conversationManager.getCurrentConversation()?.messages || []
            },
            tool_use_id: toolCall.tool_use_id
        });

        // Add completion message
        conversationManager.addMessage(
            `Task completed based on your request: "${lastMessage}". Let me know if you need anything else.`,
            'agent',
            'complete',
            'hominio'
        );

        // Return result with full context
        if (agentResult.message?.toolResult?.type === 'action') {
            return {
                type: 'action',
                content: agentResult.message.toolResult.data,
                message: {
                    role: 'hominio',
                    content: `Task completed based on your request: "${lastMessage}". Let me know if you need anything else.`,
                    timestamp: Date.now()
                },
                context: conversationManager.getCurrentConversation()?.messages || []
            };
        }

        return {
            ...agentResult,
            context: conversationManager.getCurrentConversation()?.messages || []
        };

    } catch (error) {
        console.error('Error:', error);
        conversationManager.addMessage(
            'An error occurred while processing your request.',
            'agent',
            'error',
            'system'
        );
        throw error;
    }
}

function processMessages(messages: any[]) {
    if (!Array.isArray(messages) || messages.length === 0) {
        return [{
            role: 'user',
            content: 'Hello, I need assistance.'
        }];
    }

    return messages.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content || ''
    }));
}
