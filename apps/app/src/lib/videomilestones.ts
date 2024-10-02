export type VideoMilestone = {
	value: number;
	x: number;
	y: number;
	size: number;
};

export const videoFibonacciSequence = [
	1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233, 377, 610, 987, 1597, 2584, 4181, 6765, 10946
];

function fibonacciPosition(
	index: number,
	totalItems: number
): { x: number; y: number; size: number } {
	const goldenRatio = (1 + Math.sqrt(5)) / 2;
	const angle = index * 2 * Math.PI * goldenRatio;
	const radius = Math.sqrt(index / totalItems);

	return {
		x: 50 + 45 * radius * Math.cos(angle),
		y: 50 + 45 * radius * Math.sin(angle),
		size: 100 * (1 - index / totalItems) + 10
	};
}

export const videoMilestones: VideoMilestone[] = videoFibonacciSequence.map((value, index) => ({
	value,
	...fibonacciPosition(index, videoFibonacciSequence.length)
}));
