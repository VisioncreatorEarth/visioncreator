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
    is_archived: boolean;
    author: {
        name: string;
    };
    metadata: {
        created_at: string;
        variation_type?: string;
        description?: string;
        target_composite_id?: string;
        [key: string]: unknown;
    };
}

interface ComposeData {
    title: string;
    description: string;
    compose_json: ComposeJson;
    compose_id: string;
    is_archived: boolean;
    author: {
        name: string;
    };
    related_composites: RelatedComposite[];
    schema_id?: string;
    schema_data?: any;
}

interface CompositeData {
    id: string;
    title: string;
    description: string;
    compose_id: string;
    author: string;
    is_archived: boolean;
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
        author: string;
        is_archived: boolean;
    };
    target_composite: {
        id: string;
        title: string;
        description: string;
        compose_id: string;
        author: string;
        is_archived: boolean;
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
            // Get the proposal's composite with author info
            const { data: proposal, error: proposalError } = await context.supabase
                .from('proposals')
                .select(`
                    compose:composites!proposals_compose_fkey(
                        id,
                        title,
                        description,
                        compose_id,
                        author:profiles(name),
                        is_archived
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
                .select('json, schema')
                .eq('id', proposal.compose.compose_id)
                .single();

            let mainCompose: ComposeJson;
            let schemaId: string | undefined = undefined;
            let schemaData: any = null;

            if (mainError) {
                // Try archive if not in active db
                const { data: archivedContent, error: archiveError } = await context.supabase
                    .from('db_archive')
                    .select('json, schema')
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
                schemaId = archivedContent.schema as string | undefined;
            } else {
                mainCompose = mainContent.json as ComposeJson;
                schemaId = mainContent.schema as string | undefined;
            }

            // Fetch the schema data if we have a schema ID
            if (schemaId) {
                // First try to get schema from active db
                const { data: activeSchema, error: activeSchemaError } = await context.supabase
                    .from('db')
                    .select('json')
                    .eq('id', schemaId)
                    .single();

                if (!activeSchemaError && activeSchema) {
                    schemaData = activeSchema.json;
                } else {
                    // Try archive if not in active db
                    const { data: archivedSchema, error: archivedSchemaError } = await context.supabase
                        .from('db_archive')
                        .select('json')
                        .eq('id', schemaId)
                        .single();

                    if (!archivedSchemaError && archivedSchema) {
                        schemaData = archivedSchema.json;
                    } else {
                        console.warn('[queryComposeProposal] Schema not found:', schemaId);
                    }
                }
            }

            // Get ALL relationships from the database
            const { data: allRelationships, error: relError } = await context.supabase
                .from('composite_relationships')
                .select(`
                    source_composite_id,
                    target_composite_id,
                    relationship_type,
                    metadata
                `) as { data: { source_composite_id: string, target_composite_id: string, relationship_type: string, metadata: any }[] | null; error: any };

            if (relError) {
                console.error('[queryComposeProposal] Failed to fetch relationships:', relError);
                throw new Error('Failed to fetch relationships');
            }


            // Create a map to store the correct target for each composite
            const correctTargetMap = new Map<string, string>();

            // First pass: identify and fix self-references
            for (const rel of allRelationships || []) {
                // Skip if not a variation relationship
                if (rel.relationship_type !== 'variation_of') continue;

                // Check for self-reference
                if (rel.source_composite_id === rel.target_composite_id) {

                    // Look for other relationships where this composite is the source
                    const otherRels = allRelationships?.filter(
                        r => r.source_composite_id === rel.source_composite_id &&
                            r.target_composite_id !== rel.source_composite_id
                    );

                    if (otherRels && otherRels.length > 0) {
                        // Use the first non-self target as the correct target
                        correctTargetMap.set(rel.source_composite_id, otherRels[0].target_composite_id);
                    } else {
                        // If no other relationships, point to the main composite
                        correctTargetMap.set(rel.source_composite_id, proposal.compose.id);
                    }
                } else {
                    // Store the correct target
                    correctTargetMap.set(rel.source_composite_id, rel.target_composite_id);
                }
            }

            // Build a map of all relationships to efficiently find all related composites
            const relationshipMap = new Map<string, { targetIds: string[], sourceIds: string[], relationships: any[] }>();

            // Initialize with the main composite
            relationshipMap.set(proposal.compose.id, { targetIds: [], sourceIds: [], relationships: [] });

            // Process all relationships to build the complete map
            for (const rel of allRelationships || []) {
                // Add source composite to the map if not exists
                if (!relationshipMap.has(rel.source_composite_id)) {
                    relationshipMap.set(rel.source_composite_id, { targetIds: [], sourceIds: [], relationships: [] });
                }

                // Add target composite to the map if not exists
                if (!relationshipMap.has(rel.target_composite_id)) {
                    relationshipMap.set(rel.target_composite_id, { targetIds: [], sourceIds: [], relationships: [] });
                }

                // Record the relationship
                relationshipMap.get(rel.source_composite_id)!.targetIds.push(rel.target_composite_id);
                relationshipMap.get(rel.target_composite_id)!.sourceIds.push(rel.source_composite_id);

                // Store the full relationship data
                relationshipMap.get(rel.source_composite_id)!.relationships.push({
                    targetId: rel.target_composite_id,
                    type: rel.relationship_type,
                    metadata: rel.metadata
                });
                relationshipMap.get(rel.target_composite_id)!.relationships.push({
                    sourceId: rel.source_composite_id,
                    type: `target_${rel.relationship_type}`,
                    metadata: rel.metadata
                });
            }

            // Find all composites that are directly or indirectly related to the main composite
            const relatedCompositeIds = new Set<string>();

            // Start with all composites that have any relationship
            for (const [id, _] of relationshipMap) {
                if (id !== proposal.compose.id) {
                    relatedCompositeIds.add(id);
                }
            }


            // Fetch details for all related composites
            const relatedCompositeIdsArray = Array.from(relatedCompositeIds);
            if (relatedCompositeIdsArray.length === 0) {
                // No related composites found
                return {
                    compose_data: {
                        title: proposal.compose.title,
                        description: proposal.compose.description,
                        compose_json: mainCompose,
                        compose_id: proposal.compose.compose_id,
                        is_archived: proposal.compose.is_archived,
                        author: typeof proposal.compose.author === 'string'
                            ? { name: proposal.compose.author }
                            : proposal.compose.author || { name: 'Unknown' },
                        related_composites: [],
                        schema_id: schemaId,
                        schema_data: schemaData
                    }
                };
            }

            const { data: allRelatedComposites, error: relatedError } = await context.supabase
                .from('composites')
                .select(`
                    id,
                    title,
                    description,
                    compose_id,
                    author:profiles(name),
                    is_archived
                `)
                .in('id', Array.from(relatedCompositeIds)) as {
                    data: Array<{
                        id: string,
                        title: string,
                        description: string,
                        compose_id: string,
                        author: { name: string },
                        is_archived: boolean
                    }> | null;
                    error: any
                };

            if (relatedError) {
                console.error('[queryComposeProposal] Failed to fetch related composites:', relatedError);
                throw new Error('Failed to fetch related composites');
            }


            // Create a map of composite data for quick lookup
            const compositesDataMap = new Map();
            for (const composite of allRelatedComposites || []) {
                compositesDataMap.set(composite.id, composite);
            }

            // Process each related composite to get its content and relationship info
            const relatedComposites: RelatedComposite[] = [];
            for (const composite of allRelatedComposites || []) {
                // Get the content for the related composite
                const { data: relContent, error: relContentError } = await context.supabase
                    .from('db')
                    .select('json')
                    .eq('id', composite.compose_id as string)
                    .single();

                let composeJson: ComposeJson;
                if (relContentError || !relContent) {
                    // Try archive if not in active db
                    const { data: archiveContent, error: archiveError } = await context.supabase
                        .from('db_archive')
                        .select('json')
                        .eq('id', composite.compose_id as string)
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

                // Find the relationship info for this composite
                const relationships = relationshipMap.get(composite.id as string)?.relationships || [];

                // Find the relationship with the main composite or any other composite
                // Prioritize relationships where this is a variation of another composite
                const relationshipInfo = relationships.find(r => r.sourceId) || relationships[0];

                const relationshipType = relationshipInfo ?
                    (relationshipInfo.type || 'variation_of') :
                    'variation_of';

                const metadata = relationshipInfo ?
                    (relationshipInfo.metadata || {}) :
                    { variation_type: 'design' };

                // Use the corrected target ID if available, otherwise use the original
                const correctTargetId = correctTargetMap.get(composite.id as string);
                if (correctTargetId) {
                    metadata.target_composite_id = correctTargetId;
                } else if (relationshipInfo && relationshipInfo.sourceId) {
                    metadata.target_composite_id = relationshipInfo.sourceId;
                }

                // Check if this is a self-reference
                if (metadata.target_composite_id === composite.id) {
                    metadata.target_composite_id = proposal.compose.id;
                }

                relatedComposites.push({
                    id: composite.id as string,
                    title: composite.title as string,
                    description: composite.description as string,
                    compose_json: composeJson,
                    compose_id: composite.compose_id as string,
                    relationship_type: relationshipType,
                    is_archived: composite.is_archived,
                    author: typeof composite.author === 'string'
                        ? { name: composite.author }
                        : composite.author || { name: 'Unknown' },
                    metadata: metadata
                });
            }


            // Log some debug info about the relationships
            for (const composite of relatedComposites) {
            }

            return {
                compose_data: {
                    title: proposal.compose.title,
                    description: proposal.compose.description,
                    compose_json: mainCompose,
                    compose_id: proposal.compose.compose_id,
                    is_archived: proposal.compose.is_archived,
                    author: typeof proposal.compose.author === 'string'
                        ? { name: proposal.compose.author }
                        : proposal.compose.author || { name: 'Unknown' },
                    related_composites: relatedComposites,
                    schema_id: schemaId,
                    schema_data: schemaData
                }
            };
        } catch (error) {
            console.error('[queryComposeProposal] Unexpected error:', error);
            return {
                compose_data: null
            };
        }
    }
}); 