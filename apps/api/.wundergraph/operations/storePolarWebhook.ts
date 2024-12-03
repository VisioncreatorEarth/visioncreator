import { createOperation, z } from "../generated/wundergraph.factory";
import { validateEvent, WebhookVerificationError } from "@polar-sh/sdk/webhooks";

export default createOperation.mutation({
    input: z.object({
        headers: z.record(z.string()),
        body: z.any()
    }),
    handler: async ({ input, context }) => {
        try {
            const webhookSecret = process.env.POLAR_WEBHOOK_SECRET;
            if (!webhookSecret) {
                throw new Error('POLAR_WEBHOOK_SECRET is not configured');
            }

            // Convert headers to lowercase
            const headers = Object.entries(input.headers).reduce((acc, [key, value]) => {
                acc[key.toLowerCase()] = value;
                return acc;
            }, {});

            // Convert body to string if needed
            const payload = typeof input.body === 'string'
                ? input.body
                : JSON.stringify(input.body);


            try {
                validateEvent(
                    payload,
                    headers,
                    webhookSecret
                );
            } catch (error) {
                console.error('Webhook validation failed:', error);
                if (error instanceof WebhookVerificationError) {
                    throw new Error('Invalid webhook signature');
                }
                throw error;
            }

            // Parse body if it's a string
            const body = typeof input.body === 'string' ? JSON.parse(input.body) : input.body;

            const { error } = await context.supabase
                .from('polar_webhooks')
                .insert({
                    event: body.type,
                    payload: body
                });

            if (error) {
                throw error;
            }

            return {
                success: true
            };
        } catch (error) {
            console.error('Error storing Polar webhook:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : String(error)
            };
        }
    },
});
