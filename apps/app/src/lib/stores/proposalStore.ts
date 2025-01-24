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

import { writable, derived } from 'svelte/store';

// Types
export type ProposalState =
    | 'idea'
    | 'draft'
    | 'offer'
    | 'pending'
    | 'in_progress'
    | 'review'
    | 'completed'
    | 'rejected';

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
    description: string;
    expectedResults: string;
    commitment: string;
    state: ProposalState;
    estimatedDelivery: string;
    budgetRequested: number;
    tasks?: ProposalTask[];
    draftDetails?: {
        timeToRealization: string;
        definitionOfDone: string;
        risks: string;
        dependencies: string[];
    };
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
        expectedResults: '+500 new signups/month, 40% conversion rate improvement',
        commitment: 'Payment released upon successful deployment with A/B test showing >35% conversion improvement',
        description:
            'High-converting landing page development using SvelteKit and Tailwind.\n\n' +
            'Key Features:\n' +
            '• Interactive components and dynamic content loading\n' +
            '• Mobile-first responsive design\n' +
            '• Personalized user journey flows\n' +
            '• Real-time conversion tracking\n' +
            '• A/B testing infrastructure\n\n' +
            'Following atomic design principles for consistent branding and maximum component reusability.',
        state: 'in_progress',
        estimatedDelivery: '3 weeks',
        budgetRequested: 700
    },
    {
        id: '2',
        title: 'Visioncreator Launch Event',
        author: 'Maria Garcia',
        votes: 3,
        expectedResults: '100+ attendees, 20 new active pioneers, 5 potential partnerships',
        commitment: 'Payment released after successful event completion with minimum 80 verified attendees',
        description:
            'Premium startup networking event to showcase Visioncreator.\n\n' +
            'Event Components:\n' +
            '• Interactive workshops and keynote presentations\n' +
            '• Live platform demonstrations\n' +
            '• Professional video coverage\n' +
            '• Dedicated networking sessions\n\n' +
            'Post-event: Follow-up networking, resource sharing, and community building initiatives.',
        state: 'offer',
        estimatedDelivery: '2 weeks',
        budgetRequested: 1200
    },
    {
        id: '3',
        title: 'Community Task Board Development',
        author: 'Alex Kumar',
        votes: 1,
        expectedResults: '30% improved task completion rate, 50% faster project initialization',
        commitment: 'Payment released upon deployment with all features tested and documented',
        description:
            'Interactive task board development using SvelteKit and Tailwind.\n\n' +
            'Core Features:\n' +
            '• Real-time collaboration with websockets\n' +
            '• Drag-and-drop task management\n' +
            '• Integrated commenting system\n' +
            '• Advanced filtering and priority management\n' +
            '• Mobile responsiveness and offline support',
        state: 'review',
        estimatedDelivery: '4 weeks',
        budgetRequested: 900
    },
    {
        id: '4',
        title: 'Vision Pitch Video Production',
        author: 'Sarah Miller',
        votes: 2,
        expectedResults: '40% better conversion rate, 2x faster onboarding understanding',
        commitment: 'Payment released upon delivery of final video with positive community feedback',
        description:
            'Professional pitch video production for Visioncreator.\n\n' +
            'Deliverables:\n' +
            '• Custom animations and motion graphics\n' +
            '• Professional voice-over recording\n' +
            '• Platform demonstrations and user testimonials\n' +
            '• Multiple platform-optimized versions\n\n' +
            'Including multiple revision rounds and professional sound design.',
        state: 'completed',
        estimatedDelivery: '1 week',
        budgetRequested: 1000
    },
    {
        id: '5',
        title: 'Social Media Brand Update',
        author: 'Sophie Anderson',
        votes: 3,
        expectedResults: '40% increase in profile visits, 25% higher engagement rate',
        commitment: 'Payment released upon completion of all platform updates with community approval',
        description:
            'Comprehensive social media brand refresh across all major platforms.\n\n' +
            'Deliverables:\n' +
            '• Custom banner designs for each platform\n' +
            '• Optimized bio and intro texts\n' +
            '• Brand style guide for social content\n' +
            '• Platform-specific content templates\n' +
            '• Analytics baseline and tracking setup\n\n' +
            'Including A/B testing of different messaging approaches.',
        state: 'offer',
        estimatedDelivery: '1 week',
        budgetRequested: 600
    },
    {
        id: '6',
        title: 'Community Invite System Development',
        author: 'Marcus Chen',
        votes: 2,
        expectedResults: '200% increase in referrals, 40% higher retention of referred users',
        commitment: 'Payment released upon successful deployment and first month of operation',
        description:
            'Gamified invite system with incentive mechanics.\n\n' +
            'Core Features:\n' +
            '• Multi-tier reward structure\n' +
            '• Automated tracking and distribution\n' +
            '• Custom invite links and QR codes\n' +
            '• Referral analytics dashboard\n' +
            '• Integration with existing user system\n\n' +
            'Focus on sustainable growth and quality referrals.',
        state: 'offer',
        estimatedDelivery: '3 weeks',
        budgetRequested: 1400
    },
    {
        id: '7',
        title: 'Governance Model Update',
        author: 'Elena Rodriguez',
        votes: 2,
        expectedResults: '50% faster decision making, 30% higher community participation',
        commitment: 'Payment released after successful implementation and first governance cycle',
        description:
            'Modernized governance system with enhanced participation mechanics.\n\n' +
            'Key Components:\n' +
            '• Streamlined proposal process\n' +
            '• Weighted voting mechanisms\n' +
            '• Automated execution of approved proposals\n' +
            '• Transparent tracking system\n' +
            '• Community feedback loops\n\n' +
            'Including comprehensive documentation and onboarding materials.',
        state: 'offer',
        estimatedDelivery: '4 weeks',
        budgetRequested: 500
    },
    {
        id: '8',
        title: 'Proposal Video Requirement System',
        author: 'Chris Taylor',
        votes: 2,
        expectedResults: '60% better proposal understanding, 45% higher engagement on proposals',
        commitment: 'Payment released upon system implementation and first 5 successful submissions',
        description:
            'Integrated video submission and distribution system for proposals.\n\n' +
            'System Features:\n' +
            '• Video upload and processing pipeline\n' +
            '• Automated social media distribution\n' +
            '• Engagement tracking and analytics\n' +
            '• Video guidelines and templates\n' +
            '• Quality control mechanisms\n\n' +
            'Including creator guidelines and best practices documentation.',
        state: 'offer',
        estimatedDelivery: '2 weeks',
        budgetRequested: 900
    },
    {
        id: '10',
        title: 'Community Newsletter System',
        author: 'Rachel Kim',
        votes: 1,
        expectedResults: 'Increased community engagement and awareness',
        commitment: 'Weekly newsletter delivery with community highlights',
        description:
            'Weekly newsletter system to keep the community informed.\n\n' +
            'Features:\n' +
            '• Automated content aggregation\n' +
            '• Community contribution highlights\n' +
            '• Project updates and milestones\n' +
            '• Upcoming events calendar\n' +
            '• Member spotlights\n\n' +
            'Focus on celebrating community achievements and fostering engagement.',
        state: 'idea',
        estimatedDelivery: '1 week',
        budgetRequested: 400
    },
    {
        id: '11',
        title: 'Community Mentorship Program',
        author: 'David Park',
        votes: 0,
        expectedResults: 'Knowledge sharing and skill development within community',
        commitment: 'Monthly mentorship sessions and progress tracking',
        description:
            'Structured mentorship program connecting experienced members with newcomers.\n\n' +
            'Program Components:\n' +
            '• Mentor-mentee matching system\n' +
            '• Goal setting framework\n' +
            '• Progress tracking tools\n' +
            '• Resource sharing platform\n' +
            '• Success story showcase\n\n' +
            'Building stronger connections through knowledge sharing.',
        state: 'idea',
        estimatedDelivery: '2 weeks',
        budgetRequested: 600
    },
    {
        id: '12',
        title: 'Community Hackathon Event',
        author: 'Lisa Wang',
        votes: 1,
        expectedResults: 'Innovation boost and new project initiatives',
        commitment: 'Weekend-long event with prizes and showcases',
        description:
            '48-hour hackathon focused on community improvements.\n\n' +
            'Event Structure:\n' +
            '• Team formation support\n' +
            '• Project idea workshops\n' +
            '• Mentorship sessions\n' +
            '• Demo presentations\n' +
            '• Prize categories\n\n' +
            'Fostering innovation and collaboration within the community.',
        state: 'idea',
        estimatedDelivery: '3 weeks',
        budgetRequested: 1200
    },
    {
        id: '13',
        title: 'Community Podcast Series',
        author: 'Michael Chen',
        votes: 0,
        expectedResults: 'Broader reach and deeper community insights',
        commitment: 'Bi-weekly episodes featuring community members',
        description:
            'Regular podcast highlighting community stories and insights.\n\n' +
            'Content Focus:\n' +
            '• Member success stories\n' +
            '• Project deep dives\n' +
            '• Industry trends\n' +
            '• Community updates\n' +
            '• Guest interviews\n\n' +
            'Sharing our community story with the world.',
        state: 'idea',
        estimatedDelivery: '2 weeks',
        budgetRequested: 800
    },
    {
        id: '14',
        title: 'Community Learning Hub',
        author: 'Sarah Johnson',
        votes: 1,
        expectedResults: 'Centralized knowledge sharing and skill development',
        commitment: 'Launch with 10 initial courses and weekly updates',
        description:
            'Online learning platform for community skill sharing.\n\n' +
            'Platform Features:\n' +
            '• Course creation tools\n' +
            '• Interactive workshops\n' +
            '• Resource library\n' +
            '• Progress tracking\n' +
            '• Certification system\n\n' +
            'Empowering community growth through education.',
        state: 'idea',
        estimatedDelivery: '4 weeks',
        budgetRequested: 1500
    },
    {
        id: '15',
        title: 'AI Content Generation System',
        author: 'James Wilson',
        votes: 0,
        expectedResults: 'Automated content creation and distribution',
        commitment: 'Delivery of working AI content generation system with API',
        description:
            'AI-powered content generation system for community posts.\n\n' +
            'System Features:\n' +
            '• GPT-4 integration for text generation\n' +
            '• Image generation capabilities\n' +
            '• Content quality filters\n' +
            '• Automated posting schedule\n' +
            '• Performance analytics\n\n' +
            'Rejected due to concerns about AI-generated content quality and authenticity.',
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
    'pending',
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
        .filter((p) => p.state === 'in_progress' || p.state === 'review' || p.state === 'pending')
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

// Update cycleProposalState to handle the new state flow
export function cycleProposalState(proposalId: string): void {
    const states: ProposalState[] = ['in_progress', 'review', 'completed'];
    proposals.update(($proposals) => {
        return $proposals.map((p) => {
            if (p.id === proposalId && p.state !== 'offer' && p.state !== 'idea') {
                const currentIndex = states.indexOf(p.state);
                const nextIndex = (currentIndex + 1) % states.length;
                const nextState = states[nextIndex];

                // If moving to 'in_progress', release votes back to users
                if (nextState === 'in_progress' && isActiveState(p.state)) {
                    currentUser.update(($currentUser) => {
                        const userVotes = $currentUser.proposalsVoted.get(proposalId) || 0;
                        $currentUser.tokens += userVotes;
                        $currentUser.proposalsVoted.delete(proposalId);
                        return $currentUser;
                    });
                }

                return { ...p, state: nextState };
            }
            return p;
        });
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
        case 'pending':
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
        case 'pending':
            return 'mdi:timer-sand';
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
        case 'pending':
            return 'Pending';
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
        case 'pending':
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
            // Move to draft state first when vote threshold is reached
            return {
                ...p,
                state: 'draft' as ProposalState,
                tasks: [],
                draftDetails: {
                    timeToRealization: '',
                    definitionOfDone: '',
                    risks: '',
                    dependencies: []
                }
            };
        } else if (p.state === 'offer') {
            const proposalValue = $proposalValues.find((v) => v.id === p.id)?.value || 0;
            if (proposalValue >= p.budgetRequested) {
                return { ...p, state: 'pending' as ProposalState };
            }
        }
        return p;
    });
}

// Add function to reject a proposal
export function rejectProposal(proposalId: string): void {
    proposals.update(($proposals) => {
        return $proposals.map((p) => {
            if (p.id === proposalId) {
                // Return votes to users if in an active state
                if (isActiveState(p.state)) {
                    currentUser.update(($currentUser) => {
                        const userVotes = $currentUser.proposalsVoted.get(proposalId) || 0;
                        $currentUser.tokens += userVotes;
                        $currentUser.proposalsVoted.delete(proposalId);
                        return $currentUser;
                    });
                }
                return { ...p, state: 'rejected' as ProposalState };
            }
            return p;
        });
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
                    draftDetails: {
                        timeToRealization: '',
                        definitionOfDone: '',
                        risks: '',
                        dependencies: []
                    }
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