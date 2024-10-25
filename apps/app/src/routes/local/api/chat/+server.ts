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

        // Log user message
        console.log('👤 User:', JSON.stringify({
            content: lastMessage,
            timestamp: Date.now()
        }, null, 2));

        intentManager.addMessage({
            role: 'user',
            content: lastMessage,
            timestamp: Date.now()
        });

        // Add and log hominio controller message
        const hominioMessage = {
            role: 'hominio',
            content: `Processing your request: "${lastMessage}". Let me delegate to the appropriate agent.`,
            timestamp: Date.now()
        };
        console.log('🤖 Hominio:', JSON.stringify(hominioMessage, null, 2));
        intentManager.addMessage(hominioMessage);

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

        // Add and log agent delegation message
        const agentMessage = {
            role: toolCall.name,
            content: `I'll handle this request. Processing...`,
            timestamp: Date.now()
        };
        console.log(`🔧 ${toolCall.name}:`, JSON.stringify(agentMessage, null, 2));
        intentManager.addMessage(agentMessage);

        const agentResult = await agents[toolCall.name](anthropic, {
            messages: processedMessages,
            agentInput: toolCall.input,
            tool_use_id: toolCall.tool_use_id
        });

        if (agentResult.message) {
            console.log(`✨ ${toolCall.name} Result:`, JSON.stringify(agentResult.message, null, 2));
            intentManager.addMessage(agentResult.message);

            // Extract and return viewConfiguration if present in toolResult
            if (agentResult.message.toolResult?.type === 'view' && agentResult.message.toolResult.data) {
                return {
                    ...agentResult,
                    viewConfiguration: agentResult.message.toolResult.data
                };
            }
        }

        // Add and log hominio completion message
        const completionMessage = {
            role: 'hominio',
            content: `Task completed. Let me know if you need anything else.`,
            timestamp: Date.now()
        };
        console.log('🤖 Hominio:', JSON.stringify(completionMessage, null, 2));
        intentManager.addMessage(completionMessage);

        if (!agentResult.is_error) {
            intentManager.reset();
        }

        return agentResult;

    } catch (error) {
        console.error('❌ Error:', error);
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
