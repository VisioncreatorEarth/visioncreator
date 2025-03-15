<script>
	import { onMount } from 'svelte';

	let revealed = false;
	let questionRevealed = false;
	let answerRevealed = false;

	onMount(() => {
		setTimeout(() => {
			revealed = true;
			setTimeout(() => {
				questionRevealed = true;
				setTimeout(() => {
					answerRevealed = true;
				}, 800);
			}, 600);
		}, 400);
	});
</script>

<div class="slide-content flex h-full flex-col items-center justify-center p-8">
	<div class="mx-auto w-full max-w-5xl">
		<!-- Main Content -->
		<div
			class="transform text-center transition-all duration-700 {revealed
				? 'translate-y-0 opacity-100'
				: 'translate-y-12 opacity-0'}"
		>
			<h2 class="mb-6 text-5xl font-bold tracking-tight md:text-6xl">A BETTER WAY</h2>

			<div
				class="mx-auto mt-8 max-w-4xl transform transition-all duration-700 {questionRevealed
					? 'translate-y-0 opacity-100'
					: 'translate-y-12 opacity-0'}"
			>
				<p class="mb-6 text-2xl font-semibold text-gray-200 md:text-3xl">
					Can we integrate all these elements into one organization?
				</p>

				<div class="my-12 flex items-center justify-center">
					<div
						class="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-indigo-500 to-purple-600"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-8 w-8 text-white"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
							/>
						</svg>
					</div>
				</div>
			</div>

			<div
				class="mx-auto mt-8 max-w-3xl transform rounded-xl border border-slate-700 bg-gradient-to-br from-slate-800 to-slate-900 p-8 shadow-lg transition-all duration-700 {answerRevealed
					? 'translate-y-0 opacity-100'
					: 'translate-y-12 opacity-0'}"
			>
				<p class="mb-6 text-xl text-gray-300">Traditional structures force us to choose between:</p>

				<div class="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
					<div class="rounded-lg border border-slate-700 bg-slate-800/50 p-4">
						<p class="text-lg font-medium text-indigo-300">Belonging</p>
						<p class="text-gray-400">vs.</p>
						<p class="text-lg font-medium text-purple-300">Autonomy</p>
					</div>

					<div class="rounded-lg border border-slate-700 bg-slate-800/50 p-4">
						<p class="text-lg font-medium text-indigo-300">Financial Security</p>
						<p class="text-gray-400">vs.</p>
						<p class="text-lg font-medium text-purple-300">Agency</p>
					</div>
				</div>

				<p class="text-xl font-medium text-gray-200">
					What if we could build an organization that enables <span class="text-indigo-300"
						>all of these</span
					> simultaneously?
				</p>
			</div>
		</div>
	</div>
</div>

<style>
	/* Add any slide-specific styles here */
</style>
