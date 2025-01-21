import { writable, derived } from 'svelte/store';

interface MilestoneConfig {
    totalFounders: number;        // 144 (final Fibonacci target)
    currentFounders: number;      // current number of secured VCs
}

const FIBONACCI_MILESTONES = [1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144];

function createMilestoneStore() {
    const store = writable<MilestoneConfig>({
        totalFounders: 144,
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