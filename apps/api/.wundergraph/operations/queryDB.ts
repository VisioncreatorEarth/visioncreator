import { createOperation } from "../generated/wundergraph.factory";

interface DBItem {
  id: string;
  json: any;
  author: string;
  version: number;
  created_at: string;
  updated_at: string;
}

export default createOperation.query({
  requireAuthentication: true,
  rbac: {
    requireMatchAll: ["authenticated"],
  },
  handler: async ({ context }) => {
    try {
      // Get all records with all columns
      const { data, error } = await context.supabase
        .from("db")
        .select("id, json, author, version, created_at, updated_at")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("[queryDB] Error fetching data:", error);
        throw new Error("Failed to fetch data from db");
      }

      // Parse JSON if needed and ensure proper typing
      const parsedData: DBItem[] = data.map((item) => ({
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
