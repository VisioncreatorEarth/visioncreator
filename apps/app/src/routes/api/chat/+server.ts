import { env } from '$env/dynamic/private';
import { promises as fs } from 'fs';
import path from 'path';
import { Anthropic } from '@anthropic-ai/sdk';
import { json } from '@sveltejs/kit';

const anthropic = new Anthropic({
	apiKey: env.SECRET_ANTHROPIC_API_KEY
});

const CLAUDE_FILE_PATH = path.resolve('src/lib/components/Claude.svelte');
const ARTIFACTS_FILE_PATH = path.resolve('src/lib/prompts/artifacts.txt');
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

async function readFileContent(filePath: string): Promise<string> {
	try {
		return await fs.readFile(filePath, 'utf-8');
	} catch (error) {
		console.error('Error reading file:', error);
		throw new Error('Error reading file');
	}
}

async function writeFileContent(filePath: string, content: string): Promise<void> {
	try {
		await fs.writeFile(filePath, content, 'utf-8');
	} catch (error) {
		console.error('Error writing file:', error);
		throw new Error('Error writing file');
	}
}

async function saveFile(filename: string, content: string): Promise<void> {
	const newFilePath = path.resolve(`src/lib/components/o-${filename}.svelte`);
	console.log(`Attempting to save file: ${newFilePath}`);
	await writeFileContent(newFilePath, content);
	console.log(`File saved successfully: ${newFilePath}`);
}

const tools = [
	{
		name: 'save_file',
		description: 'Save the current component to a file with a given name',
		input_schema: {
			type: 'object',
			properties: {
				filename: {
					type: 'string',
					description: 'The name of the file to save (without extension)'
				}
			},
			required: ['filename']
		}
	}
];

export async function POST({ request }: { request: Request }) {
	const { messages, hardcodedContent } = await request.json();

	if (hardcodedContent) {
		try {
			await writeFileContent(CLAUDE_FILE_PATH, hardcodedContent);
			return json({ content: 'File written successfully' });
		} catch (error) {
			console.error('Error writing hardcoded content:', error);
			return json({ error: 'Error writing hardcoded content' }, { status: 500 });
		}
	}

	try {
		const existingComponent = await readFileContent(CLAUDE_FILE_PATH);
		const artifactsContent = await readFileContent(ARTIFACTS_FILE_PATH);

		const systemMessage = `${artifactsContent}\n\nHere is our existing component:\n\n\`\`\`svelte\n${existingComponent}\n\`\`\``;
		const processedMessages = [];
		let lastRole = 'assistant';

		for (const message of messages) {
			if (message.image && message.image.length > MAX_IMAGE_SIZE) {
				console.error('Image file too large:', message.image.length);
				return json({ error: 'Image file too large. Maximum size is 5MB.' }, { status: 400 });
			}

			if (message.role !== lastRole) {
				if (message.image) {
					console.log('Processing image message');
					const [header, base64Data] = message.image.split(',');
					const mediaType = header.split(';')[0].split(':')[1];
					processedMessages.push({
						role: message.role,
						content: [
							{
								type: 'image',
								source: { type: 'base64', media_type: mediaType, data: base64Data }
							},
							{ type: 'text', text: message.content }
						]
					});
				} else {
					processedMessages.push({ role: message.role, content: message.content });
				}
				lastRole = message.role;
			} else if (message.role === 'user') {
				processedMessages.push({ role: 'assistant', content: 'Understood. Please continue.' });
				if (message.image) {
					console.log('Processing image message');
					const [header, base64Data] = message.image.split(',');
					const mediaType = header.split(';')[0].split(':')[1];
					processedMessages.push({
						role: message.role,
						content: [
							{
								type: 'image',
								source: { type: 'base64', media_type: mediaType, data: base64Data }
							},
							{ type: 'text', text: message.content }
						]
					});
				} else {
					processedMessages.push({ role: message.role, content: message.content });
				}
				lastRole = 'user';
			}
		}

		if (processedMessages[0]?.role !== 'user') {
			processedMessages.unshift({
				role: 'user',
				content: 'Hello, I need help with a Svelte component.'
			});
		}

		console.log('Sending messages to AI API:', JSON.stringify(processedMessages, null, 2));

		const response = await anthropic.messages.create({
			model: 'claude-3-5-sonnet-20240620',
			max_tokens: 4000,
			messages: processedMessages,
			system: systemMessage,
			temperature: 0.7,
			top_p: 1,
			tools: tools
		});

		console.log('Received response from AI API:', JSON.stringify(response, null, 2));

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

			// Extract content inside <antartifact> tags
			const artifactMatch = assistantMessage.match(/<antartifact[^>]*>([\s\S]*?)<\/antartifact>/);

			if (artifactMatch) {
				const artifactContent = artifactMatch[1].trim();
				await writeFileContent(CLAUDE_FILE_PATH, artifactContent);
			}

			// Remove <antartifact> tags from the assistant message
			let cleanedMessage = assistantMessage.replace(
				/<antartifact[^>]*>[\s\S]*?<\/antartifact>/g,
				''
			);

			// Handle tool uses
			for (const toolUse of toolUses) {
				if (toolUse.name === 'save_file') {
					const { filename } = toolUse.input;
					const content = artifactMatch ? artifactMatch[1].trim() : existingComponent;
					await saveFile(filename, content);
					cleanedMessage += `\n\nI've saved the component to o-${filename}.svelte.`;
				}
			}

			return json({ content: cleanedMessage });
		} else {
			console.error('Unexpected response format:', response);
			return json({ error: 'Unexpected response format from AI API.' }, { status: 500 });
		}
	} catch (error: unknown) {
		console.error('Error calling Claude API:', error);
		if (error instanceof Error) {
			if ('response' in error) {
				const responseError = error as { response: { status: number; data: any } };
				console.error('Response status:', responseError.response.status);
				console.error('Response data:', responseError.response.data);
			}
			if ('request' in error) {
				const requestError = error as { request: any };
				console.error('Request data:', requestError.request);
			}
			console.error('Error message:', error.message);
			console.error('Error stack:', error.stack);
		}
		return json({ error: 'An error occurred while processing your request.' }, { status: 500 });
	}
}
