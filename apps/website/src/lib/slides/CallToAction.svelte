<script lang="ts">
	import { onMount } from 'svelte';

	let revealed = false;
	let questionRevealed = false;
	let ctaRevealed = false;

	onMount(() => {
		setTimeout(() => {
			revealed = true;

			setTimeout(() => {
				questionRevealed = true;

				setTimeout(() => {
					ctaRevealed = true;
				}, 800);
			}, 600);
		}, 400);
	});
</script>

<div
	class="slide-content flex h-full flex-col items-center justify-center bg-gradient-to-br from-slate-900 to-slate-950 p-8"
>
	<div class="mx-auto w-full max-w-5xl">
		<!-- Header -->
		<div
			class="mb-10 transform text-center transition-all duration-700 {revealed
				? 'translate-y-0 opacity-100'
				: 'translate-y-12 opacity-0'}"
		>
			<div class="mb-3 text-xl text-yellow-400">JOIN US</div>
			<h2 class="mb-6 text-4xl font-bold text-white md:text-5xl lg:text-6xl">
				The <span
					class="bg-gradient-to-r from-yellow-400 to-amber-500 bg-clip-text text-transparent"
					>Decision</span
				> is Yours
			</h2>
		</div>

		<!-- Questions Section -->
		<div
			class="mx-auto mb-12 max-w-4xl transform transition-all delay-300 duration-700 {questionRevealed
				? 'translate-y-0 opacity-100'
				: 'translate-y-12 opacity-0'}"
		>
			<div
				class="rounded-xl border border-amber-700/30 bg-gradient-to-br from-amber-900/20 to-slate-900/30 p-8"
			>
				<div class="space-y-6">
					<div class="flex items-start">
						<div class="mr-3 text-2xl text-amber-400">?</div>
						<p class="text-xl text-gray-200">
							Are you ready to stop building for others and start building for yourself?
						</p>
					</div>

					<div class="flex items-start">
						<div class="mr-3 text-2xl text-amber-400">?</div>
						<p class="text-xl text-gray-200">
							Do you want to join a vibrant community that creates remarkable ventures while staying
							true to its core values?
						</p>
					</div>

					<div class="mt-8 flex justify-center">
						<div class="rounded-lg border border-amber-400/30 bg-amber-500/20 px-6 py-4">
							<p class="text-2xl font-bold text-amber-300">"Absolutely!"</p>
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- CTA Section -->
		<div
			class="delay-600 transform transition-all duration-700 {ctaRevealed
				? 'translate-y-0 opacity-100'
				: 'translate-y-12 opacity-0'}"
		>
			<div class="text-center">
				<p class="mb-8 text-2xl text-gray-300">
					Then join VisionCreator today by booking your personal 1:1 call!
				</p>

				<div class="flex flex-col justify-center gap-6 sm:flex-row">
					<a
						href="#book-call"
						class="rounded-xl bg-gradient-to-r from-yellow-500 to-amber-600 px-8 py-4 text-lg font-semibold text-black shadow-lg transition-all hover:translate-y-[-2px] hover:shadow-amber-500/30"
					>
						Book Your 1:1 Call
					</a>

					<a
						href="#learn-more"
						class="rounded-xl border border-amber-500/30 bg-slate-800 px-8 py-4 text-lg font-semibold text-white transition-all hover:bg-slate-700"
					>
						Learn More
					</a>
				</div>

				<div class="mt-12 flex justify-center">
					<div class="flex items-center">
						<div
							class="mr-4 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-yellow-400 to-red-500"
						>
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
									d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
								/>
							</svg>
						</div>
						<p class="text-gray-300">Your future self will thank you for taking this step.</p>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>

<style>
	:global(body) {
		margin: 0;
		padding: 0;
		overflow: hidden;
	}
</style>
