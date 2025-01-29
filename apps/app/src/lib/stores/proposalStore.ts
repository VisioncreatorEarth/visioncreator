/*
This store manages the proposal system's state, including:
1. Proposals data and their states
2. User voting and token management
3. Budget calculations and pool metrics
4. Dashboard metrics

The store uses Svelte's writable and derived stores to handle reactivity.
All state changes and calculations are centralized here for easier database integration.

HOW THE PROPOSAL SYSTEM WORKS:

1. Voting Process:
   Stage 1 - Ideas:
   - Community members can submit and vote on ideas
   - Ideas need to reach 10% of total active votes to become proposals
   - Ideas don't have budget allocations
   - Voting on ideas uses the same tokens as proposals

   Stage 2 - Proposals:
   - Each user has tokens they can use to vote
   - More votes = larger share of the voting pool
   - When voting on a proposal:
     * Adding a vote increases the proposal's budget allocation
     * Removing a vote decreases the allocation
     * Budget is automatically distributed based on vote percentages
     * If a proposal gets more budget than requested, excess is redistributed

2. Token System:
   - Each user starts with a base amount of tokens
   - Tokens are used for both ideas and proposals
   - Quadratic voting cost:
     * First vote costs 1 token
     * Second vote costs 3 tokens (2² - 1²)
     * Third vote costs 5 tokens (3² - 2²)
     * Each additional vote follows (n+1)² - n² pattern
   - Tokens are returned when:
     * Removing votes (refund based on quadratic formula)
     * Resetting a proposal (full refund of all spent tokens)

3. Proposal States:
   - Idea: Initial stage, needs 10% votes to advance
   - Proposal: Open for community votes and budget allocation
   - Pending Approval: Reached requested budget, waiting for review
   - In Progress: Work has started
   - Review: Work completed, waiting for verification
   - Completed: Fully delivered and paid

4. Budget System:
   - There's a main "Community Contribution Pool" calculated from number of VisionCreators
   - Pool Size = VisionCreators × 365 × 0.75
   - This pool is divided into three parts:
     * Voting Pool: Available for active voting proposals
     * Locked Pool: For proposals in progress
     * Delivered Pool: For completed proposals

5. Budget Allocation Rules:
   - Each proposal has a fixed requested budget
   - Can't allocate more than requested budget to any proposal
   - Excess budget is automatically redistributed to other voting proposals
   - Once a proposal reaches its requested budget, it moves to "Pending Approval"
   - Budget calculation:
     * Each vote represents a share of the voting pool
     * Share = (proposal votes / total votes) × voting pool
     * If share > requested budget, excess is redistributed
     * Redistribution based on remaining proposals' vote ratios

6. State Transitions:
   - Automatic: 
     * Idea → Proposal (when 10% vote threshold reached)
     * Proposal → Pending Approval (when budget reached)
   - Manual: Through state cycle button for other states
   - Cycle: In Progress → Review → Completed
   - Reset: Any state can be reset to Idea (returns all votes)

7. Visual Feedback:
   - Progress bars show % of requested budget or votes needed
   - Color coding for different states:
     * Idea: Tertiary color
     * Proposal: Tertiary color
     * Pending Approval: Secondary color
     * In Progress: Primary color
     * Review: Warning color
     * Completed: Success color
   - Real-time updates of:
     * Budget allocations
     * Vote counts
     * Token balances
     * State transitions
   - Clear indicators for:
     * Next vote cost
     * Available tokens
     * Progress towards goals
     * Current state and transitions

8. Implementation Details:
   - Uses Svelte stores for reactive state management
   - Derived stores for complex calculations:
     * Pool metrics
     * Vote allocations
     * Budget distributions
   - Automatic recalculation on:
     * Vote changes
     * State transitions
     * VisionCreator count updates
   - Map data structures for efficient lookups:
     * User votes
     * Budget allocations
     * Vote distributions
*/

import { writable, derived, get } from 'svelte/store';
import { activityStore } from './activityStore';

