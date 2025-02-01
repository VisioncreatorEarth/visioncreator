// This store manages the milestone system for VisionCreator, tracking progress through Fibonacci-based circles
// Each circle represents a milestone with increasing number of founders needed
// The sequence is designed to grow organically up to ~1.3 million founders

import { writable, derived } from 'svelte/store';

interface MilestoneConfig {
    totalFounders: number;        // 1346269 (final Fibonacci target near 1.3 million)
    currentFounders: number;      // current number of secured VCs
}

// Fibonacci sequence up to ~1.3 million
const FIBONACCI_MILESTONES = [1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233, 377, 610, 987, 1597, 2584, 4181, 6765, 10946, 17711, 28657, 46368, 75025, 121393, 196418, 317811, 514229, 832040, 1346269];

function createMilestoneStore() {
    const store = writable<MilestoneConfig>({
        totalFounders: 1346269,
        currentFounders: 18
    });

    const derivedValues = derived(store, ($store) => {
        const currentCircle = FIBONACCI_MILESTONES.findIndex(n => n > $store.currentFounders) + 1;
        const currentTarget = FIBONACCI_MILESTONES[currentCircle - 1];
        const previousTotal = currentCircle > 1 ? FIBONACCI_MILESTONES[currentCircle - 2] : 0;
        const seatsInCurrentCircle = currentTarget - previousTotal;
        const spotsInCurrentCircle = $store.currentFounders - previousTotal;
        const remainingSeats = currentTarget - $store.currentFounders;
        const progressPercentage = (spotsInCurrentCircle / seatsInCurrentCircle) * 100;

        return {
            currentCircle,
            remainingSeats,
            progressPercentage,
            circles: FIBONACCI_MILESTONES.map((_, index) => index + 1),
            isCircleFilled: (circle: number) => circle < currentCircle,
            currentTarget,
            seatsInCurrentCircle,
            spotsInCurrentCircle,
            totalFounders: $store.totalFounders,
            currentFounders: $store.currentFounders
        };
    });

    return {
        subscribe: derivedValues.subscribe,
        updateFounders: (count: number) => {
            store.update(state => ({ ...state, currentFounders: count }));
        }
    };
}

export const milestoneStore = createMilestoneStore(); 