import { createOperation } from "../generated/wundergraph.factory";

interface Product {
    id: string;
    name: string;
    description: string;
    isRecurring: boolean;
    prices: {
        id: string;
        priceAmount: number;
        priceCurrency: string;
        recurringInterval?: string;
    }[];
}

export default createOperation.query({
    requireAuthentication: true,
    rbac: {
        requireMatchAll: ["authenticated"],
    },
    handler: async ({ context }) => {
        try {
            // Define our product directly since we know its details
            const product: Product = {
                id: "ef8f64f5-e644-4066-b339-a45e63a64f14",
                name: "Pro Plan",
                description: "Professional features and support",
                isRecurring: true,
                prices: [
                    {
                        id: "b3b53826-a510-40cc-89dc-6e02329229ff",
                        priceAmount: 1000,
                        priceCurrency: "USD",
                        recurringInterval: "month"
                    }
                ]
            };

            // Add a fake free product
            const freeProduct: Product = {
                id: "free-product",
                name: "Free Plan",
                description: "Get started with our free plan",
                isRecurring: true,
                prices: [
                    {
                        id: "free-price",
                        priceAmount: 0,
                        priceCurrency: "USD",
                        recurringInterval: "month",
                    },
                ],
            };

            return {
                products: [freeProduct, product],
            };
        } catch (error) {
            console.error("Error fetching Polar products:", error);
            return {
                error: error instanceof Error ? error.message : String(error),
            };
        }
    },
});