// Types
export type ProposalState = 'idea' | 'draft' | 'decision';
export type VoteEventType = 'vote_added' | 'vote_removed';

// Activity types
export type ActivityType = 'proposal_created' | 'state_change' | 'proposal_updated' | 'proposal_rejected' | 'proposal_reset' | 'vote_added' | 'vote_removed';

export interface VoteEvent {
    id: string;
    type: VoteEventType;
    proposalId: string;
    userId: string;
    timestamp: number;
    tokensUsed: number;
}

export interface ProposalActivity {
    id: string;
    type: ActivityType;
    proposalId: string;
    proposalTitle: string;
    actor: string;
    previousState?: ProposalState;
    newState?: ProposalState;
    timestamp: number;
}

export interface ProposalTask {
    id: string;
    title: string;
    description: string;
    completed: boolean;
}

export interface Proposal {
    id: string;
    title: string;
    author: string;
    votes: number;
    details: string;
    benefits?: string;
    pain?: string;
    state: ProposalState;
    budgetRequested: number;
    responsible?: string;
}

export interface UserProfile {
    id: string;
    name: string;
    tokens: number;
    proposalsVoted: Map<string, number>;
}

export interface DashboardMetrics {
    visionCreators: number;
}

export interface PoolMetrics {
    totalContributionPool: number;
}

// Initial Data
const initialProposals: Proposal[] = [
    {
        id: '13',
        title: 'Community Podcast Series',
        author: 'Michael Chen',
        votes: 16,
        benefits: 'Broader reach and deeper community insights',
        pain: 'Limited channels for sharing community stories and knowledge',
        details: `## Content Focus
- Member success stories
- Project deep dives
- Industry trends
- Community updates
- Guest interviews

Sharing our community story with the world.

## Time to Realization
2-3 weeks

## Definition of Done
- [ ] Recording setup complete
- [ ] First 3 episodes recorded
- [ ] Distribution channels set up
- [ ] Show format finalized

## Dependencies
- Recording equipment
- Hosting platform
- Guest commitments`,
        state: 'idea',
        budgetRequested: 800
    },
    {
        id: '14',
        title: 'Community Learning Hub',
        author: 'Sarah Johnson',
        votes: 8,
        benefits: 'Centralized knowledge sharing and skill development',
        pain: 'Scattered learning resources and lack of structured education path',
        details: `## Platform Features
- Course creation tools
- Interactive workshops
- Resource library
- Progress tracking
- Certification system

Empowering community growth through education.

## Time to Realization
4-5 weeks

## Definition of Done
- [ ] Platform launched with 10 courses
- [ ] Course creation tools tested
- [ ] Certification system working
- [ ] Analytics dashboard ready

## Dependencies
- Course creators
- Content guidelines
- Storage solution`,
        state: 'idea',
        budgetRequested: 1500
    }
];

// Store Creations
export const proposals = writable<Proposal[]>(initialProposals);
export const currentUser = writable<UserProfile>({
    id: '1',
    name: 'Samuel Andert',
    tokens: 25,
    proposalsVoted: new Map()
});
export const dashboardMetrics = writable<DashboardMetrics>({
    visionCreators: 17
});

// Default active tab is now 'idea'
export const activeTab = writable<ProposalState>('idea');

// Update the tab order to only show idea state for now
export const PROPOSAL_TABS: ProposalState[] = ['idea', 'draft', 'decision'];

// Function to change active tab
export function setActiveTab(state: ProposalState): void {
    activeTab.set(state);
}

// Helper Functions
function getFixedStateValue(state: ProposalState, budgetRequested: number): number {
    if (state === 'offer') return 0;
    return budgetRequested;
}

// Helper function to check if a state is active (votes count towards total)
function isActiveState(state: ProposalState): boolean {
    return state === 'idea' || state === 'offer';
}

