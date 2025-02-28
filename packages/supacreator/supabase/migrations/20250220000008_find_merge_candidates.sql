-- Migration: Add function to find merge candidates
-- Description: Creates a function to find composites that are potential merge candidates for a given composite

CREATE OR REPLACE FUNCTION public.find_merge_candidates(
    p_composite_id uuid
) RETURNS SETOF json AS $$
BEGIN
    -- Return composites that are related to the given composite
    -- or share a common ancestor
    RETURN QUERY
    WITH source_composite AS (
        SELECT 
            c.id,
            c.title,
            c.author,
            c.created_at,
            c.updated_at,
            c.compose_id,
            p.name as author_name
        FROM 
            public.composites c
            JOIN public.profiles p ON c.author = p.id
        WHERE 
            c.id = p_composite_id
    ),
    -- Find direct variations
    direct_variations AS (
        SELECT 
            c.id as composite_id,
            c.title,
            c.author,
            c.updated_at as last_updated,
            p.name as author_name,
            CASE 
                WHEN cr.source_composite_id = p_composite_id THEN 'variation_of'
                WHEN cr.target_composite_id = p_composite_id THEN 'parent_of'
                ELSE cr.relationship_type
            END as relationship_type
        FROM 
            public.composite_relationships cr
            JOIN public.composites c ON 
                (cr.source_composite_id = c.id AND cr.target_composite_id = p_composite_id)
                OR (cr.target_composite_id = c.id AND cr.source_composite_id = p_composite_id)
            JOIN public.profiles p ON c.author = p.id
        WHERE 
            cr.relationship_type IN ('variation_of', 'branched_from', 'merged_from')
            AND c.id != p_composite_id
    ),
    -- Find siblings (composites that share the same parent)
    siblings AS (
        SELECT 
            c.id as composite_id,
            c.title,
            c.author,
            c.updated_at as last_updated,
            p.name as author_name,
            'sibling' as relationship_type
        FROM 
            public.composite_relationships cr1
            JOIN public.composite_relationships cr2 ON cr1.target_composite_id = cr2.target_composite_id
            JOIN public.composites c ON cr2.source_composite_id = c.id
            JOIN public.profiles p ON c.author = p.id
        WHERE 
            cr1.source_composite_id = p_composite_id
            AND cr2.source_composite_id != p_composite_id
            AND cr1.relationship_type = 'variation_of'
            AND cr2.relationship_type = 'variation_of'
    ),
    -- Find other composites by the same author (excluding the current one)
    -- Only include this if we have very few other candidates
    same_author_composites AS (
        SELECT 
            c.id as composite_id,
            c.title,
            c.author,
            c.updated_at as last_updated,
            p.name as author_name,
            'same_author' as relationship_type
        FROM 
            public.composites c
            JOIN source_composite sc ON c.author = sc.author
            JOIN public.profiles p ON c.author = p.id
        WHERE 
            c.id != p_composite_id
            -- Only consider recent ones
            AND c.updated_at > (NOW() - INTERVAL '30 days')
        LIMIT 5
    ),
    -- First count direct variations and siblings
    variant_count AS (
        SELECT COUNT(*) as count FROM direct_variations
        UNION ALL
        SELECT COUNT(*) as count FROM siblings
    ),
    -- Combine all results
    combined_results AS (
        SELECT * FROM direct_variations
        UNION
        SELECT * FROM siblings
        UNION
        -- Only include same_author if we don't have many direct relationships
        SELECT * FROM same_author_composites 
        WHERE (SELECT SUM(count) FROM variant_count) < 5
    )
    -- Return unique results sorted by relevance
    SELECT 
        json_build_object(
            'composite_id', cr.composite_id,
            'title', cr.title,
            'relationship_type', cr.relationship_type,
            'last_updated', cr.last_updated,
            'author_id', cr.author,
            'author_name', cr.author_name
        )
    FROM 
        combined_results cr
    WHERE
        -- Explicitly exclude the current composite
        cr.composite_id != p_composite_id
    ORDER BY 
        -- Sort by relationship type relevance and then by last update date
        CASE 
            WHEN cr.relationship_type = 'parent_of' THEN 1
            WHEN cr.relationship_type = 'variation_of' THEN 2
            WHEN cr.relationship_type = 'branched_from' THEN 3
            WHEN cr.relationship_type = 'merged_from' THEN 4
            WHEN cr.relationship_type = 'sibling' THEN 5
            ELSE 6
        END,
        cr.last_updated DESC
    LIMIT 20;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.find_merge_candidates IS 'Finds potential composite candidates for merging with the specified composite based on relationships and authorship'; 