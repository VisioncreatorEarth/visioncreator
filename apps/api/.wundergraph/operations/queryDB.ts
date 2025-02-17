import { createOperation } from "../generated/wundergraph.factory";

interface DBItem {
  id: string;
  json: any;
  author: string;
  author_name: string;
  schema: string;
  version: number;
  variation: string;
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
        profiles!db_author_fkey (
          id,
          name
        )
      `);

    if (activeError) {
      throw new Error(`Database query error: ${activeError.message}`);
    }

    // Get archived versions in a separate query
    const { data: archivedData } = await context.supabase
      .from("db_archive")
      .select(`
        *,
        profiles!db_archive_author_fkey (
          id,
          name
        )
      `);

    // Group archived versions by variation
    const archivedByVariation = (archivedData || []).reduce((acc, item) => {
      if (!acc[item.variation]) {
        acc[item.variation] = [];
      }
      acc[item.variation].push({
        id: item.id,
        json: typeof item.json === "string" ? JSON.parse(item.json) : item.json,
        author: item.author,
        author_name: item.profiles?.name || 'Unknown User',
        schema: item.schema,
        version: item.version,
        variation: item.variation,
        prev: item.prev,
        created_at: item.created_at,
        is_archived: true,
        archived_at: item.archived_at
      });
      return acc;
    }, {} as Record<string, any[]>);

    return {
      db: activeData.map(item => ({
        id: item.id,
        json: typeof item.json === "string" ? JSON.parse(item.json) : item.json,
        author: item.author,
        author_name: item.profiles?.name || 'Unknown User',
        schema: item.schema,
        version: item.version,
        variation: item.variation,
        prev: item.prev,
        created_at: item.created_at,
        is_archived: false,
        archived_versions: archivedByVariation[item.variation] || []
      }))
    };
  },
});
