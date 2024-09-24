// Types
export type Milestone = {
	value: number;
	poolAmount: number;
	provisionPercentage: number;
	startupFund?: number;
	platformFeeAmount?: number;
	vcPool?: number;
};

export type User = {
	name: string;
	identifier: string;
	timestamp: Date;
	earnings: number;
};

// Data
export const fibonacciSequence = [
	1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233, 377, 610, 987, 1597, 2584, 4181, 6765, 10946, 17711,
	28657, 46368, 75025, 121393, 196418, 317811, 514229, 832040, 1346269, 2178309, 3524578, 5702887,
	9227465, 14930352, 24157817, 39088169, 63245986, 102334155, 165580141, 267914296, 433494437,
	701408733, 1134903170
];

export const randomUsers: User[] = [
	{ name: 'Alice Johnson', identifier: 'alice_j', timestamp: new Date(), earnings: 5 },
	{ name: 'Bob Smith', identifier: 'bob_s', timestamp: new Date(), earnings: 10 },
	{ name: 'Charlie Brown', identifier: 'charlie_b', timestamp: new Date(), earnings: 15 },
	{ name: 'Diana Prince', identifier: 'diana_p', timestamp: new Date(), earnings: 20 },
	{ name: 'Ethan Hunt', identifier: 'ethan_h', timestamp: new Date(), earnings: 25 },
	{ name: 'Fiona Apple', identifier: 'fiona_a', timestamp: new Date(), earnings: 30 },
	{ name: 'George Lucas', identifier: 'george_l', timestamp: new Date(), earnings: 35 },
	{ name: 'Hannah Montana', identifier: 'hannah_m', timestamp: new Date(), earnings: 40 },
	{ name: 'Ian McKellen', identifier: 'ian_m', timestamp: new Date(), earnings: 45 },
	{ name: 'Julia Roberts', identifier: 'julia_r', timestamp: new Date(), earnings: 50 },
	{ name: 'Kevin Bacon', identifier: 'kevin_b', timestamp: new Date(), earnings: 55 },
	{ name: 'Lara Croft', identifier: 'lara_c', timestamp: new Date(), earnings: 60 },
	{ name: 'Michael Jordan', identifier: 'michael_j', timestamp: new Date(), earnings: 65 },
	{ name: 'Natalie Portman', identifier: 'natalie_p', timestamp: new Date(), earnings: 70 },
	{ name: 'Olivia Wilde', identifier: 'olivia_w', timestamp: new Date(), earnings: 75 },
	{ name: 'Peter Parker', identifier: 'peter_p', timestamp: new Date(), earnings: 80 },
	{ name: 'Quentin Tarantino', identifier: 'quentin_t', timestamp: new Date(), earnings: 85 },
	{ name: 'Robert Downey Jr.', identifier: 'robert_d', timestamp: new Date(), earnings: 90 },
	{ name: 'Sarah Connor', identifier: 'sarah_c', timestamp: new Date(), earnings: 95 },
	{ name: 'Tom Hanks', identifier: 'tom_h', timestamp: new Date(), earnings: 100 },
	{ name: 'Uma Thurman', identifier: 'uma_t', timestamp: new Date(), earnings: 105 },
	{ name: 'Vincent Vega', identifier: 'vincent_v', timestamp: new Date(), earnings: 110 },
	{ name: 'Walter White', identifier: 'walter_w', timestamp: new Date(), earnings: 115 },
	{ name: 'Xavier Charles', identifier: 'xavier_c', timestamp: new Date(), earnings: 120 },
	{ name: 'Yoda', identifier: 'yoda', timestamp: new Date(), earnings: 125 }
];

// Utils
export function formatCurrency(amount: number): string {
	return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EUR' }).format(amount);
}

export function getProgressPercentage(
	milestone: number,
	previousMilestone: number,
	visioncreators: number
): number {
	if (visioncreators >= milestone) return 100;
	if (visioncreators <= previousMilestone) return 0;
	return Math.floor(((visioncreators - previousMilestone) / (milestone - previousMilestone)) * 100);
}