// Update poolMetrics to use the new state logic
export const poolMetrics = derived([dashboardMetrics, proposals], ([$dashboardMetrics, $proposals]) => {
    const delivered = $proposals
        .filter((p) => p.state === 'completed')
        .reduce((sum, p) => sum + p.budgetRequested, 0);

    const total = Math.max(0, Math.round($dashboardMetrics.visionCreators * 365 * 0.75) - delivered);

    const locked = $proposals
        .filter((p) => p.state === 'in_progress' || p.state === 'review' || p.state === 'decision')
        .reduce((sum, p) => sum + p.budgetRequested, 0);

    const voting = Math.max(0, total - locked);

    // Update totalActiveVotes to only count votes from active states
    const totalActiveVotes = $proposals
        .filter((p) => isActiveState(p.state))
        .reduce((sum, p) => sum + p.votes, 0);

    return {
        totalContributionPool: total,
        votingPool: voting,
        lockedPool: locked,
        deliveredPool: delivered,
        totalActiveVotes
    };
});

// Update voting values calculation to use active states
function calculateVotingValues(proposals: Proposal[], votingPool: number): Map<string, number> {
    const votingProposals = proposals.filter((p) => p.state === 'offer');
    // Update total votes to only count active states
    const totalVotes = proposals
        .filter((p) => isActiveState(p.state))
        .reduce((sum, p) => sum + p.votes, 0);

    if (totalVotes === 0) return new Map(votingProposals.map((p) => [p.id, 0]));

    const allocations = new Map<string, number>();
    const overAllocated = new Map<string, number>();

    votingProposals.forEach((proposal) => {
        const rawValue = Math.round((proposal.votes / totalVotes) * votingPool);
        if (rawValue > proposal.budgetRequested) {
            allocations.set(proposal.id, proposal.budgetRequested);
            overAllocated.set(proposal.id, rawValue - proposal.budgetRequested);
        } else {
            allocations.set(proposal.id, rawValue);
        }
    });

    let remainingPool = votingPool;

    votingProposals.forEach((proposal) => {
        const currentAllocation = allocations.get(proposal.id) || 0;
        const additionalAllocation = Math.round((proposal.votes / totalVotes) * remainingPool);
        const newAllocation = Math.min(currentAllocation + additionalAllocation, proposal.budgetRequested);
        allocations.set(proposal.id, newAllocation);
        remainingPool -= additionalAllocation;
    });

    const excessBudget = Array.from(overAllocated.values()).reduce((sum, value) => sum + value, 0);
    if (excessBudget === 0) return allocations;

    const eligibleProposals = votingProposals.filter(
        (p) => !overAllocated.has(p.id) && (allocations.get(p.id) || 0) < p.budgetRequested
    );

    if (eligibleProposals.length > 0) {
        const eligibleVotes = eligibleProposals.reduce((sum, p) => sum + p.votes, 0);
        eligibleProposals.forEach((proposal) => {
            const currentAllocation = allocations.get(proposal.id) || 0;
            const additionalAllocation = Math.round((proposal.votes / eligibleVotes) * excessBudget);
            const newAllocation = Math.min(currentAllocation + additionalAllocation, proposal.budgetRequested);
            allocations.set(proposal.id, newAllocation);
        });
    }

    return allocations;
}

// Constants
export const MIN_TOTAL_VOTES_FOR_PROPOSAL = 10;
export const IDEA_VOTE_THRESHOLD_PERCENTAGE = 0.1; // 10%
export const DRAFT_VOTE_THRESHOLD = 20;  // For draft to decision

// Derived Stores
export const proposalValues = derived([proposals, poolMetrics], ([$proposals, $poolMetrics]) => {
    const votingValues = calculateVotingValues($proposals, $poolMetrics.votingPool);

    return $proposals.map((proposal) => ({
        id: proposal.id,
        value:
            proposal.state === 'offer'
                ? votingValues.get(proposal.id) || 0
                : getFixedStateValue(proposal.state, proposal.budgetRequested)
    }));
});

