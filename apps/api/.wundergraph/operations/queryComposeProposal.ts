import { createOperation, z } from '../generated/wundergraph.factory';

interface SchemaJson {
    type: string;
    title: string;
    description: string;
    properties: Record<string, unknown>;
    required?: string[];
}

interface InstanceJson {
    [key: string]: unknown;
}

interface ComposeData {
    title: string;
    description: string;
    schema: SchemaJson;
    instance: InstanceJson;
}

interface CompositeData {
    id: string;
    title: string;
    description: string;
    schema_id: string;
    instance_id: string;
}

interface ProposalWithComposite {
    compose: CompositeData;
}

export default createOperation.query({
    input: z.object({
        proposalId: z.string()
    }),
    handler: async ({ context, input }): Promise<{ compose_data: ComposeData | null }> => {
        // Get the proposal's composite
        const { data: proposal, error: proposalError } = await context.supabase
            .from('proposals')
            .select(`
                compose:composites!proposals_compose_fkey(
                    id,
                    title,
                    description,
                    schema_id,
                    instance_id
                )
            `)
            .eq('id', input.proposalId)
            .single() as { data: ProposalWithComposite | null; error: any };

        if (proposalError || !proposal?.compose) {
            return { compose_data: null };
        }

        // Get both schema and instance data
        const { data: dbEntries, error: dbError } = await context.supabase
            .from('db')
            .select('id, json')
            .in('id', [proposal.compose.schema_id, proposal.compose.instance_id]);

        if (dbError) {
            throw new Error(`Failed to fetch db entries: ${dbError.message}`);
        }

        // Create a map for quick lookup
        const dbMap = new Map(dbEntries.map(entry => [entry.id, entry.json]));

        // If not found in active db, try archive
        const missingIds = [proposal.compose.schema_id, proposal.compose.instance_id]
            .filter(id => !dbMap.has(id));

        if (missingIds.length > 0) {
            const { data: archivedEntries, error: archiveError } = await context.supabase
                .from('db_archive')
                .select('id, json')
                .in('id', missingIds);

            if (!archiveError && archivedEntries) {
                archivedEntries.forEach(entry => {
                    dbMap.set(entry.id, entry.json);
                });
            }
        }

        return {
            compose_data: {
                title: proposal.compose.title,
                description: proposal.compose.description,
                schema: dbMap.get(proposal.compose.schema_id) as SchemaJson,
                instance: dbMap.get(proposal.compose.instance_id) as InstanceJson
            }
        };
    }
}); 