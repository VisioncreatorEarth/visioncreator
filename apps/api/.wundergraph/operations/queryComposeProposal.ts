import { createOperation, z } from '../generated/wundergraph.factory';

interface ComposeJson {
    [key: string]: unknown;
    content?: string;
    schema?: string;
}

interface RelatedComposite {
    id: string;
    title: string;
    description: string;
    compose_json: ComposeJson;
    compose_id: string;
    relationship_type: string;
    metadata: {
        created_at: string;
        variation_type?: string;
        description?: string;
        [key: string]: unknown;
    };
}

interface ComposeData {
    title: string;
    description: string;
    compose_json: ComposeJson;
    compose_id: string;
    related_composites: RelatedComposite[];
}

interface CompositeData {
    id: string;
    title: string;
    description: string;
    compose_id: string;
}

interface ProposalWithComposite {
    compose: CompositeData;
}

interface RelationshipData {
    source_composite: {
        id: string;
        title: string;
        description: string;
        compose_id: string;
    };
    target_composite: {
        id: string;
        title: string;
        description: string;
        compose_id: string;
    };
    relationship_type: string;
    metadata: {
        created_at: string;
        variation_type?: string;
        description?: string;
        [key: string]: unknown;
    };
}

export default createOperation.query({
    input: z.object({
        proposalId: z.string()
    }),
    handler: async ({ context, input }): Promise<{ compose_data: ComposeData | null }> => {
        try {
            // Get the proposal's composite
            const { data: proposal, error: proposalError } = await context.supabase
                .from('proposals')
                .select(`
                    compose:composites!proposals_compose_fkey(
                        id,
                        title,
                        description,
                        compose_id
                    )
                `)
                .eq('id', input.proposalId)
                .single() as { data: ProposalWithComposite | null; error: any };

            if (proposalError || !proposal?.compose) {
                console.error('[queryComposeProposal] Failed to fetch proposal:', proposalError);
                return { compose_data: null };
            }

            // Get main composite's content
            const { data: mainContent, error: mainError } = await context.supabase
                .from('db')
                .select('json')
                .eq('id', proposal.compose.compose_id)
                .single();

            let mainCompose: ComposeJson;
            if (mainError) {
                // Try archive if not in active db
                const { data: archivedContent, error: archiveError } = await context.supabase
                    .from('db_archive')
                    .select('json')
                    .eq('id', proposal.compose.compose_id)
                    .single();

                if (archiveError || !archivedContent) {
                    console.error('[queryComposeProposal] Failed to fetch main content:', {
                        mainError,
                        archiveError
                    });
                    throw new Error('Failed to fetch main content');
                }
                mainCompose = archivedContent.json as ComposeJson;
            } else {
                mainCompose = mainContent.json as ComposeJson;
            }

            // Get related composites
            const { data: relationships, error: relError } = await context.supabase
                .from('composite_relationships')
                .select(`
                    source_composite:composites!composite_relationships_source_composite_id_fkey(
                        id,
                        title,
                        description,
                        compose_id
                    ),
                    target_composite:composites!composite_relationships_target_composite_id_fkey(
                        id,
                        title,
                        description,
                        compose_id
                    ),
                    relationship_type,
                    metadata
                `)
                .or(`source_composite_id.eq.${proposal.compose.id},target_composite_id.eq.${proposal.compose.id}`) as { data: RelationshipData[] | null; error: any };

            if (relError) {
                console.error('[queryComposeProposal] Failed to fetch relationships:', relError);
                throw new Error('Failed to fetch relationships');
            }

            // Process relationships and fetch related composite content
            const relatedComposites: RelatedComposite[] = [];
            for (const rel of relationships || []) {
                // Determine if this composite is the source or target
                const isSource = rel.target_composite.id === proposal.compose.id;
                const relatedComposite = isSource ? rel.source_composite : rel.target_composite;

                // Get the content for the related composite
                const { data: relContent, error: relContentError } = await context.supabase
                    .from('db')
                    .select('json')
                    .eq('id', relatedComposite.compose_id)
                    .single();

                let composeJson: ComposeJson;
                if (relContentError || !relContent) {
                    // Try archive if not in active db
                    const { data: archiveContent, error: archiveError } = await context.supabase
                        .from('db_archive')
                        .select('json')
                        .eq('id', relatedComposite.compose_id)
                        .single();

                    if (archiveError || !archiveContent) {
                        console.error('[queryComposeProposal] Failed to fetch related content:', {
                            relContentError,
                            archiveError
                        });
                        continue;
                    }
                    composeJson = archiveContent.json as ComposeJson;
                } else {
                    composeJson = relContent.json as ComposeJson;
                }

                relatedComposites.push({
                    id: relatedComposite.id,
                    title: relatedComposite.title,
                    description: relatedComposite.description,
                    compose_json: composeJson,
                    compose_id: relatedComposite.compose_id,
                    relationship_type: isSource ? `target_${rel.relationship_type}` : rel.relationship_type,
                    metadata: rel.metadata
                });
            }

            return {
                compose_data: {
                    title: proposal.compose.title,
                    description: proposal.compose.description,
                    compose_json: mainCompose,
                    compose_id: proposal.compose.compose_id,
                    related_composites: relatedComposites
                }
            };
        } catch (error) {
            console.error('[queryComposeProposal] Unexpected error:', error);
            throw error;
        }
    }
}); 