// Store for vote events
export const voteEvents = writable<VoteEvent[]>([]);

// Function to add a vote
export function addVote(proposalId: string, userId: string, tokensUsed: number) {
    const voteEvent: VoteEvent = {
        id: crypto.randomUUID(),
        type: 'vote_added',
        proposalId,
        userId,
        timestamp: Date.now(),
        tokensUsed
    };

    voteEvents.update($events => [...$events, voteEvent]);

    // Update proposal votes count
    proposals.update($proposals => {
        return $proposals.map(p => {
            if (p.id === proposalId) {
                return { ...p, votes: p.votes + tokensUsed };
            }
            return p;
        });
    });

    // Track in activity stream
    const proposal = get(proposals).find(p => p.id === proposalId);
    if (proposal) {
        activityStore.addActivity({
            type: 'vote_added',
            proposalId,
            proposalTitle: proposal.title,
            actor: userId,
            details: `Added ${tokensUsed} tokens`
        });
    }
}

// Function to remove a vote
export function removeVote(proposalId: string, userId: string, tokensToRemove: number) {
    const proposal = get(proposals).find(p => p.id === proposalId);
    if (!proposal) return;

    // Don't allow votes to go below 0
    const actualTokensToRemove = Math.min(tokensToRemove, proposal.votes);

    if (actualTokensToRemove > 0) {
        const voteEvent: VoteEvent = {
            id: crypto.randomUUID(),
            type: 'vote_removed',
            proposalId,
            userId,
            timestamp: Date.now(),
            tokensUsed: actualTokensToRemove
        };

        voteEvents.update($events => [...$events, voteEvent]);

        // Update proposal votes count
        proposals.update($proposals => {
            return $proposals.map(p => {
                if (p.id === proposalId) {
                    return { ...p, votes: Math.max(0, p.votes - actualTokensToRemove) };
                }
                return p;
            });
        });

        // Track in activity stream
        activityStore.addActivity({
            type: 'vote_removed',
            proposalId,
            proposalTitle: proposal.title,
            actor: userId,
            details: `Removed ${actualTokensToRemove} tokens`
        });
    }
}

// Derived store to get total votes per proposal from events
export const proposalVotesFromEvents = derived(voteEvents, ($events) => {
    const voteCounts = new Map<string, number>();

    $events.forEach(event => {
        const currentVotes = voteCounts.get(event.proposalId) || 0;
        if (event.type === 'vote_added') {
            voteCounts.set(event.proposalId, currentVotes + event.tokensUsed);
        } else {
            voteCounts.set(event.proposalId, Math.max(0, currentVotes - event.tokensUsed));
        }
    });

    return voteCounts;
});

// Store Actions
export function getNextVoteCost(currentVotes: number): number {
    return Math.pow(currentVotes + 1, 2) - Math.pow(currentVotes, 2);
}

export function vote(proposalId: string, isIncrease: boolean): void {
    proposals.update(($proposals) => {
        const proposal = $proposals.find((p) => p.id === proposalId);
        if (!proposal) return $proposals;

        currentUser.update(($currentUser) => {
            if (isIncrease) {
                const currentVotes = $currentUser.proposalsVoted.get(proposalId) || 0;
                const nextVoteCost = getNextVoteCost(currentVotes);

                if ($currentUser.tokens >= nextVoteCost) {
                    $currentUser.tokens -= nextVoteCost;
                    $currentUser.proposalsVoted.set(proposalId, currentVotes + 1);
                    proposal.votes += 1;
                }
            } else {
                const currentVotes = $currentUser.proposalsVoted.get(proposalId) || 0;
                if (currentVotes > 0) {
                    const refundAmount = getNextVoteCost(currentVotes - 1);
                    $currentUser.tokens += refundAmount;
                    $currentUser.proposalsVoted.set(proposalId, currentVotes - 1);
                    proposal.votes -= 1;
                }
            }
            return $currentUser;
        });

        return $proposals;
    });
}

