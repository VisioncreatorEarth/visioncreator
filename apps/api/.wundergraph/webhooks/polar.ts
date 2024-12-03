import { createWebhook } from "../generated/wundergraph.webhooks";

export default createWebhook({
    handler: async (event, context) => {
        try {
            console.log('Received Polar webhook:', {
                headers: event.headers,
                body: event.body
            });

            // Store webhook using internal operation
            const result = await context.operations.mutate({
                operationName: "storePolarWebhook",
                input: {
                    event: event.body.type,
                    payload: event.body
                }
            });

            if (!result.data?.success) {
                throw new Error(result.data?.error || 'Failed to store webhook');
            }

            return {
                statusCode: 200,
                body: {
                    received: true
                }
            };
        } catch (error) {
            console.error('Error processing webhook:', error);
            return {
                statusCode: 500,
                body: {
                    error: 'Internal server error'
                }
            };
        }
    }
});