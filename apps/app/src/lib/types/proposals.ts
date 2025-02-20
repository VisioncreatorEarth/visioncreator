export type ProposalState = 'idea' | 'draft' | 'pending' | 'accepted' | 'rejected';

export interface VoterInfo {
    id: string;
    name: string | null;
    votes: number;
    tokens: number;
    tokens_staked_vce: number;
}

export interface SchemaJson {
    type: string;
    title: string;
    description: string;
    properties: Record<string, unknown>;
    required?: string[];
}

export interface InstanceJson {
    [key: string]: unknown;
}

export interface Proposal {
    id: string;
    title: string;
    author: string;
    details?: string;
    benefits: string | null;
    pain: string | null;
    video_id?: string;
    state: 'idea' | 'draft' | 'pending' | 'accepted' | 'rejected';
    total_votes: number;
    total_tokens_staked: number;
    total_tokens_staked_vce: number;
    total_tokens_staked_eure: number;
    responsible?: string;
    created_at: string;
    updated_at: string;
    decided_at?: string;
    tags: string[];
    metadata?: {
        benefits?: string;
        pain?: string;
        [key: string]: string | undefined;
    };
    compose?: string;
    compose_data?: {
        title: string;
        description: string;
        schema: SchemaJson;
        instance: InstanceJson;
    };
    voters: VoterInfo[];
    isSubscribed: boolean;
}

export interface User {
    id: string;
    name: string;
    onboarded: boolean;
}

export interface TokenTransaction {
    id: string;
    proposal_id: string | null;
    transaction_type: 'stake' | 'unstake' | 'mint' | 'transfer';
    amount: number;
    created_at: string;
    from_user_id: string;
}

export interface Profile {
    id: string;
    name: string | null;
    onboarded: boolean;
}

export interface UserTokens {
    balances: {
        VCE: {
            balance: number;
            staked_balance: number;
        };
        EURe: {
            balance: number;
            staked_balance: number;
        };
    };
    transactions: TokenTransaction[];
} 