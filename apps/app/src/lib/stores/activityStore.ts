/*
HOW THIS STORE WORKS:

This store manages the activity stream for the application:
- Tracks proposal state changes
- Records user actions
- Maintains activity history
- Provides formatted activity messages
*/

import { writable } from 'svelte/store';
import type { ProposalState } from './proposalStore';

export interface Activity {
    id: string;
    timestamp: Date;
    type: 'state_change' | 'proposal_created' | 'proposal_updated' | 'proposal_rejected';
    proposalId: string;
    proposalTitle: string;
    actor: string;
    previousState?: ProposalState;
    newState?: ProposalState;
    details?: string;
}

function createActivityStore() {
    const { subscribe, set, update } = writable<Activity[]>([]);

    return {
        subscribe,
        addActivity: (activity: Omit<Activity, 'id' | 'timestamp'>) => {
            update(activities => [
                {
                    ...activity,
                    id: crypto.randomUUID(),
                    timestamp: new Date()
                },
                ...activities
            ]);
        },
        formatActivity: (activity: Activity): string => {
            switch (activity.type) {
                case 'state_change':
                    return `${activity.actor} moved "${activity.proposalTitle}" from ${activity.previousState} to ${activity.newState}`;
                case 'proposal_created':
                    return `${activity.actor} created a new proposal "${activity.proposalTitle}"`;
                case 'proposal_updated':
                    return `${activity.actor} updated proposal "${activity.proposalTitle}"`;
                case 'proposal_rejected':
                    return `${activity.actor} rejected proposal "${activity.proposalTitle}"`;
                default:
                    return '';
            }
        },
        clear: () => {
            set([]);
        }
    };
}

export const activityStore = createActivityStore(); 