import { createOperation, z } from '../generated/wundergraph.factory';

interface InstanceJson {
    [key: string]: unknown;
    content?: string;
    schema?: string;
}

interface ComposeData {
    title: string;
    description: string;
    instance_json: InstanceJson;
    variations_json: InstanceJson[];
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
        console.log('=== Starting queryComposeProposal ===');
        console.log('Input proposalId:', input.proposalId);

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
            console.log('Error or no compose data found:', proposalError);
            return { compose_data: null };
        }

        console.log('Found composite:', proposal.compose);
        console.log('Variations array in composite:', proposal.compose.variations);

        // Get instance data
        const { data: dbEntry, error: dbError } = await context.supabase
            .from('db')
            .select('json')
            .eq('id', proposal.compose.compose_id)
            .single();

        let mainInstance: InstanceJson;
        if (dbError) {
            console.log('Main instance not found in active db, checking archive');
            // If not found in active db, try archive
            const { data: archivedEntry, error: archiveError } = await context.supabase
                .from('db_archive')
                .select('json')
                .eq('id', proposal.compose.compose_id)
                .single();

            if (archiveError || !archivedEntry) {
                console.error('Failed to fetch main db entry:', dbError);
                throw new Error(`Failed to fetch main db entry: ${dbError.message}`);
            }

            mainInstance = archivedEntry.json as InstanceJson;
        } else {
            mainInstance = dbEntry.json as InstanceJson;
        }

        console.log('Main instance:', mainInstance);

        // Initialize variations as empty array
        let variations: InstanceJson[] = [];

        if (proposal.compose.variations && proposal.compose.variations.length > 0) {
            console.log('Found variations to fetch:', proposal.compose.variations.length);
            console.log('Variation IDs:', proposal.compose.variations);

            // First try active db
            const { data: variationEntries, error: variationsError } = await context.supabase
                .from('db')
                .select('id, json')
                .in('id', proposal.compose.variations);

            console.log('Active DB variations result:', {
                entries: variationEntries?.length || 0,
                error: variationsError
            });

            if (!variationsError && variationEntries) {
                const variationMap = new Map(variationEntries.map(entry => [entry.id, entry.json]));
                console.log('Created variation map with keys:', Array.from(variationMap.keys()));

                // Check archive for any missing variations
                const missingIds = proposal.compose.variations.filter(id => !variationMap.has(id));
                if (missingIds.length > 0) {
                    console.log('Checking archive for missing variations:', missingIds);

                    const { data: archivedVariations } = await context.supabase
                        .from('db_archive')
                        .select('id, json')
                        .in('id', missingIds);

                    console.log('Archived variations found:', archivedVariations?.length || 0);

                    if (archivedVariations) {
                        archivedVariations.forEach(entry => variationMap.set(entry.id, entry.json));
                    }
                }

                // Maintain order of variations as stored in the array
                variations = proposal.compose.variations
                    .map(id => variationMap.get(id))
                    .filter((json): json is InstanceJson => json !== undefined);

                console.log('Final variations array length:', variations.length);
            }
        } else {
            console.log('No variations found in composite');
        }

        const result = {
            compose_data: {
                title: proposal.compose.title,
                description: proposal.compose.description,
                instance_json: mainInstance,
                variations_json: variations  // This should always be an array
            }
        };

        console.log('=== Final response structure ===');
        console.log('Title:', result.compose_data.title);
        console.log('Description:', result.compose_data.description);
        console.log('Has instance_json:', !!result.compose_data.instance_json);
        console.log('Variations count:', result.compose_data.variations_json.length);

        return result;
    }
}); 