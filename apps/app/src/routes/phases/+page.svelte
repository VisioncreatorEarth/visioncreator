<script lang="ts">
	import { onMount } from 'svelte';
	import { tweened } from 'svelte/motion';
	import { cubicOut } from 'svelte/easing';
	import { fade } from 'svelte/transition';

	let progress = tweened(0, {
		duration: 20000,
		easing: cubicOut
	});

	let balanceStream1 = 0;
	let balanceStream2 = 0;
	const targetBalanceStream1 = 130;
	const targetBalanceStream2 = 550;
	const totalNodes = 13;
	const totalStartups = 5;
	let showPhase1 = false;
	let showPhase2 = false;
	let currentPhase = 'PHASE 1: Movement Maker';

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

	type Startup = {
		id: number;
		x: number;
		y: number;
		name: string;
		ownership: number;
	};

	let inspirations: Inspiration[] = [];
	let activities: Activity[] = [];
	let startups: Startup[] = [];

	const preCalculatedActivities = [
		{
			service: 'Video Streaming',
			name: 'Emma Johnson',
			amount: 39.99,
			startup: 'A1',
			income: 12.0
		},
		{
			service: 'Music Subscription',
			name: 'Liam Smith',
			amount: 29.99,
			startup: 'B1',
			income: 9.0
		},
		{
			service: 'Online Shopping Member',
			name: 'Olivia Brown',
			amount: 49.99,
			startup: 'C1',
			income: 15.0
		},
		{ service: 'Fitness App', name: 'Noah Davis', amount: 19.99, startup: 'A2', income: 6.0 },
		{
			service: 'Language Learning Platform',
			name: 'Ava Wilson',
			amount: 34.99,
			startup: 'B2',
			income: 10.5
		},
		{
			service: 'Cloud Storage Service',
			name: 'Ethan Taylor',
			amount: 24.99,
			startup: 'C2',
			income: 7.5
		},
		{
			service: 'Online Privacy Tool',
			name: 'Sophia Anderson',
			amount: 14.99,
			startup: 'A3',
			income: 4.5
		},
		{
			service: 'Mindfulness Application',
			name: 'Mason Thomas',
			amount: 9.99,
			startup: 'B3',
			income: 3.0
		},
		{
			service: 'E-learning Course',
			name: 'Isabella White',
			amount: 59.99,
			startup: 'C3',
			income: 18.0
		},
		{
			service: 'Digital Reading Service',
			name: 'James Martin',
			amount: 19.99,
			startup: 'A4',
			income: 6.0
		},
		{
			service: 'Meal Planning Service',
			name: 'Charlotte Garcia',
			amount: 29.99,
			startup: 'B4',
			income: 9.0
		},
		{
			service: 'Audiobook Platform',
			name: 'Benjamin Martinez',
			amount: 44.99,
			startup: 'C4',
			income: 13.5
		},
		{
			service: 'Task Management Tool',
			name: 'Amelia Robinson',
			amount: 54.44,
			startup: 'A5',
			income: 16.0
		}
	];

	const startupNames = ['TechNova', 'EcoSolutions', 'HealthHub', 'EduTech', 'FinRevolution'];

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
			const distance = Math.random() * 20 + 25;
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
		activities = [{ id: activities.length, ...activity }, ...activities.slice(0, 12)];
		balanceStream1 += activity.income;
		balanceStream1 = Number(balanceStream1.toFixed(2));
	}

	function addStartup() {
		if (startups.length >= totalStartups) return;

		const angle = (startups.length / totalStartups) * 2 * Math.PI;
		const distance = 35;
		const x = 50 + Math.cos(angle) * distance;
		const y = 50 + Math.sin(angle) * distance;

		const newStartup = {
			id: startups.length,
			x,
			y,
			name: startupNames[startups.length],
			ownership: Math.floor(Math.random() * 11) + 5 // Random ownership between 5% and 15%
		};

		startups = [...startups, newStartup];
		balanceStream2 += 110;
		balanceStream2 = Number(balanceStream2.toFixed(2));
	}

	onMount(() => {
		setTimeout(() => {
			showPhase1 = true;
			progress.set(1);
			const phase1Interval = setInterval(() => {
				addInspirationAndActivity();
				if (inspirations.length >= totalNodes) {
					clearInterval(phase1Interval);
					setTimeout(() => {
						showPhase1 = false; // This will trigger the fade-out
						setTimeout(() => {
							showPhase2 = true;
							currentPhase = 'PHASE 2: Co-Owner / Investor';
							const phase2Interval = setInterval(() => {
								addStartup();
								if (startups.length >= totalStartups) {
									clearInterval(phase2Interval);
								}
							}, 2000);
						}, 1000); // Short delay before starting Phase 2
					}, 5000);
				}
			}, 1500);
		}, 2000);
	});
</script>

