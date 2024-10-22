import { promises as fs } from 'fs';
import path from 'path';
import type { Anthropic } from '@anthropic-ai/sdk';

const CLAUDE_FILE_PATH = path.resolve('src/lib/components/Claude.svelte');
const COMPONENT_AGENT_FILE_PATH = path.resolve('src/lib/prompts/component-agent.txt');

const tools = [
    {
        name: 'read_file',
        description: 'Read the content of a file',
        input_schema: {
            type: 'object',
            properties: {
                filePath: {
                    type: 'string',
                    description: 'The path of the file to read'
                }
            },
            required: ['filePath']
        }
    },
    {
        name: 'write_file',
        description: 'Write content to a file',
        input_schema: {
            type: 'object',
            properties: {
                filePath: {
                    type: 'string',
                    description: 'The path of the file to write'
                },
                content: {
                    type: 'string',
                    description: 'The content to write to the file'
                }
            },
            required: ['filePath', 'content']
        }
    },
    {
        name: 'save_file',
        description: 'Save the current component to a file with a given name',
        input_schema: {
            type: 'object',
            properties: {
                filename: {
                    type: 'string',
                    description: 'The name of the file to save (without extension)'
                },
                content: {
                    type: 'string',
                    description: 'The content of the component to save'
                }
            },
            required: ['filename', 'content']
        }
    }
];

async function readFileContent(filePath: string): Promise<string> {
    return await fs.readFile(filePath, 'utf-8');
}

async function writeFileContent(filePath: string, content: string): Promise<void> {
    await fs.writeFile(filePath, content, 'utf-8');
}

async function saveFile(filename: string, content: string): Promise<void> {
    const newFilePath = path.resolve(`src/lib/components/o-${filename}.svelte`);
    await writeFileContent(newFilePath, content);
}

export async function componentAgent(anthropic: Anthropic, anthropicRequest: any) {
    try {
        const existingComponent = await readFileContent(CLAUDE_FILE_PATH);
        const componentAgentPrompt = await readFileContent(COMPONENT_AGENT_FILE_PATH);

        const fullSystemPrompt = `${componentAgentPrompt}\n\nHere is our existing component:\n\n\`\`\`svelte\n${existingComponent}\n\`\`\``;

        const response = await anthropic.messages.create({
            ...anthropicRequest,
            system: fullSystemPrompt,
            tools: tools
        });

        if (response.content && response.content.length > 0) {
            let assistantMessage = '';
            const toolUses: any[] = [];

            for (const content of response.content) {
                if (content.type === 'text') {
                    assistantMessage += content.text;
                } else if (content.type === 'tool_use') {
                    toolUses.push(content);
                } else if (content.type === 'tool_calls') {
                    toolUses.push(...content.tool_calls);
                }
            }

            const componentMatch = assistantMessage.match(/<svelte-component[^>]*>([\s\S]*?)<\/svelte-component>/);

            if (componentMatch) {
                const componentContent = componentMatch[1].trim();
                await writeFileContent(CLAUDE_FILE_PATH, componentContent);
            }

            let cleanedMessage = assistantMessage.replace(
                /<svelte-component[^>]*>[\s\S]*?<\/svelte-component>/g,
                ''
            );

            for (const toolUse of toolUses) {
                if (toolUse.name === 'save_file') {
                    const { filename, content } = toolUse.input;
                    await saveFile(filename, content);
                    cleanedMessage += `\n\nI've saved the component to o-${filename}.svelte.`;
                } else if (toolUse.name === 'read_file') {
                    const { filePath } = toolUse.input;
                    const content = await readFileContent(filePath);
                    cleanedMessage += `\n\nContent of ${filePath}:\n\n${content}`;
                } else if (toolUse.name === 'write_file') {
                    const { filePath, content } = toolUse.input;
                    await writeFileContent(filePath, content);
                    cleanedMessage += `\n\nI've written the content to ${filePath}.`;
                }
            }

            return { content: cleanedMessage };
        } else {
            return { error: 'Unexpected response format from AI API.' };
        }
    } catch (error: unknown) {
        if (error instanceof Error) {
            return { error: error.message };
        }
        return { error: 'An unknown error occurred in componentAgent.' };
    }
}
