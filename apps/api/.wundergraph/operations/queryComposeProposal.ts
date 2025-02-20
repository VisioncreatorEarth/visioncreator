import { createOperation, z } from '../generated/wundergraph.factory';

interface ComposeJson {
    [key: string]: unknown;
    content?: string;
    schema?: string;
}

interface ComposeData {
    title: string;
    description: string;
    compose_json: ComposeJson;
    variations_json: ComposeJson[];
    compose_id: string;
}

interface CompositeData {
    id: string;
    title: string;
    description: string;
    compose_id: string;
    variations: string[];
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
                    compose_id,
                    variations
                )
            `)
            .eq('id', input.proposalId)
            .single() as { data: ProposalWithComposite | null; error: any };

        if (proposalError || !proposal?.compose) {
            return { compose_data: null };
        }

        // Get compose data
        const { data: dbEntry, error: dbError } = await context.supabase
            .from('db')
            .select('json')
            .eq('id', proposal.compose.compose_id)
            .single();

        let mainCompose: ComposeJson;
        if (dbError) {
            // If not found in active db, try archive
            const { data: archivedEntry, error: archiveError } = await context.supabase
                .from('db_archive')
                .select('json')
                .eq('id', proposal.compose.compose_id)
                .single();

            if (archiveError || !archivedEntry) {
                throw new Error(`Failed to fetch compose entry: ${dbError.message}`);
            }

            mainCompose = archivedEntry.json as ComposeJson;
        } else {
            mainCompose = dbEntry.json as ComposeJson;
        }

        // Initialize variations as empty array
        let variations: ComposeJson[] = [];

        if (proposal.compose.variations && proposal.compose.variations.length > 0) {
            // First try active db
            const { data: variationEntries, error: variationsError } = await context.supabase
                .from('db')
                .select('id, json')
                .in('id', proposal.compose.variations);

            if (!variationsError && variationEntries) {
                const variationMap = new Map(variationEntries.map(entry => [entry.id, entry.json]));

                // Check archive for any missing variations
                const missingIds = proposal.compose.variations.filter(id => !variationMap.has(id));
                if (missingIds.length > 0) {
                    const { data: archivedVariations } = await context.supabase
                        .from('db_archive')
                        .select('id, json')
                        .in('id', missingIds);

                    if (archivedVariations) {
                        archivedVariations.forEach(entry => variationMap.set(entry.id, entry.json));
                    }
                }

                // Maintain order of variations as stored in the array
                variations = proposal.compose.variations
                    .map(id => variationMap.get(id))
                    .filter((json): json is ComposeJson => json !== undefined);
            }
        }

        return {
            compose_data: {
                title: proposal.compose.title,
                description: proposal.compose.description,
                compose_json: mainCompose,
                variations_json: variations,
                compose_id: proposal.compose.compose_id
            }
        };
    }
}); 