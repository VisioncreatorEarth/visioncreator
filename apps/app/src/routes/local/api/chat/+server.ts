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
            const clarificationMessage = {
                role: 'hominio',
                content: "I currently have 2 skills: writing mails to the team and updating your name. Nothing else works for now. Please try again.",
                timestamp: Date.now()
            };
            console.log('🤔 Clarification needed:', JSON.stringify(clarificationMessage, null, 2));
            intentManager.addMessage(clarificationMessage);

            return {
                type: 'clarification_needed',
                content: clarificationMessage.content,
                needsClarification: true,
                context: intentManager.getCurrentMessages()
            };
        }

        // Log agent delegation
        const agentMessage = {
            role: toolCall.name,
            content: `I'll handle this request. Processing...`,
            timestamp: Date.now()
        };
        console.log(`🔧 ${toolCall.name}:`, JSON.stringify(agentMessage, null, 2));
        intentManager.addMessage(agentMessage);

        // Pass full context to agents
        const agentResult = await agents[toolCall.name](anthropic, {
            messages: intentManager.getCurrentMessages(), // Pass full intent history
            agentInput: {
                ...toolCall.input,
                originalRequest: lastMessage, // Pass original request explicitly
                context: intentManager.getCurrentMessages() // Pass full context
            },
            tool_use_id: toolCall.tool_use_id
        });

        // Add completion message with context
        const completionMessage = {
            role: 'hominio',
            content: `Task completed based on your request: "${lastMessage}". Let me know if you need anything else.`,
            timestamp: Date.now(),
            context: intentManager.getCurrentMessages()
        };
        console.log('🤖 Hominio:', JSON.stringify(completionMessage, null, 2));
        intentManager.addMessage(completionMessage);

        // Return result with full context
        if (agentResult.message?.toolResult?.type === 'action') {
            return {
                type: 'action',
                content: agentResult.message.toolResult.data,
                message: completionMessage,
                context: intentManager.getCurrentMessages()
            };
        }

        return {
            ...agentResult,
            context: intentManager.getCurrentMessages()
        };

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
