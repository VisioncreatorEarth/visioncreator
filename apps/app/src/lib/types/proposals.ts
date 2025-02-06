export type ProposalState = 'idea' | 'draft' | 'pending' | 'accepted' | 'rejected';

export interface Proposal {
    id: string;
    title: string;
    author: string;
    details: string | null;
    benefits: string | null;
    pain: string | null;
    video_id: string | null;
    state: ProposalState;
    total_votes: number;
    total_tokens_staked: number;
    responsible: string | null;
    created_at: string;
    updated_at: string;
    tags?: string[];
    metadata?: Record<string, string | null>;
    decided_at?: string;
}

export interface VoterInfo {
    id: string;
    name: string | null;
    votes: number;
    tokens: number;
    tokens_staked_vce: number;
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