export function resetProposal(proposalId: string): void {
    proposals.update(($proposals) => {
        return $proposals.map((p) => {
            if (p.id === proposalId) {
                currentUser.update(($currentUser) => {
                    const userVotes = $currentUser.proposalsVoted.get(proposalId) || 0;
                    $currentUser.tokens += userVotes;
                    $currentUser.proposalsVoted.delete(proposalId);
                    return $currentUser;
                });

                return {
                    ...p,
                    votes: 0,
                    state: 'idea' as ProposalState
                };
            }
            return p;
        });
    });
}

// Helper function to get the next state in the workflow
function getNextState(currentState: ProposalState): ProposalState {
    const stateFlow: Record<ProposalState, ProposalState> = {
        idea: 'draft',
        draft: 'decision',
        decision: 'in_progress',
        in_progress: 'review',
        review: 'completed',
        completed: 'completed',
        rejected: 'rejected',
        active: 'completed'
    };
    return stateFlow[currentState];
}

export function cycleProposalState(proposalId: string) {
    const currentUserValue = get(currentUser);
    proposals.update((proposals) => {
        const proposal = proposals.find((p) => p.id === proposalId);
        if (!proposal) return proposals;

        const previousState = proposal.state;
        const newState = getNextState(proposal.state);

        // Track state change in activity
        activityStore.addActivity({
            type: 'state_change',
            proposalId,
            proposalTitle: proposal.title,
            actor: currentUserValue.name,
            previousState,
            newState
        });

        return proposals.map((p) =>
            p.id === proposalId
                ? {
                    ...p,
                    state: newState
                }
                : p
        );
    });
}

export function adjustVisionCreators(increment: boolean): void {
    dashboardMetrics.update(($metrics) => ({
        ...$metrics,
        visionCreators: increment ? $metrics.visionCreators + 1 : Math.max(0, $metrics.visionCreators - 1)
    }));
}

// UI Helper Functions
export function getStateColor(state: ProposalState): string {
    switch (state) {
        case 'idea':
            return 'text-tertiary-200';
        case 'draft':
            return 'text-blue-200';
        case 'decision':
            return 'text-green-200';
        default:
            return 'text-tertiary-200';
    }
}

export function getStateIcon(state: ProposalState): string {
    switch (state) {
        case 'idea':
            return 'mdi:lightbulb';
        case 'draft':
            return 'mdi:file-document-outline';
        case 'decision':
            return 'mdi:gavel';
        default:
            return 'mdi:help-circle-outline';
    }
}

export function getStateLabel(state: ProposalState): string {
    switch (state) {
        case 'idea':
            return 'Idea';
        case 'draft':
            return 'Draft';
        case 'decision':
            return 'Decision';
        default:
            return 'Unknown';
    }
}

export function getTabLabel(state: ProposalState): string {
    switch (state) {
        case 'idea':
            return 'Ideas';
        case 'draft':
            return 'Drafts';
        case 'decision':
            return 'Decisions';
        default:
            return 'Unknown';
    }
}

export function getStateBgColor(state: ProposalState): string {
    switch (state) {
        case 'idea':
            return 'bg-tertiary-900/20';
        case 'draft':
            return 'bg-blue-900/20';
        case 'decision':
            return 'bg-green-900/20';
        default:
            return 'bg-surface-800/20';
    }
}

// Update state transition logic
export function checkProposalStateTransitions($proposals: Proposal[], voteThreshold: number): Proposal[] {
    return $proposals.map(proposal => {
        if (proposal.state === 'idea' && proposal.votes >= voteThreshold) {
            return {
                ...proposal,
                state: 'draft'
            };
        } else if (proposal.state === 'draft' && proposal.votes >= DRAFT_VOTE_THRESHOLD) {
            return {
                ...proposal,
                state: 'decision'
            };
        }
        return proposal;
    });
}

