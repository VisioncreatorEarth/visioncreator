import { dev } from '$app/environment';
import { json } from '@sveltejs/kit';
import { Anthropic } from '@anthropic-ai/sdk';
import { env } from '$env/dynamic/private';
import { componentAgent } from '$lib/agents/componentAgent';
import { viewAgent } from '$lib/agents/viewAgent';
import { actionAgent } from '$lib/agents/actionAgent';
import { intentManager } from '$lib/agentStore';
import type { Message } from '$lib/agentStore';

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
        if (!intentManager.getCurrentMessages().length) {
            intentManager.create(sessionId);
        }

        const result = await masterCoordinator(anthropic, messages);
        return json(result);
    } catch (error) {
        console.error('Error:', error);
        return json({ error: 'Request processing failed' }, { status: 500 });
    }
}

async function masterCoordinator(anthropic: Anthropic, messages: any[]) {
    try {
        const processedMessages = processMessages(messages);
        const lastMessage = processedMessages[processedMessages.length - 1]?.content;

        // Log initial intent with full message structure
        console.log('📥 Intent:', JSON.stringify({
            type: 'intent',
            message: lastMessage,
            timestamp: Date.now()
        }, null, 2));

        intentManager.addMessage({
            role: 'user',
            content: lastMessage,
            timestamp: Date.now()
        });

        const coordinatorResponse = await anthropic.messages.create({
            model: 'claude-3-5-sonnet-20240620',
            max_tokens: 1000,
            messages: processedMessages,
            temperature: 0.7,
            tools: coordinatorTools
        });

        const toolCall = coordinatorResponse.content.find(c => c.type === 'tool_use');
        if (!toolCall) {
            intentManager.complete('error');
            return { content: "Could not determine appropriate action" };
        }

        // Log agent selection with full tool call data
        console.log('🤖 Agent Call:', JSON.stringify({
            type: 'agent_selection',
            agent: toolCall.name,
            input: toolCall.input,
            tool_use_id: toolCall.tool_use_id
        }, null, 2));

        const agentResult = await agents[toolCall.name](anthropic, {
            messages: processedMessages,
            agentInput: toolCall.input,
            tool_use_id: toolCall.tool_use_id
        });

        if (agentResult.message) {
            intentManager.addMessage(agentResult.message);
            // Log agent response with full message structure
            console.log('📤 Agent Response:', JSON.stringify({
                type: 'agent_response',
                message: agentResult.message,
                result: agentResult
            }, null, 2));
        }

        // Handle view configuration
        if (toolCall.name === 'viewAgent') {
            const result = {
                type: 'tool_result',
                content: agentResult.content,
                is_error: false,
                message: agentResult.message,
                viewConfiguration: agentResult.content ? JSON.parse(agentResult.content) : null
            };
            // Log view configuration
            console.log('🎨 View Update:', JSON.stringify(result, null, 2));
            return result;
        }

        // Reset conversation after successful execution
        if (!agentResult.is_error) {
            intentManager.reset();
            // Log conversation reset
            console.log('🔄 Conversation Reset:', JSON.stringify({
                type: 'reset',
                timestamp: Date.now(),
                final_messages: intentManager.getCurrentMessages()
            }, null, 2));
        }

        return agentResult;

    } catch (error) {
        console.error('❌ Error:', JSON.stringify({
            type: 'error',
            error: error.message,
            timestamp: Date.now()
        }, null, 2));
        intentManager.complete('error');
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
