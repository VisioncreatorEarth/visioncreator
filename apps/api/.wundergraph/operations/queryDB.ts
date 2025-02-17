import { createOperation } from "../generated/wundergraph.factory";

interface DBItem {
  id: string;
  json: any;
  author: string;
  schema: string;
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
      const { data, error } = await context.supabase
        .from("db")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("[queryDB] Error fetching data:", error);
        throw new Error("Failed to fetch data from db");
      }

      if (!data) {
        return { db: [] };
      }

      const parsedData: DBItem[] = data.map((item: any) => ({
        id: item.id,
        json: typeof item.json === "string" ? JSON.parse(item.json) : item.json,
        author: item.author,
        schema: item.schema,
        version: item.version,
        created_at: item.created_at,
        updated_at: item.updated_at
      }));

      return { db: parsedData };
    } catch (error) {
      console.error("[queryDB] Unexpected error:", error);
      throw error;
    }
  },
});
