import { promises as fs } from 'fs';
import path from 'path';
import type { Anthropic } from '@anthropic-ai/sdk';

const CLAUDE_FILE_PATH = path.resolve('src/lib/components/Claude.svelte');
const COMPONENT_AGENT_FILE_PATH = path.resolve('src/lib/prompts/component-agent.txt');

export async function componentAgent(anthropic: Anthropic, request: any) {
    try {
        const existingComponent = await readFileContent(CLAUDE_FILE_PATH);
        const componentAgentPrompt = await readFileContent(COMPONENT_AGENT_FILE_PATH);

        const task = request.agentInput?.task || request.messages[request.messages.length - 1].content;

        const fullSystemPrompt = `${componentAgentPrompt}\n\nHere is our existing component:\n\n\`\`\`svelte\n${existingComponent}\n\`\`\`\n\nTask: ${task}`;

        const response = await anthropic.messages.create({
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: 4000,
            messages: [{ role: 'user', content: fullSystemPrompt }],
            temperature: 0.7,
            top_p: 1
        });

        let assistantMessage = '';
        if (response.content && response.content.length > 0) {
            for (const content of response.content) {
                if (content.type === 'text') {
                    assistantMessage += content.text;
                }
            }
        }

        const componentMatch = assistantMessage.match(/<svelte-component[^>]*>([\s\S]*?)<\/svelte-component>/);

        if (componentMatch) {
            const componentContent = componentMatch[1].trim();
            await writeFileContent(CLAUDE_FILE_PATH, componentContent);
            return { content: `I've updated the component with the new tasks. Here's a summary of the changes:\n\n${assistantMessage}` };
        } else {
            return { content: "I couldn't find a valid Svelte component in the response. Here's what I got:\n\n" + assistantMessage };
        }
    } catch (error) {
        console.error('Error in componentAgent:', error);
        return { error: 'An error occurred while processing your request in the componentAgent.' };
    }
}

async function readFileContent(filePath: string): Promise<string> {
    return await fs.readFile(filePath, 'utf-8');
}

async function writeFileContent(filePath: string, content: string): Promise<void> {
    await fs.writeFile(filePath, content, 'utf-8');
}
