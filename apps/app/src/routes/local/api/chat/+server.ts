import { json } from '@sveltejs/kit';
import { Anthropic } from '@anthropic-ai/sdk';
import { env } from '$env/dynamic/private';
import { coordinatorTools } from '$lib/agents/hominioAgent';
import { dev } from '$app/environment';

const anthropic = dev && env.SECRET_ANTHROPIC_API_KEY ?
    new Anthropic({ apiKey: env.SECRET_ANTHROPIC_API_KEY }) :
    null;

export async function POST({ request }) {
    if (!dev || !anthropic) {
        return json({ error: 'Service not available' }, { status: 403 });
    }

    try {
        const body = await request.json();
        const { messages, tools, system } = body;

        const processedMessages = messages.map(msg => ({
            role: msg.role === 'user' ? 'user' : 'assistant',
            content: msg.content || ''
        }));

        const response = await anthropic.messages.create({
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: 1000,
            messages: processedMessages,
            temperature: 0.7,
            system: system || 'You are a helpful AI assistant that coordinates between different specialized agents. For form actions like updating names or sending emails, always use the actionAgent.',
            tools: tools || coordinatorTools
        });

        return json(response);
    } catch (error) {
        console.error('Error:', error);
        return json({ error: 'Request processing failed' }, { status: 500 });
    }
}
