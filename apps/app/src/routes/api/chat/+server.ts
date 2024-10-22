import { json } from '@sveltejs/kit';
import { Anthropic } from '@anthropic-ai/sdk';
import { env } from '$env/dynamic/private';
import { componentAgent } from '$lib/agents/componentAgent';

const anthropic = new Anthropic({
	apiKey: env.SECRET_ANTHROPIC_API_KEY
});

export async function POST({ request }: { request: Request }) {
	const { messages } = await request.json();

	try {
		const processedMessages = processMessages(messages);

		const anthropicRequest = {
			model: 'claude-3-5-sonnet-20240620',
			max_tokens: 4000,
			messages: processedMessages,
			temperature: 0.7,
			top_p: 1
		};

		const result = await componentAgent(anthropic, anthropicRequest);

		if (result.error) {
			return json({ error: result.error }, { status: 500 });
		}

		return json({ content: result.content });
	} catch (error: unknown) {
		console.error('Error in POST handler:', error);
		return json({ error: 'An error occurred while processing your request.' }, { status: 500 });
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
