import { createWebhook } from "../generated/wundergraph.webhooks";

export default createWebhook({
    handler: async (event, context) => {
        try {
            console.log('Received Polar webhook:', {
                headers: event.headers,
                body: event.body
            });

            const result = await context.operations.mutate({
                operationName: "polarStoreWebhook",
                input: {
                    headers: event.headers,
                    body: event.body
                }
            });

            if (!result.data?.success) {
                throw new Error(result.data?.error || 'Failed to store webhook');
            }

            console.log('Successfully processed webhook');

            return {
                statusCode: 200,
                body: {
                    received: true
                }
            };
        } catch (error) {
            console.error('Error processing webhook:', error);
            return {
                statusCode: error.message?.includes('Invalid webhook') ? 403 : 500,
                body: {
                    error: error.message || 'Internal server error'
                }
            };
        }
    }
});