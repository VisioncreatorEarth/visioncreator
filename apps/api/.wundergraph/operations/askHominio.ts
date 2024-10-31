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

export default createOperation.mutation({
    input: z.object({
        messages: z.array(MessageSchema),
        system: z.string(),
        tools: z.array(ToolSchema).optional(),
        temperature: z.number().optional().default(0.7)
    }),
    requireAuthentication: true,
    handler: async ({ input, context }) => {
        console.log('askHominio - Processing request:', input);

        if (!context.anthropic) {
            throw new Error('Anthropic client not configured');
        }

        try {
            // Call Claude API with tools
            const response = await context.anthropic.messages.create({
                model: "claude-3-5-sonnet-20240620",
                max_tokens: 1024,
                temperature: input.temperature,
                system: input.system,
                messages: input.messages,
                tools: input.tools
            });

            console.log('askHominio - Claude response:', response);

            return {
                data: {
                    content: response.content[0].text,
                    status: 'success',
                    model: response.model,
                    type: 'message',
                    stop_reason: response.stop_reason,
                    usage: response.usage
                }
            };

        } catch (error) {
            console.error('askHominio - Error:', error);
            throw error;
        }
    }
});