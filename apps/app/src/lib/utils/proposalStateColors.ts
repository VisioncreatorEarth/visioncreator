import type { ProposalState } from '$lib/types/proposals';

export function getStateColor(state: ProposalState): string {
    switch (state) {
        case 'idea':
            return 'text-secondary-300';
        case 'draft':
            return 'text-teal-300';
        case 'pending':
            return 'text-primary-300';
        case 'accepted':
            return 'text-success-400';
        case 'rejected':
            return 'text-error-400';
        default:
            return 'text-surface-400';
    }
}

export function getStateBgColor(state: ProposalState): string {
    switch (state) {
        case 'idea':
            return 'bg-secondary-500/10';
        case 'draft':
            return 'bg-teal-500/10';
        case 'pending':
            return 'bg-primary-500/10';
        case 'accepted':
            return 'bg-success-500/10';
        case 'rejected':
            return 'bg-error-500/10';
        default:
            return 'bg-surface-800';
    }
}

export function getStateHoverBgColor(state: ProposalState): string {
    switch (state) {
        case 'idea':
            return 'hover:bg-secondary-500/20';
        case 'draft':
            return 'hover:bg-teal-500/20';
        case 'pending':
            return 'hover:bg-primary-500/20';
        case 'accepted':
            return 'hover:bg-success-500/20';
        case 'rejected':
            return 'hover:bg-error-500/20';
        default:
            return 'hover:bg-surface-700';
    }
}

export function getStateActiveBgColor(state: ProposalState): string {
    switch (state) {
        case 'idea':
            return 'bg-secondary-500/20';
        case 'draft':
            return 'bg-teal-500/20';
        case 'pending':
            return 'bg-primary-500/20';
        case 'accepted':
            return 'bg-success-500/20';
        case 'rejected':
            return 'bg-error-500/20';
        default:
            return 'bg-surface-700';
    }
}

export function getStateIcon(state: ProposalState): string {
    switch (state) {
        case 'idea':
            return 'heroicons:light-bulb';
        case 'draft':
            return 'heroicons:document-text';
        case 'pending':
            return 'heroicons:clock';
        case 'accepted':
            return 'heroicons:check-circle';
        case 'rejected':
            return 'heroicons:x-circle';
        default:
            return 'heroicons:question-mark-circle';
    }
}

export function getStateLabel(state: ProposalState): string {
    return state.charAt(0).toUpperCase() + state.slice(1);
} 