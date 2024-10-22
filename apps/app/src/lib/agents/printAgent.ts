import type { Anthropic } from '@anthropic-ai/sdk';

export async function printAgent(anthropic: Anthropic, request: any) {
    const message = request.agentInput?.message || request.messages[request.messages.length - 1].content;
    console.log('Print Agent received message:', message);
    return {
        content: `I've printed your message: "${message}"`
    };
}