export function rejectProposal(proposalId: string) {
    const currentUserValue = get(currentUser);
    proposals.update((proposals) => {
        const proposal = proposals.find((p) => p.id === proposalId);
        if (!proposal) return proposals;

        // Track rejection in activity
        activityStore.addActivity({
            type: 'proposal_rejected',
            proposalId,
            proposalTitle: proposal.title,
            actor: currentUserValue.name
        });

        return proposals.map((p) =>
            p.id === proposalId
                ? {
                    ...p,
                    state: 'rejected'
                }
                : p
        );
    });
}

// Move proposal to draft state
export function moveProposalToDraft(proposalId: string): void {
    proposals.update(($proposals) => {
        return $proposals.map((p) => {
            if (p.id === proposalId && p.state === 'idea') {
                return {
                    ...p,
                    state: 'draft',
                    details: ''
                };
            }
            return p;
        });
    });
}

// Move proposal from draft to offer
export function moveProposalToOffer(proposalId: string): void {
    proposals.update(($proposals) => {
        return $proposals.map((p) => {
            if (p.id === proposalId && p.state === 'draft' && p.budgetRequested > 0) {
                return { ...p, state: 'offer' };
            }
            return p;
        });
    });
}

export function canVoteOnProposal(proposal: Proposal): boolean {
    return proposal.state === 'offer';
}

// Add activity tracking for new proposals
export function createProposal(proposal: Omit<Proposal, 'id' | 'state' | 'votes'>) {
    const currentUserValue = get(currentUser);
    const newProposal = {
        ...proposal,
        id: crypto.randomUUID(),
        state: 'idea' as const,
        votes: 0,
        benefits: proposal.benefits || '',  // Optional in idea stage
        pain: proposal.pain || '',          // Optional in idea stage
        details: proposal.details || ''
    };

    // Track new proposal in activity
    activityStore.addActivity({
        type: 'proposal_created',
        proposalId: newProposal.id,
        proposalTitle: newProposal.title,
        actor: currentUserValue.name
    });

    proposals.update((proposals) => [...proposals, newProposal]);
    return newProposal.id;
}

// Mock user data for development
const MOCK_USER = {
    name: 'Demo User',
    id: 'demo-user-1',
    email: 'demo@example.com'
};

// Export a function to add a new proposal
export const addProposal = (proposalData: Partial<Proposal>) => {
    console.log('Adding new proposal with data:', proposalData);

    try {
        const newProposal: Proposal = {
            id: `proposal-${Date.now()}`,
            title: proposalData.title || '',
            details: proposalData.details || '',
            benefits: proposalData.benefits || '',
            pain: proposalData.pain || '',
            state: 'idea',
            author: MOCK_USER.name,
            votes: 0,
            budgetRequested: 0
        };
        console.log('Created new proposal object:', newProposal);

        proposals.update(currentProposals => {
            console.log('Current proposals count:', currentProposals.length);
            const updatedProposals = [...currentProposals, newProposal];
            console.log('New proposals count:', updatedProposals.length);
            return updatedProposals;
        });

        console.log('Successfully added proposal:', newProposal.id);
        return newProposal;
    } catch (error) {
        console.error('Error adding proposal:', error);
        throw error;
    }
};

// Helper function to validate proposal for state transition
export function validateProposalForState(proposal: Proposal, targetState: ProposalState): boolean {
    if (targetState === 'draft' && (!proposal.pain || !proposal.benefits)) {
        return false; // Pain and Benefits are required for draft stage
    }
    return true;
}

export const defaultProposal: Proposal = {
    id: '',
    title: '',
    author: '',
    votes: 0,
    pain: '',
    benefits: '',
    details: `## Features & Deliverables
- Feature 1
- Feature 2
- Feature 3

## Time to Realization
[Estimated timeline]

## Definition of Done
- [ ] Milestone 1
- [ ] Milestone 2
- [ ] Milestone 3

## Dependencies
- Dependency 1
- Dependency 2
- Dependency 3`,
    state: 'idea',
    budgetRequested: 0
}; 