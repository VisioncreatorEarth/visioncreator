import { createOperation } from "../generated/wundergraph.factory";

interface DBItem {
  id: string;
  json: any;
  author: string;
  author_name: string;
  schema: string;
  version: number;
  created_at: string;
  prev: string | null;
  is_archived?: boolean;
}

export default createOperation.query({
  requireAuthentication: true,
  rbac: {
    requireMatchAll: ["authenticated"],
  },
  handler: async ({ context }) => {
    // Get active items with their profiles
    const { data: activeData, error: activeError } = await context.supabase
      .from("db")
      .select(`
        *,
        profiles (
          name
        )
      `);

    if (activeError) {
      throw new Error(`Database query error: ${activeError.message}`);
    }

    // Get all referenced schema IDs
    const schemaIds = new Set(activeData.map(item => item.schema));

    // For schemas not found in active data, look in archive
    const missingSchemas = Array.from(schemaIds).filter(
      id => !activeData.find(item => item.id === id)
    );

    let allItems = [...activeData];

    if (missingSchemas.length > 0) {
      const { data: archivedSchemas } = await context.supabase
        .from("db_archive")
        .select(`
          *,
          profiles (
            name
          )
        `)
        .in("id", missingSchemas);

      if (archivedSchemas) {
        allItems = [...allItems, ...archivedSchemas];
      }
    }

    return {
      db: allItems.map(item => ({
        id: item.id,
        json: typeof item.json === "string" ? JSON.parse(item.json) : item.json,
        author: item.author,
        author_name: item.profiles?.name || 'Unknown User',
        schema: item.schema,
        version: item.version,
        prev: item.prev,
        created_at: item.created_at,
        is_archived: 'archived_at' in item
      }))
    };
  },
});
