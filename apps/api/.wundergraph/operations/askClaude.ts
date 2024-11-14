import { createOperation, z, AuthorizationError } from "../generated/wundergraph.factory";

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
    rbac: {
        requireMatchAll: ["authenticated"],
    },
    handler: async ({ input, context, user }) => {

        // Check if user is authenticated
        if (!user?.customClaims?.id) {
            throw new AuthorizationError({
                message: 'You must be logged in to use this feature'
            });
        }

        console.log('askClaude - Starting operation with input:', {
            messages: input.messages,
            systemPromptLength: input.system.length,
            toolsCount: input.tools?.length,
            temperature: input.temperature,
            userId: user.customClaims.id
        });

        if (!context.anthropic) {
            throw new Error('Anthropic client not configured');
        }

        // Check and increment AI request count
        const { data: incrementResult, error: incrementError } = await context.supabase
            .rpc('check_and_increment_ai_requests', {
                p_user_id: user.customClaims.id
            })
            .single();

        if (incrementError) {
            console.error('Error checking AI request limit:', incrementError);
            throw new Error('Failed to check AI request limit.');
        }

        if (!incrementResult) {
            throw new Error('PAYWALL: You have reached your AI request limit for this period.');
        }

        try {
            console.log('askClaude - Calling Anthropic API');
            const startTime = Date.now();
            const response = await context.anthropic.messages.create({
                model: "claude-3-5-haiku-20241022",
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

            // Track successful request
            try {
                const { error } = await context.supabase.from('hominio_requests').insert({
                    user_id: user.customClaims.id,
                    input: {
                        messages: input.messages,
                        system: input.system,
                        tools: input.tools,
                        temperature: input.temperature
                    },
                    response: {
                        id: response.id,
                        model: response.model,
                        content: response.content,
                        stop_reason: response.stop_reason,
                        usage: response.usage
                    },
                    input_tokens: response.usage.input_tokens,
                    output_tokens: response.usage.output_tokens,
                    processing_time: (Date.now() - startTime) / 1000, // Convert ms to seconds
                    model: response.model,
                    success: true,
                    metadata: {
                        stop_reason: response.stop_reason,
                        content_types: response.content.map(c => c.type),
                        cost: {
                            input: (response.usage.input_tokens / 1000000) * 1, // $1 per MTok
                            output: (response.usage.output_tokens / 1000000) * 5 // $5 per MTok
                        }
                    }
                });

                if (error) {
                    console.error('Failed to track request:', error);
                }
            } catch (trackingError) {
                console.error('Error tracking request:', trackingError);
            }

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
            // Enhanced error handling
            if (error instanceof AuthorizationError) {
                return {
                    success: false,
                    message: error.message,
                    code: error.code
                };
            }

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
                },
                userId: user.customClaims.id
            });

            return {
                success: false,
                message: error instanceof Error ? error.message : 'Unknown error occurred while calling Claude API',
                code: 'INTERNAL_ERROR'
            };
        }
    }
});