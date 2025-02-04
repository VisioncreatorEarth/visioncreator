import { createOperation } from '../generated/wundergraph.factory';

interface Proposal {
    id: string;
    title: string;
    author: string;
    details: string | null;
    video_id: string | null;
    state: 'idea' | 'draft' | 'decision';
    votes_count: number;
    total_tokens_staked: number;
    responsible: string | null;
    created_at: string;
    updated_at: string;
    tags: string[];
    metadata: {
        benefits?: string | null;
        pain?: string | null;
        [key: string]: any;  // Allow for flexible metadata fields
    };
}

export default createOperation.query({
    handler: async ({ context }): Promise<{ proposals: Proposal[] }> => {
        // Get all proposals ordered by votes
        const { data: proposals, error } = await context.supabase
            .from('proposals')
            .select('*')
            .order('votes_count', { ascending: false })
            .returns<Proposal[]>();

        if (error) {
            console.error('Error fetching proposals:', error);
            throw new Error(`Failed to fetch proposals: ${error.message}`);
        }

        return {
            proposals: proposals || []
        };
    }
}); 
