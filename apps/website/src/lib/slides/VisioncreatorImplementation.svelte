<script>
	import { onMount } from 'svelte';

	let revealed = false;
	let detailsRevealed = false;
	let structureRevealed = false;

	onMount(() => {
		setTimeout(() => {
			revealed = true;
			setTimeout(() => {
				detailsRevealed = true;
				setTimeout(() => {
					structureRevealed = true;
				}, 600);
			}, 600);
		}, 400);
	});
</script>

<div class="slide-content flex h-full flex-col items-center justify-center p-8">
	<div class="mx-auto w-full max-w-5xl">
		<!-- Main heading -->
		<div
			class="mb-10 transform text-center transition-all duration-700 {revealed
				? 'translate-y-0 opacity-100'
				: 'translate-y-12 opacity-0'}"
		>
			<h2 class="mb-4 text-5xl font-bold tracking-tight md:text-6xl">REAL-WORLD IMPLEMENTATION</h2>
			<p class="mx-auto max-w-3xl text-xl text-gray-300 md:text-2xl">
				How Visioncreator works in practice
			</p>
		</div>

		<!-- Implementation Details -->
		<div class="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
			<!-- Legal Structure -->
			<div
				class="transform rounded-xl border border-slate-700 bg-gradient-to-br from-slate-800 to-slate-900 p-6 shadow-lg transition-all duration-700 {detailsRevealed
					? 'translate-y-0 opacity-100'
					: 'translate-y-12 opacity-0'}"
				style="transition-delay: 100ms;"
			>
				<div class="mb-4 flex items-center">
					<div class="mr-4 flex h-10 w-10 items-center justify-center rounded-full bg-cyan-500">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-6 w-6 text-white"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"
							/>
						</svg>
					</div>
					<h3 class="text-2xl font-bold text-cyan-400">Legal Structure</h3>
				</div>
				<div class="pl-14">
					<p class="mb-2 text-gray-300">Tokenized German GmbH using tokenize-it</p>
					<p class="text-sm text-gray-400">
						Combines legal protection with blockchain innovation, ensuring compliance while enabling
						decentralization
					</p>
				</div>
			</div>

			<!-- Token System -->
			<div
				class="transform rounded-xl border border-slate-700 bg-gradient-to-br from-slate-800 to-slate-900 p-6 shadow-lg transition-all duration-700 {detailsRevealed
					? 'translate-y-0 opacity-100'
					: 'translate-y-12 opacity-0'}"
				style="transition-delay: 200ms;"
			>
				<div class="mb-4 flex items-center">
					<div class="mr-4 flex h-10 w-10 items-center justify-center rounded-full bg-amber-500">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-6 w-6 text-white"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
							/>
						</svg>
					</div>
					<h3 class="text-2xl font-bold text-amber-400">VCR Token</h3>
				</div>
				<div class="pl-14">
					<p class="mb-2 text-gray-300">ETH-based token representing ownership</p>
					<p class="text-sm text-gray-400">
						€365 one-time buy-in with token reward, making ownership accessible while ensuring
						commitment
					</p>
				</div>
			</div>

			<!-- Governance -->
			<div
				class="transform rounded-xl border border-slate-700 bg-gradient-to-br from-slate-800 to-slate-900 p-6 shadow-lg transition-all duration-700 {structureRevealed
					? 'translate-y-0 opacity-100'
					: 'translate-y-12 opacity-0'}"
				style="transition-delay: 300ms;"
			>
				<div class="mb-4 flex items-center">
					<div class="mr-4 flex h-10 w-10 items-center justify-center rounded-full bg-indigo-500">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-6 w-6 text-white"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
							/>
						</svg>
					</div>
					<h3 class="text-2xl font-bold text-indigo-400">Governance</h3>
				</div>
				<div class="pl-14">
					<p class="mb-2 text-gray-300">Transparent voting system weighted by contribution</p>
					<p class="text-sm text-gray-400">
						Proposals for new projects, resource allocation, and strategic decisions are voted on by
						all members
					</p>
				</div>
			</div>

			<!-- Resource Pools -->
			<div
				class="transform rounded-xl border border-slate-700 bg-gradient-to-br from-slate-800 to-slate-900 p-6 shadow-lg transition-all duration-700 {structureRevealed
					? 'translate-y-0 opacity-100'
					: 'translate-y-12 opacity-0'}"
				style="transition-delay: 400ms;"
			>
				<div class="mb-4 flex items-center">
					<div class="mr-4 flex h-10 w-10 items-center justify-center rounded-full bg-green-500">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-6 w-6 text-white"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
							/>
						</svg>
					</div>
					<h3 class="text-2xl font-bold text-green-400">Resource Pools</h3>
				</div>
				<div class="pl-14">
					<p class="mb-2 text-gray-300">Strategic allocation of resources across different pools</p>
					<p class="text-sm text-gray-400">
						Development, marketing, operations, and community pools ensure balanced growth and
						sustainability
					</p>
				</div>
			</div>
		</div>

		<!-- Evolution Plan -->
		<div
			class="mt-10 transform rounded-xl border border-slate-700 bg-gradient-to-br from-slate-800/50 to-slate-900/50 p-6 transition-all duration-700 {structureRevealed
				? 'translate-y-0 opacity-100'
				: 'translate-y-12 opacity-0'}"
			style="transition-delay: 500ms;"
		>
			<div class="mb-4 flex items-center">
				<div class="mr-4 flex h-10 w-10 items-center justify-center rounded-full bg-purple-500">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-6 w-6 text-white"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
						/>
					</svg>
				</div>
				<h3 class="text-2xl font-bold text-purple-400">Evolution Plan</h3>
			</div>
			<div class="pl-14">
				<p class="text-gray-300">
					Transformation to full DAO after reaching 10,000 investors, enabling complete
					decentralization while maintaining legal compliance
				</p>
			</div>
		</div>
	</div>
</div>

<style>
	/* Add any slide-specific styles here */
</style>
