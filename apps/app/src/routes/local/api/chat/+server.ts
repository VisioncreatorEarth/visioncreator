import { dev } from '$app/environment';
import { json } from '@sveltejs/kit';
import { Anthropic } from '@anthropic-ai/sdk';
import { env } from '$env/dynamic/private';
import { componentAgent } from '$lib/agents/componentAgent';
import { viewAgent } from '$lib/agents/viewAgent';
import { actionAgent } from '$lib/agents/actionAgent';

let anthropic: Anthropic | null = null;

if (dev && env.SECRET_ANTHROPIC_API_KEY) {
    anthropic = new Anthropic({
        apiKey: env.SECRET_ANTHROPIC_API_KEY
    });
}

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
        const { messages } = await request.json();
        const processedMessages = processMessages(messages);
        const result = await masterCoordinator(anthropic, processedMessages);

        return json(result);
    } catch (error) {
        console.error('Error in POST handler:', error);
        return json({ error: 'Request processing failed' }, { status: 500 });
    }
}

async function masterCoordinator(anthropic: Anthropic, messages: any[]) {
    const lastMessage = messages[messages.length - 1].content;
    console.log('User\'s last message:', lastMessage);

    try {
        const coordinatorResponse = await anthropic.messages.create({
            model: 'claude-3-5-sonnet-20240620',
            max_tokens: 1000,
            messages: [{ role: 'user', content: lastMessage }],
            temperature: 0.7,
            top_p: 1,
            tools: coordinatorTools
        });

        console.log('Received coordinator response from Anthropic:', JSON.stringify(coordinatorResponse, null, 2));

        let chosenAgent = null;
        let agentInput = null;
        let toolUseId = null;

        if (coordinatorResponse.content) {
            for (const content of coordinatorResponse.content) {
                if (content.type === 'tool_use') {
                    chosenAgent = content.name;
                    agentInput = content.input;
                    toolUseId = content.tool_use_id;
                    break;
                }
            }
        }

        console.log('Chosen agent:', chosenAgent);
        console.log('Agent input:', agentInput);

        const agents = {
            componentAgent,
            viewAgent,
            actionAgent
        };

        if (chosenAgent && agentInput && chosenAgent in agents) {
            const agentResult = await agents[chosenAgent](anthropic, {
                messages,
                agentInput,
                tool_use_id: toolUseId
            });

            console.log(`${chosenAgent} result:`, JSON.stringify(agentResult, null, 2));

            if (chosenAgent === 'viewAgent' && agentResult.content) {
                return {
                    content: 'View configuration generated successfully.',
                    viewConfiguration: JSON.parse(agentResult.content)
                };
            }

            if (chosenAgent === 'actionAgent' && agentResult.content) {
                console.log('Processing action agent result:', agentResult);
                return {
                    content: 'Please fill out the form to update your information.',
                    actionConfig: agentResult.content,
                    isAction: true
                };
            }

            return agentResult;
        }

        console.log('No agent chosen or invalid agent');
        return {
            content: "I need more information to help you. Could you please be more specific?"
        };
    } catch (error) {
        console.error('Error in coordinator:', error);
        return { error: 'Coordination failed' };
    }
}

function processMessages(messages: any[]) {
    if (!messages.length || messages[0]?.role !== 'user') {
        messages.unshift({
            role: 'user',
            content: 'Hello, I need assistance.'
        });
    }
    return messages.map(msg => ({
        role: msg.role,
        content: msg.content
    }));
}
