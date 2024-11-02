// import { promises as fs } from 'fs';
// import path from 'path';
// import { conversationManager } from '$lib/stores/intentStore';

// const CLAUDE_FILE_PATH = path.resolve('src/lib/components/Claude.svelte');
// const COMPONENT_AGENT_FILE_PATH = path.resolve('src/lib/prompts/component-agent.txt');

// export async function componentAgent(request: any) {
//     try {
//         const userMessage = request.task;

//         conversationManager.addMessage(
//             'Reading component files...',
//             'agent',
//             'pending',
//             'componentAgent'
//         );

//         // Read existing files
//         const existingComponent = await readFileContent(CLAUDE_FILE_PATH);
//         const componentAgentPrompt = await readFileContent(COMPONENT_AGENT_FILE_PATH);

//         const fullSystemPrompt = `${componentAgentPrompt}\n\nHere is our existing component:\n\n\`\`\`svelte\n${existingComponent}\n\`\`\`\n\nTask: ${userMessage}`;

//         conversationManager.addMessage(
//             'Generating component updates...',
//             'agent',
//             'pending',
//             'componentAgent'
//         );

//         // Call Claude through server endpoint
//         const response = await fetch('/local/api/chat', {
//             method: 'POST',
//             headers: { 'Content-Type': 'application/json' },
//             body: JSON.stringify({
//                 messages: [{ role: 'user', content: fullSystemPrompt }],
//                 system: 'Generate or modify Svelte component based on user request.'
//             })
//         });

//         const data = await response.json();
//         let assistantMessage = '';

//         if (data.content?.[0]?.text) {
//             assistantMessage = data.content[0].text;
//         }

//         const componentMatch = assistantMessage.match(/<svelte-component[^>]*>([\s\S]*?)<\/svelte-component>/);

//         if (componentMatch) {
//             const componentContent = componentMatch[1].trim();
//             await writeFileContent(CLAUDE_FILE_PATH, componentContent);

//             conversationManager.addMessage(
//                 'Component updated successfully',
//                 'agent',
//                 'complete',
//                 'componentAgent',
//                 [{
//                     type: 'component',
//                     content: {
//                         data: componentContent,
//                         tool_use_id: request.tool_use_id
//                     }
//                 }]
//             );

//             return {
//                 type: 'tool_result',
//                 tool_use_id: request.tool_use_id,
//                 content: `Component updated successfully`,
//                 is_error: false,
//                 message: {
//                     role: 'componentAgent',
//                     content: 'Component updated successfully',
//                     timestamp: Date.now(),
//                     toolResult: {
//                         type: 'component',
//                         data: componentContent,
//                         tool_use_id: request.tool_use_id
//                     }
//                 }
//             };
//         } else {
//             conversationManager.addMessage(
//                 'Could not generate valid component code',
//                 'agent',
//                 'error',
//                 'componentAgent'
//             );
//             return {
//                 content: "I couldn't find a valid Svelte component in the response.",
//                 is_error: true
//             };
//         }
//     } catch (error) {
//         console.error('Error in componentAgent:', error);
//         conversationManager.addMessage(
//             'An error occurred while processing the component',
//             'agent',
//             'error',
//             'componentAgent'
//         );
//         return {
//             error: 'An error occurred while processing your request in the componentAgent.',
//             is_error: true
//         };
//     }
// }

// // Keep existing file handling functions
// async function readFileContent(filePath: string): Promise<string> {
//     return await fs.readFile(filePath, 'utf-8');
// }

// async function writeFileContent(filePath: string, content: string): Promise<void> {
//     await fs.writeFile(filePath, content, 'utf-8');
// }
