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
		startup: string;
		income: number;
	};

	let inspirations: Inspiration[] = [];
	let activities: Activity[] = [];

	const preCalculatedActivities = [
		{ service: 'Video Streaming', name: 'Emma Johnson', amount: 39.99, startup: 'A', income: 12.0 },
		{ service: 'Music Subscription', name: 'Liam Smith', amount: 29.99, startup: 'B', income: 9.0 },
		{
			service: 'Online Shopping Member',
			name: 'Olivia Brown',
			amount: 49.99,
			startup: 'C',
			income: 15.0
		},
		{ service: 'Fitness App', name: 'Noah Davis', amount: 19.99, startup: 'A', income: 6.0 },
		{
			service: 'Language Learning Platform',
			name: 'Ava Wilson',
			amount: 34.99,
			startup: 'B',
			income: 10.5
		},
		{
			service: 'Cloud Storage Service',
			name: 'Ethan Taylor',
			amount: 24.99,
			startup: 'C',
			income: 7.5
		},
		{
			service: 'Online Privacy Tool',
			name: 'Sophia Anderson',
			amount: 14.99,
			startup: 'A',
			income: 4.5
		},
		{
			service: 'Mindfulness Application',
			name: 'Mason Thomas',
			amount: 9.99,
			startup: 'B',
			income: 3.0
		},
		{
			service: 'E-learning Course',
			name: 'Isabella White',
			amount: 59.99,
			startup: 'C',
			income: 18.0
		},
		{
			service: 'Digital Reading Service',
			name: 'James Martin',
			amount: 19.99,
			startup: 'A',
			income: 6.0
		},
		{
			service: 'Meal Planning Service',
			name: 'Charlotte Garcia',
			amount: 29.99,
			startup: 'B',
			income: 9.0
		},
		{
			service: 'Audiobook Platform',
			name: 'Benjamin Martinez',
			amount: 44.99,
			startup: 'C',
			income: 13.5
		},
		{
			service: 'Task Management Tool',
			name: 'Amelia Robinson',
			amount: 54.44,
			startup: 'A',
			income: 16.0
		}
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

		const activity = preCalculatedActivities[inspirations.length];
		const newInspiration = {
			id: inspirations.length,
			x,
			y,
			initials: getInitials(activity.name)
		};

		inspirations = [...inspirations, newInspiration];

		activities = [
			{
				id: activities.length,
				...activity
			},
			...activities.slice(0, 12)
		];

		balance += activity.income;
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
</script>

<div class="flex h-screen bg-surface-900 overflow-hidden">
	<!-- Aside: Balance, Income Stream, and Purchases -->
	<div class="w-1/4 h-full bg-surface-800 p-4 flex flex-col">
		<div class="mb-6">
			<h3 class="text-lg font-semibold text-primary-200">Monthly Income Stream</h3>
			<p class="text-4xl font-bold text-primary-300">€{balance.toFixed(2)}</p>
		</div>

		<div class="mb-6">
			<h3 class="text-lg font-semibold text-primary-200">Stream 1 - Movement Maker</h3>
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
						<span class="text-xs text-green-400">+€{activity.income.toFixed(2)}</span>
					</div>
					<div class="text-xs text-primary-400 mt-1">Startup {activity.startup}</div>
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