<div class="flex h-screen bg-surface-900 overflow-hidden">
	<!-- Aside: Balance, Income Streams, and Purchases/Ownership -->
	<div class="w-1/4 h-full bg-surface-800 p-4 flex flex-col">
		<div class="mb-6">
			<h3 class="text-lg font-semibold text-primary-200">Total Income Stream</h3>
			<p class="text-4xl font-bold text-primary-300">
				€{(balanceStream1 + balanceStream2).toFixed(2)} / month
			</p>
		</div>

		<div class="mb-6">
			<h3 class="text-lg font-semibold text-primary-200">Stream 1 - Revenue Share</h3>
			<div class="w-full bg-surface-700 rounded-full h-2.5 mt-2">
				<div
					class="bg-primary-500 h-2.5 rounded-full"
					style="width: {(balanceStream1 / targetBalanceStream1) * 100}%"
				/>
			</div>
			<p class="text-sm text-primary-300 mt-1">€{balanceStream1.toFixed(2)} / month</p>
		</div>

		{#if showPhase2}
			<div class="mb-6" transition:fade={{ duration: 1000 }}>
				<h3 class="text-lg font-semibold text-secondary-300">Stream 2 - Owning Assets</h3>
				<div class="w-full bg-surface-700 rounded-full h-2.5 mt-2">
					<div
						class="bg-secondary-500 h-2.5 rounded-full"
						style="width: {(balanceStream2 / targetBalanceStream2) * 100}%"
					/>
				</div>
				<p class="text-sm text-secondary-300 mt-1">€{balanceStream2.toFixed(2)} / month</p>
			</div>
		{/if}

		{#if showPhase1}
			<div class="mt-4 flex-grow overflow-y-auto" transition:fade={{ duration: 1000 }}>
				<h3 class="text-lg font-semibold text-primary-200 mb-2">Purchases in your network</h3>
				{#each activities as activity (activity.id)}
					<div class="bg-surface-700 rounded-lg p-3 mb-3">
						<div class="text-sm font-semibold text-primary-300 mb-1">
							Startup {activity.startup} - {activity.service}
						</div>
						<div class="text-xs text-primary-400 mb-2">{activity.name}</div>
						<div class="flex justify-between items-center">
							<span class="text-xs text-primary-400">Purchase: €{activity.amount.toFixed(2)}</span>
							<span class="text-xl font-bold text-green-400">+€{activity.income.toFixed(2)}</span>
						</div>
					</div>
				{/each}
			</div>
		{/if}

		{#if showPhase2}
			<div class="mt-4 flex-grow overflow-y-auto" transition:fade={{ duration: 1000 }}>
				<h3 class="text-lg font-semibold text-secondary-300 mb-2">Your Startup Ownership</h3>
				{#each startups as startup (startup.id)}
					<div class="bg-surface-700 rounded-lg p-3 mb-3">
						<div class="text-sm font-semibold text-secondary-300 mb-1">
							{startup.name}
						</div>
						<div class="flex justify-between items-center">
							<span class="text-xs text-secondary-400">Ownership:</span>
							<span class="text-xl font-bold text-secondary-400">{startup.ownership}%</span>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>

	<!-- Main: Inspiration Network Animation -->
	<div class="w-3/4 h-full relative bg-surface-900">
		<!-- Phase Title -->
		<div class="absolute top-4 right-4 text-4xl font-bold text-primary-300">
			{currentPhase}
		</div>

		<!-- Central user node -->
		<div
			class="absolute rounded-full bg-secondary-500 text-white flex items-center justify-center z-20"
			style="left: 50%; top: 50%; width: 100px; height: 100px; transform: translate(-50%, -50%);"
		>
			<span class="text-2xl font-bold">YOU</span>
		</div>

		{#if showPhase1}
			<!-- Connection lines -->
			<svg
				class="absolute top-0 left-0 w-full h-full pointer-events-none"
				transition:fade={{ duration: 1000 }}
			>
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

			<!-- Inspiration nodes -->
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
					transition:fade={{ duration: 1000 }}
				>
					{inspiration.initials}
				</div>
			{/each}
		{/if}

		{#if showPhase2}
			{#each startups as startup (startup.id)}
				<!-- Startup node -->
				<div
					class="absolute rounded-full bg-tertiary-500 z-10 flex items-center justify-center text-white text-xs font-bold"
					style="
                        left: {startup.x}%;
                        top: {startup.y}%;
                        width: 80px;
                        height: 80px;
                        transform: translate(-50%, -50%);
                     "
					transition:fade={{ duration: 1000 }}
				>
					{startup.name}
				</div>

				<!-- Animated bubbles -->
				<div class="absolute" style="left: {startup.x}%; top: {startup.y}%;">
					{#each Array(5) as _, i}
						<div
							class="absolute rounded-full bg-tertiary-300 w-2 h-2"
							style="
                                animation: moveBubble 3s linear infinite;
                                animation-delay: {i * 0.6}s;
                             "
						/>
					{/each}
				</div>
			{/each}
		{/if}
	</div>
</div>

<style lang="postcss">
	@keyframes moveBubble {
		0% {
			transform: translate(0, 0);
		}
		100% {
			transform: translate(calc((50vw - 50%) * 0.75), calc((50vh - 50%) * 0.75));
		}
	}

	:global(body) {
		@apply bg-surface-900 m-0 p-0;
	}
</style>
