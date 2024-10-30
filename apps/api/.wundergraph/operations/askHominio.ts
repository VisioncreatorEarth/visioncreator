import { createOperation, z } from "../generated/wundergraph.factory";

// Define types for better type safety
const MessageSchema = z.object({
    role: z.string(),
    content: z.string()
});

const ToolSchema = z.object({
    type: z.string(),
    function: z.object({
        name: z.string(),
        description: z.string(),
        parameters: z.object({
            type: z.string(),
            properties: z.record(z.any()),
            required: z.array(z.string())
        })
    })
}).array().optional();

export default createOperation.mutation({
    input: z.object({
        messages: z.array(MessageSchema),
        tools: ToolSchema,
        system: z.string(),
        temperature: z.number().optional().default(0.7)
    }),
    requireAuthentication: true,
    rbac: {
        requireMatchAll: ["authenticated"],
    },
    handler: async ({ input, context }) => {
        if (!context.anthropic) {
            throw new Error('Anthropic client not configured');
        }

        try {
            const response = await context.anthropic.messages.create({
                model: "claude-3-5-sonnet-20241022",
                max_tokens: 1024,
                temperature: input.temperature,
                system: input.system,
                messages: input.messages,
                tools: input.tools
            });

            return {
                content: response.content,
                model: response.model,
                role: response.role,
                id: response.id,
                type: response.type,
                usage: response.usage
            };

        } catch (error) {
            console.error('Anthropic API Error:', error);
            throw new Error(error instanceof Error ? error.message : 'Unknown error occurred');
        }
    }
});