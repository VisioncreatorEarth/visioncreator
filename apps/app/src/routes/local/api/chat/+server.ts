import { dev } from '$app/environment';
import { json } from '@sveltejs/kit';
import { Anthropic } from '@anthropic-ai/sdk';
import { env } from '$env/dynamic/private';
import { componentAgent } from '$lib/agents/componentAgent';
import { viewAgent } from '$lib/agents/viewAgent';

let anthropic: Anthropic | null = null;

if (dev && env.SECRET_ANTHROPIC_API_KEY) {
    anthropic = new Anthropic({
        apiKey: env.SECRET_ANTHROPIC_API_KEY
    });
}

const coordinatorTools = [
    {
        name: 'componentAgent',
        description: 'Use this agent for tasks related to changing, creating, or updating Svelte components.',
        input_schema: {
            type: 'object',
            properties: {
                task: { type: 'string', description: 'The task to be performed on the Svelte component' }
            },
            required: ['task']
        }
    },
    {
        name: 'viewAgent',
        description: 'Use this agent for tasks related to showing or creating views for any component.',
        input_schema: {
            type: 'object',
            properties: {
                task: { type: 'string', description: 'The view creation task to be performed' }
            },
            required: ['task']
        }
    }
];

export async function POST({ request }: { request: Request }) {
    if (!dev) {
        return json({ error: 'This endpoint is only available in development mode' }, { status: 403 });
    }

    if (!anthropic) {
        return json({ error: 'Anthropic client is not initialized' }, { status: 500 });
    }

    const { messages } = await request.json();

    console.log('Received new request with messages:', messages);

    try {
        const processedMessages = processMessages(messages);

        const anthropicRequest = {
            model: 'claude-3-5-sonnet-20240620',
            max_tokens: 4000,
            messages: processedMessages,
            temperature: 0.7,
            top_p: 1
        };

        console.log('Processed messages:', processedMessages);
        console.log('Calling masterCoordinator');

        const result = await masterCoordinator(anthropic, anthropicRequest);

        if (result.error) {
            console.error('Error from masterCoordinator:', result.error);
            return json({ error: result.error }, { status: 500 });
        }

        console.log('Successful response from masterCoordinator');
        return json(result);
    } catch (error: unknown) {
        console.error('Error in POST handler:', error);
        return json({ error: 'An error occurred while processing your request.' }, { status: 500 });
    }
}

async function masterCoordinator(anthropic: Anthropic, anthropicRequest: any) {
    const lastMessage = anthropicRequest.messages[anthropicRequest.messages.length - 1].content;
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

        if (coordinatorResponse.content && coordinatorResponse.content.length > 0) {
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

        if (!chosenAgent || !agentInput) {
            console.log('No agent chosen or no input provided, using default response');
            return {
                content: "I'm not sure how to handle that request. Can you please provide more details about what you want to do?"
            };
        }

        const agents = {
            componentAgent,
            viewAgent
        };

        if (chosenAgent in agents) {
            console.log(`Dispatching to ${chosenAgent}`);
            const agentResult = await agents[chosenAgent](anthropic, { messages: anthropicRequest.messages, agentInput, tool_use_id: toolUseId });

            if (chosenAgent === 'viewAgent') {
                return {
                    content: 'View configuration generated successfully.',
                    viewConfiguration: JSON.parse(agentResult.content)
                };
            }

            return agentResult;
        } else {
            console.log('Unknown agent chosen, using default response');
            return {
                content: "I'm sorry, but I don't know how to handle that request. Can you please try rephrasing it?"
            };
        }
    } catch (error) {
        console.error('Error in coordinator:', error);
        return {
            error: 'An error occurred while processing your request in the coordinator.'
        };
    }
}

function processMessages(messages: any[]) {
    const processedMessages = messages.map(message => ({
        role: message.role,
        content: message.content
    }));

    if (processedMessages[0]?.role !== 'user') {
        processedMessages.unshift({
            role: 'user',
            content: 'Hello, I need help with a Svelte component.'
        });
    }

    return processedMessages;
}
