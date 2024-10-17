import { createOperation } from "../generated/wundergraph.factory";

interface Product {
  id: string;
  name: string;
  description: string;
  isRecurring: boolean;
  prices: {
    priceAmount: number;
    priceCurrency: string;
    recurringInterval?: string;
  }[];
}

export default createOperation.query({
  requireAuthentication: true,
  rbac: {
    requireMatchAll: ["authenticated", "admin"],
  },
  handler: async ({ context }) => {
    try {
      const organizationSlug = "visioncreator";
      const organizationResult = await context.polar.organizations.list({
        slug: organizationSlug,
      });

      let organization;
      for await (const page of organizationResult) {
        if (page && page.result && Array.isArray(page.result.items) && page.result.items.length > 0) {
          organization = page.result.items[0];
          break;
        }
      }

      if (!organization) {
        throw new Error("Organization not found");
      }

      const productsResult = await context.polar.products.list({
        organizationId: organization.id,
      });

      let allProducts: Product[] = [];

      for await (const page of productsResult) {
        if (page && page.result && Array.isArray(page.result.items)) {
          allProducts = allProducts.concat(page.result.items);
        }

        if (page.result.pagination.maxPage === page.result.pagination.page) {
          break;
        }
      }

      // Deduplicate products based on their ID
      const uniqueProducts = Array.from(new Map(allProducts.map(product => [product.id, product])).values());

      // Add a fake free product
      const freeProduct: Product = {
        id: "free-product",
        name: "Free Plan",
        description: "Get started with our free plan",
        isRecurring: true,
        prices: [
          {
            priceAmount: 0,
            priceCurrency: "USD",
            recurringInterval: "month",
          },
        ],
      };

      uniqueProducts.unshift(freeProduct);

      return {
        products: uniqueProducts,
      };
    } catch (error) {
      console.error("Error fetching Polar products:", error);
      return {
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },
});
