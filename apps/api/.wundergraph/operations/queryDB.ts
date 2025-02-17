import { createOperation } from "../generated/wundergraph.factory";

interface DBItem {
  id: string;
  json: any;
  author: string;
  author_name: string;
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
    const { data, error } = await context.supabase
      .from("db")
      .select(`
        *,
        profiles (
          name
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Database query error: ${error.message}`);
    }

    if (!data) {
      return { db: [] };
    }

    const parsedData: DBItem[] = data.map((item: any) => ({
      id: item.id,
      json: typeof item.json === "string" ? JSON.parse(item.json) : item.json,
      author: item.author,
      author_name: item.profiles?.name || 'Unknown User',
      schema: item.schema,
      version: item.version,
      created_at: item.created_at,
      updated_at: item.updated_at
    }));

    return { db: parsedData };
  },
});
