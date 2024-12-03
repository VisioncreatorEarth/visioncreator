import { createOperation, z } from "../generated/wundergraph.factory";

interface Price {
    id: string;
    amount: number;
    currency: string;
    interval: string;
}

interface Product {
    id: string;
    name: string;
    description: string;
    isRecurring: boolean;
    prices: Price[];
}

export default createOperation.query({
    requireAuthentication: true,
    rbac: {
        requireMatchAll: ["authenticated"],
    },
    handler: async ({ input, context }) => {
        try {
            // Define our products
            const hominio: Product = {
                id: "ef8f64f5-e644-4066-b339-a45e63a64f14",
                name: "Hominio",
                description: "Professional features and support",
                isRecurring: true,
                prices: [
                    {
                        id: "e4e4adc8-6698-4f08-87dd-5f91e521d0a2",
                        amount: 1111, // $11.11
                        currency: "USD",
                        interval: "month"
                    }
                ]
            };

            const visionCreator: Product = {
                id: "3ae7ed1f-4d0f-4f02-8712-4419514a6a82",
                name: "Visioncreator",
                description: "Advanced features for creators",
                isRecurring: true,
                prices: [
                    {
                        id: "e6671f81-5b80-47c6-9a35-49e7e8d81c27",
                        amount: 3333, // $33.33
                        currency: "USD",
                        interval: "month"
                    }
                ]
            };

            // Add a fake free product
            const freeProduct: Product = {
                id: "free-product",
                name: "Invited",
                description: "Get started with our free plan",
                isRecurring: true,
                prices: [
                    {
                        id: "price_free",
                        amount: 0,
                        currency: "USD",
                        interval: "month"
                    }
                ]
            };

            return {
                products: [freeProduct, hominio, visionCreator]
            };
        } catch (error) {
            console.error('Error fetching products:', error);
            return {
                error: error instanceof Error ? error.message : String(error),
            };
        }
    },
});
