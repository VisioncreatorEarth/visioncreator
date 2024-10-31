import { createOperation, z } from "../generated/wundergraph.factory";

// Define tool schema
const ToolSchema = z.object({
    name: z.string(),
    description: z.string(),
    input_schema: z.object({
        type: z.literal('object'),
        properties: z.record(z.any()),
        required: z.array(z.string())
    })
});

// Define message schema
const MessageSchema = z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string()
});

// Define expected Claude response structure
interface ClaudeResponse {
    id: string;
    model: string;
    type: string;
    role: string;
    content: Array<{
        type: string;
        text?: string;
        tool_use?: {
            id: string;
            name: string;
            input: Record<string, any>;
        };
    }>;
    stop_reason: string | null;
    usage: {
        input_tokens: number;
        output_tokens: number;
    };
}

export default createOperation.mutation({
    input: z.object({
        messages: z.array(MessageSchema),
        system: z.string(),
        tools: z.array(ToolSchema).optional(),
        temperature: z.number().optional().default(0.7)
    }),
    requireAuthentication: true,
    handler: async ({ input, context }) => {
        console.log('askClaude - Starting operation with input:', {
            messages: input.messages,
            systemPromptLength: input.system.length,
            toolsCount: input.tools?.length,
            temperature: input.temperature
        });

        if (!context.anthropic) {
            console.error('askClaude - Anthropic client missing in context');
            throw new Error('Anthropic client not configured');
        }

        try {
            console.log('askClaude - Calling Anthropic API');
            const response = await context.anthropic.messages.create({
                model: "claude-3-5-sonnet-20240620",
                max_tokens: 1024,
                temperature: input.temperature,
                system: input.system,
                messages: input.messages,
                tools: input.tools
            });

            console.log('askClaude - Raw API response:', {
                id: response.id,
                model: response.model,
                type: response.type,
                contentTypes: response.content.map(c => c.type),
                stopReason: response.stop_reason,
                usage: response.usage
            });

            // Validate response structure
            if (!response.content || !Array.isArray(response.content)) {
                console.error('askClaude - Invalid response structure:', response);
                throw new Error('Invalid response structure from Claude API');
            }

            // Check for text content
            const textContent = response.content.find(c => c.type === 'text');
            if (!textContent?.text) {
                console.warn('askClaude - No text content in response');
            }

            // Check for tool use
            const toolUse = response.content.find(c => c.type === 'tool_use');
            if (toolUse) {
                console.log('askClaude - Tool use detected:', {
                    tool: toolUse.tool_use?.name,
                    input: toolUse.tool_use?.input
                });
            }

            // Return structured response
            const structuredResponse: ClaudeResponse = {
                id: response.id,
                model: response.model,
                type: response.type,
                role: response.role,
                content: response.content,
                stop_reason: response.stop_reason,
                usage: response.usage
            };

            console.log('askClaude - Operation completed successfully');
            return structuredResponse;

        } catch (error) {
            console.error('askClaude - Operation failed:', {
                error: error instanceof Error ? {
                    name: error.name,
                    message: error.message,
                    stack: error.stack
                } : error,
                input: {
                    messageCount: input.messages.length,
                    systemPromptLength: input.system.length,
                    toolsCount: input.tools?.length
                }
            });

            // Rethrow with more context
            if (error instanceof Error) {
                throw new Error(`Claude API error: ${error.message}`);
            }
            throw new Error('Unknown error occurred while calling Claude API');
        }
    }
});