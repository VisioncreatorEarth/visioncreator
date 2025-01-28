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
export type ProposalState = 'idea' | 'draft' | 'offer' | 'decision' | 'in_progress' | 'review' | 'active' | 'completed' | 'rejected';

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
    details: string;  // Markdown-enabled document containing all proposal information
    benefits?: string;  // Required after idea stage
    pain?: string;      // Required after idea stage
    state: ProposalState;
    estimatedDelivery: string;
    budgetRequested: number;
    responsible?: string;
    tasks?: ProposalTask[];
    isPinned?: boolean;
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
    votingPool: number;
    lockedPool: number;
    deliveredPool: number;
    totalActiveVotes: number;
}

// Initial Data
const initialProposals: Proposal[] = [
    {
        id: '1',
        title: 'Modern Landing Page Development',
        author: 'David Chen',
        votes: 2,
        benefits: '+500 new signups/month, 40% conversion rate improvement',
        pain: 'Current landing page has poor conversion and is not mobile-friendly',
        details: `## Key Features
- Interactive components and dynamic content loading
- Mobile-first responsive design
- Personalized user journey flows
- Real-time conversion tracking
- A/B testing infrastructure

Following atomic design principles for consistent branding and maximum component reusability.

## Time to Realization
3-4 weeks

## Definition of Done
- [ ] All features implemented and tested
- [ ] Mobile responsiveness verified
- [ ] A/B testing setup complete
- [ ] Performance metrics baseline established

## Dependencies
- Design system completion
- Analytics integration
- Content management system`,
        state: 'in_progress',
        estimatedDelivery: '3 weeks',
        budgetRequested: 700
    },
    {
        id: '2',
        title: 'Visioncreator Launch Event',
        author: 'Maria Garcia',
        votes: 3,
        benefits: '100+ attendees, 20 new active pioneers, 5 potential partnerships',
        pain: 'Need for stronger community engagement and real-world connections',
        details: `## Event Components
- Interactive workshops and keynote presentations
- Live platform demonstrations
- Professional video coverage
- Dedicated networking sessions

Post-event: Follow-up networking, resource sharing, and community building initiatives.

## Time to Realization
2-3 weeks

## Definition of Done
- [ ] Minimum 80 verified attendees
- [ ] At least 3 keynote speakers confirmed
- [ ] Venue and catering arranged
- [ ] Recording and streaming setup ready

## Dependencies
- Venue availability
- Speaker confirmations
- Marketing materials`,
        state: 'offer',
        estimatedDelivery: '2 weeks',
        budgetRequested: 1200
    },
    {
        id: '3',
        title: 'Community Task Board Development',
        author: 'Alex Kumar',
        votes: 1,
        benefits: '30% improved task completion rate, 50% faster project initialization',
        pain: 'Lack of centralized task management and progress tracking',
        details: `## Core Features
- Real-time collaboration with websockets
- Drag-and-drop task management
- Integrated commenting system
- Advanced filtering and priority management
- Mobile responsiveness and offline support

## Time to Realization
4-5 weeks

## Definition of Done
- [ ] All features implemented and tested
- [ ] Real-time updates working
- [ ] Mobile responsiveness verified
- [ ] Performance benchmarks met

## Dependencies
- Authentication system
- WebSocket infrastructure
- Storage solution`,
        state: 'review',
        estimatedDelivery: '4 weeks',
        budgetRequested: 900
    },
    {
        id: '4',
        title: 'Vision Pitch Video Production',
        author: 'Sarah Miller',
        votes: 2,
        benefits: '40% better conversion rate, 2x faster onboarding understanding',
        pain: 'Complex platform features are hard to explain through text alone',
        details: `## Deliverables
- Custom animations and motion graphics
- Professional voice-over recording
- Platform demonstrations and user testimonials
- Multiple platform-optimized versions

Including multiple revision rounds and professional sound design.

## Time to Realization
1-2 weeks

## Definition of Done
- [ ] Final video approved by community
- [ ] All platform versions delivered
- [ ] Source files archived
- [ ] Usage guidelines documented

## Dependencies
- Brand guidelines
- Platform feature list
- User testimonials`,
        state: 'completed',
        estimatedDelivery: '1 week',
        budgetRequested: 1000
    },
    {
        id: '5',
        title: 'Social Media Brand Update',
        author: 'Sophie Anderson',
        votes: 3,
        benefits: '40% increase in profile visits, 25% higher engagement rate',
        pain: 'Inconsistent brand presence across social media platforms',
        details: `## Deliverables
- Custom banner designs for each platform
- Optimized bio and intro texts
- Brand style guide for social content
- Platform-specific content templates
- Analytics baseline and tracking setup

Including A/B testing of different messaging approaches.

## Time to Realization
1-2 weeks

## Definition of Done
- [ ] All platform profiles updated
- [ ] Style guide approved
- [ ] Templates tested
- [ ] Analytics tracking live

## Dependencies
- Brand guidelines
- Platform access
- Content strategy`,
        state: 'offer',
        estimatedDelivery: '1 week',
        budgetRequested: 600
    },
    {
        id: '6',
        title: 'Community Invite System Development',
        author: 'Marcus Chen',
        votes: 2,
        benefits: '200% increase in referrals, 40% higher retention of referred users',
        pain: 'Current referral process is manual and lacks incentives',
        details: `## Core Features
- Multi-tier reward structure
- Automated tracking and distribution
- Custom invite links and QR codes
- Referral analytics dashboard
- Integration with existing user system

Focus on sustainable growth and quality referrals.

## Time to Realization
3-4 weeks

## Definition of Done
- [ ] Reward system implemented
- [ ] Tracking system tested
- [ ] Analytics dashboard live
- [ ] Integration complete

## Dependencies
- User authentication
- Payment system
- Analytics setup`,
        state: 'offer',
        estimatedDelivery: '3 weeks',
        budgetRequested: 1400
    },
    {
        id: '7',
        title: 'Governance Model Update',
        author: 'Elena Rodriguez',
        votes: 2,
        benefits: '50% faster decision making, 30% higher community participation',
        pain: 'Current governance process is slow and has low participation',
        details: `## Key Components
- Streamlined proposal process
- Weighted voting mechanisms
- Automated execution of approved proposals
- Transparent tracking system
- Community feedback loops

Including comprehensive documentation and onboarding materials.

## Time to Realization
4-5 weeks

## Definition of Done
- [ ] All mechanisms implemented
- [ ] Documentation complete
- [ ] Community tested
- [ ] First governance cycle run

## Dependencies
- Community consensus
- Technical infrastructure
- Documentation system`,
        state: 'offer',
        estimatedDelivery: '4 weeks',
        budgetRequested: 500
    },
    {
        id: '8',
        title: 'Proposal Video Requirement System',
        author: 'Chris Taylor',
        votes: 2,
        benefits: '60% better proposal understanding, 45% higher engagement on proposals',
        pain: 'Text-only proposals are hard to understand and engage with',
        details: `## System Features
- Video upload and processing pipeline
- Automated social media distribution
- Engagement tracking and analytics
- Video guidelines and templates
- Quality control mechanisms

Including creator guidelines and best practices documentation.

## Time to Realization
2-3 weeks

## Definition of Done
- [ ] Upload system working
- [ ] Distribution automated
- [ ] Analytics implemented
- [ ] Guidelines published

## Dependencies
- Storage solution
- Processing service
- Social media APIs`,
        state: 'offer',
        estimatedDelivery: '2 weeks',
        budgetRequested: 900
    },
    {
        id: '13',
        title: 'Community Podcast Series',
        author: 'Michael Chen',
        votes: 0,
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
        estimatedDelivery: '2 weeks',
        budgetRequested: 800
    },
    {
        id: '14',
        title: 'Community Learning Hub',
        author: 'Sarah Johnson',
        votes: 1,
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
        estimatedDelivery: '4 weeks',
        budgetRequested: 1500
    },
    {
        id: '15',
        title: 'AI Content Generation System',
        author: 'James Wilson',
        votes: 0,
        benefits: 'Automated content creation and distribution',
        pain: 'Manual content creation is time-consuming and inconsistent',
        details: `## System Features
- GPT-4 integration for text generation
- Image generation capabilities
- Content quality filters
- Automated posting schedule
- Performance analytics

Rejected due to concerns about AI-generated content quality and authenticity.

## Time to Realization
6-8 weeks

## Definition of Done
- [ ] API integration complete
- [ ] Quality filters tested
- [ ] Posting system automated
- [ ] Analytics dashboard ready

## Dependencies
- GPT-4 API access
- Content guidelines
- Moderation system`,
        state: 'rejected',
        estimatedDelivery: '6 weeks',
        budgetRequested: 2500
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

// Update the tab order to include draft state
export const PROPOSAL_TABS: ProposalState[] = [
    'idea',
    'draft',
    'offer',
    'decision',
    'in_progress',
    'review',
    'completed',
    'rejected'
];

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

// Store Actions
export function getNextVoteCost(currentVotes: number): number {
    return (currentVotes + 1) * (currentVotes + 1) - currentVotes * currentVotes;
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
        draft: 'offer',
        offer: 'decision',
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
            return 'text-blue-300';
        case 'offer':
            return 'text-surface-200';
        case 'decision':
            return 'text-tertiary-500';
        case 'in_progress':
            return 'text-primary-400';
        case 'review':
            return 'text-secondary-400';
        case 'completed':
            return 'text-success-400';
        case 'rejected':
            return 'text-error-400';
        default:
            return 'text-tertiary-300';
    }
}

export function getStateIcon(state: ProposalState): string {
    switch (state) {
        case 'idea':
            return 'mdi:lightbulb';
        case 'draft':
            return 'mdi:file-document-edit';
        case 'offer':
            return 'mdi:handshake';
        case 'decision':
            return 'mdi:gavel';
        case 'in_progress':
            return 'mdi:progress-wrench';
        case 'review':
            return 'mdi:clipboard-check';
        case 'completed':
            return 'mdi:check-circle';
        case 'rejected':
            return 'mdi:close-circle';
        default:
            return 'mdi:help-circle';
    }
}

export function getStateLabel(state: ProposalState): string {
    switch (state) {
        case 'idea':
            return 'Ideas';
        case 'draft':
            return 'Drafts';
        case 'offer':
            return 'Offers';
        case 'decision':
            return 'Decision';
        case 'in_progress':
            return 'In Progress';
        case 'review':
            return 'Reviews';
        case 'completed':
            return 'Completed';
        case 'rejected':
            return 'Rejected';
        default:
            return 'Unknown';
    }
}

export function getStateBgColor(state: ProposalState): string {
    switch (state) {
        case 'idea':
            return 'bg-blue-900/20';
        case 'offer':
            return 'bg-surface-600/20';
        case 'decision':
            return 'bg-tertiary-300/10';
        case 'in_progress':
            return 'bg-primary-900/20';
        case 'review':
            return 'bg-secondary-900/20';
        case 'completed':
            return 'bg-success-900/20';
        case 'rejected':
            return 'bg-error-900/20';
        default:
            return 'bg-tertiary-500/10';
    }
}

// Update state transition logic
export function checkProposalStateTransitions($proposals: Proposal[], voteThreshold: number, $proposalValues: { id: string; value: number }[]): Proposal[] {
    const totalVotes = $proposals
        .filter((p) => isActiveState(p.state))
        .reduce((sum, p) => sum + p.votes, 0);

    return $proposals.map((p) => {
        if (p.state === 'idea' && p.votes >= voteThreshold && totalVotes >= MIN_TOTAL_VOTES_FOR_PROPOSAL) {
            // Track state change in activity stream
            activityStore.addActivity({
                type: 'state_change',
                proposalId: p.id,
                proposalTitle: p.title,
                actor: 'System',
                previousState: 'idea',
                newState: 'draft'
            });

            // Move to draft state first when vote threshold is reached
            return {
                ...p,
                state: 'draft' as ProposalState,
                tasks: [],
                details: ''
            };
        } else if (p.state === 'offer') {
            const proposalValue = $proposalValues.find((v) => v.id === p.id)?.value || 0;
            if (proposalValue >= p.budgetRequested) {
                return { ...p, state: 'decision' as ProposalState };
            }
        }
        return p;
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
                    tasks: [],
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
            budgetRequested: 0,
            estimatedDelivery: proposalData.estimatedDelivery || ''
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
    estimatedDelivery: '',
    budgetRequested: 0
}; 