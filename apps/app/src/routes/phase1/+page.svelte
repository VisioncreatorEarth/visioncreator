<script lang="ts">
	import { onMount } from 'svelte';
	import { tweened } from 'svelte/motion';
	import { cubicOut } from 'svelte/easing';

	let progress = tweened(0, {
		duration: 20000,
		easing: cubicOut
	});

	let balance = 0;
	const targetBalance = 130;
	const totalNodes = 13;

	type Inspiration = {
		id: number;
		x: number;
		y: number;
		initials: string;
	};

	type Activity = {
		id: number;
		amount: number;
		service: string;
		name: string;
	};

	let inspirations: Inspiration[] = [];
	let activities: Activity[] = [];

	const services = [
		{ service: 'Video Streaming', name: 'Emma Johnson' },
		{ service: 'Music Subscription', name: 'Liam Smith' },
		{ service: 'Online Shopping Member', name: 'Olivia Brown' },
		{ service: 'Fitness App', name: 'Noah Davis' },
		{ service: 'Language Learning Platform', name: 'Ava Wilson' },
		{ service: 'Cloud Storage Service', name: 'Ethan Taylor' },
		{ service: 'Online Privacy Tool', name: 'Sophia Anderson' },
		{ service: 'Mindfulness Application', name: 'Mason Thomas' },
		{ service: 'E-learning Course', name: 'Isabella White' },
		{ service: 'Digital Reading Service', name: 'James Martin' },
		{ service: 'Meal Planning Service', name: 'Charlotte Garcia' },
		{ service: 'Audiobook Platform', name: 'Benjamin Martinez' },
		{ service: 'Task Management Tool', name: 'Amelia Robinson' }
	];

	function getInitials(name: string): string {
		return name
			.split(' ')
			.map((n) => n[0])
			.join('')
			.substr(0, 3);
	}

	function checkOverlap(x: number, y: number): boolean {
		return inspirations.some(
			(insp) => Math.sqrt(Math.pow(insp.x - x, 2) + Math.pow(insp.y - y, 2)) < 15
		);
	}

	function addInspirationAndActivity() {
		if (inspirations.length >= totalNodes) return;

		let x: number, y: number;
		do {
			const angle = Math.random() * 2 * Math.PI;
			const distance = Math.random() * 20 + 25; // Random distance between 25% and 45%
			x = 50 + Math.cos(angle) * distance;
			y = 50 + Math.sin(angle) * distance;
		} while (checkOverlap(x, y));

		const service = services[inspirations.length];
		const newInspiration = {
			id: inspirations.length,
			x,
			y,
			initials: getInitials(service.name)
		};

		inspirations = [...inspirations, newInspiration];

		const remainingBalance = targetBalance - balance;
		const remainingNodes = totalNodes - inspirations.length;
		const averageAmount = remainingBalance / remainingNodes;
		const minAmount = Math.max(10, averageAmount * 0.5);
		const maxAmount = Math.min(100, averageAmount * 1.5);

		const amount =
			inspirations.length === totalNodes
				? remainingBalance
				: Math.random() * (maxAmount - minAmount) + minAmount;

		const roundedAmount = Number(amount.toFixed(2));

		activities = [
			{
				id: activities.length,
				amount: roundedAmount,
				service: service.service,
				name: service.name
			},
			...activities.slice(0, 12)
		];

		balance += roundedAmount * 0.3;
		balance = Number(balance.toFixed(2));
	}

	onMount(() => {
		progress.set(1);
		const interval = setInterval(() => {
			addInspirationAndActivity();
			if (inspirations.length >= totalNodes) {
				clearInterval(interval);
			}
		}, 1500);

		return () => clearInterval(interval);
	});

	$: monthlyBalance = ((balance * 30) / 13).toFixed(2);
</script>

<div class="flex h-screen bg-surface-900 overflow-hidden">
	<!-- Aside: Balance, Income Stream, and Purchases -->
	<div class="w-1/4 h-full bg-surface-800 p-4 flex flex-col">
		<div class="mb-6">
			<h3 class="text-lg font-semibold text-primary-200">Balance</h3>
			<p class="text-3xl font-bold text-primary-300">€{balance.toFixed(2)}</p>
			<p class="text-sm text-primary-400">€{monthlyBalance} / month</p>
		</div>

		<div class="mb-6">
			<h3 class="text-lg font-semibold text-primary-200">Income Stream 1</h3>
			<div class="w-full bg-surface-700 rounded-full h-2.5 mt-2">
				<div
					class="bg-primary-500 h-2.5 rounded-full"
					style="width: {(balance / targetBalance) * 100}%"
				/>
			</div>
		</div>

		<div class="mt-4 flex-grow overflow-y-auto">
			<h3 class="text-lg font-semibold text-primary-200 mb-2">Recent Purchases</h3>
			{#each activities as activity (activity.id)}
				<div class="bg-surface-700 rounded-lg p-2 mb-2">
					<div class="text-sm font-semibold text-primary-300">{activity.service}</div>
					<div class="text-xs text-primary-400">{activity.name}</div>
					<div class="flex justify-between items-center mt-1">
						<span class="text-xs text-primary-400">Purchase: €{activity.amount.toFixed(2)}</span>
						<span class="text-xs text-green-400">+€{(activity.amount * 0.3).toFixed(2)}</span>
					</div>
				</div>
			{/each}
		</div>
	</div>

	<!-- Main: Inspiration Network Animation -->
	<div class="w-3/4 h-full relative bg-surface-900">
		<!-- Connection lines -->
		<svg class="absolute top-0 left-0 w-full h-full pointer-events-none">
			{#each inspirations as inspiration (inspiration.id)}
				<line
					x1="50%"
					y1="50%"
					x2="{inspiration.x}%"
					y2="{inspiration.y}%"
					stroke="rgba(167, 139, 250, 0.3)"
					stroke-width="2"
				/>
			{/each}
		</svg>

		<!-- Central user node -->
		<div
			class="absolute rounded-full bg-secondary-500 text-white flex items-center justify-center z-20"
			style="left: 50%; top: 50%; width: 100px; height: 100px; transform: translate(-50%, -50%);"
		>
			You
		</div>

		{#each inspirations as inspiration (inspiration.id)}
			<div
				class="absolute rounded-full bg-primary-500 z-10 flex items-center justify-center text-white text-xs font-bold"
				style="
                    left: {inspiration.x}%;
                    top: {inspiration.y}%;
                    width: 60px;
                    height: 60px;
                    transform: translate(-50%, -50%);
                    transition: all 0.5s ease-out;
                    opacity: {$progress};
                 "
			>
				{inspiration.initials}
			</div>
		{/each}
	</div>
</div>

<style lang="postcss">
	:global(body) {
		@apply bg-surface-900 m-0 p-0;
	}
</style>
