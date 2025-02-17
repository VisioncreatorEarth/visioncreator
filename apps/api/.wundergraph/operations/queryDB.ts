import { createOperation } from "../generated/wundergraph.factory";

export default createOperation.query({
  requireAuthentication: true,
  rbac: {
    requireMatchAll: ["admin"],
  },
  handler: async ({ context }) => {
    try {
      const { data, error } = await context.supabase.from("db").select("*");

      if (error) {
        console.error("[queryDB] Error fetching data:", error);
        throw new Error("Failed to fetch data from db");
      }

      const parsedData = data.map((item) => ({
        ...item,
        json: typeof item.json === "string" ? JSON.parse(item.json) : item.json,
      }));

      return { db: parsedData };
    } catch (error) {
      console.error("[queryDB] Unexpected error:", error);
      throw error;
    }
  },
});
