<script lang="ts">
	import { onMount } from 'svelte';

	let revealed = false;
	let introRevealed = false;
	let logoRevealed = false;
	let featuresRevealed = false;

	// Error handler for image
	function handleImageError(e: Event): void {
		const target = e.currentTarget as HTMLImageElement;
		target.classList.add('hidden');
		const prevElement = target.previousElementSibling;
		if (prevElement) {
			prevElement.classList.remove('opacity-0');
		}
	}

	onMount(() => {
		setTimeout(() => {
			revealed = true;

			setTimeout(() => {
				introRevealed = true;

				setTimeout(() => {
					logoRevealed = true;

					setTimeout(() => {
						featuresRevealed = true;
					}, 800);
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
			class="mb-6 transform text-center transition-all duration-700 {revealed
				? 'translate-y-0 opacity-100'
				: 'translate-y-12 opacity-0'}"
		>
			<div class="mb-3 text-xl text-yellow-400">INTRODUCING VISIONCREATOR</div>
			<h2 class="mb-4 text-4xl font-bold text-white md:text-5xl lg:text-6xl">
				The <span
					class="bg-gradient-to-r from-purple-400 via-blue-400 to-teal-400 bg-clip-text text-transparent"
					>Solution</span
				> You Need
			</h2>
		</div>

		<!-- Guide Introduction -->
		<div
			class="mx-auto mb-8 max-w-4xl transform transition-all delay-300 duration-700 {introRevealed
				? 'translate-y-0 opacity-100'
				: 'translate-y-12 opacity-0'}"
		>
			<div
				class="rounded-xl border border-purple-700/30 bg-gradient-to-br from-purple-900/20 to-slate-900/30 p-6"
			>
				<div class="flex items-start">
					<div class="mr-4 text-4xl leading-none text-purple-400">"</div>
					<div>
						<p class="text-xl italic text-gray-200">
							Yes, it's real. Welcome to Vision Creator—the future of economic organizations.
						</p>
						<p class="mt-2 text-right text-purple-400">— The Guide</p>
					</div>
					<div class="ml-4 self-end text-4xl leading-none text-purple-400">"</div>
				</div>
			</div>
		</div>

		<!-- Logo Section -->
		<div
			class="delay-600 mb-10 flex transform justify-center transition-all duration-700 {logoRevealed
				? 'translate-y-0 scale-100 opacity-100'
				: 'translate-y-12 scale-95 opacity-0'}"
		>
			<div class="relative flex h-40 w-40 items-center justify-center">
				<!-- Fallback diamond logo -->
				<div class="absolute inset-0 opacity-0">
					<div class="flex h-full w-full items-center justify-center">
						<div class="relative h-32 w-32 rotate-45 transform">
							<div
								class="absolute inset-0 rounded-sm bg-gradient-to-br from-green-400 to-yellow-400 shadow-lg shadow-green-500/20"
							></div>
							<div
								class="absolute right-3 top-3 h-6 w-6 -rotate-45 transform rounded-sm bg-teal-400"
							></div>
						</div>
					</div>
				</div>

				<!-- Primary logo image -->
				<img
					src="/logo/visioncreator-diamond-logo.png"
					alt="Visioncreator Logo"
					class="h-full w-full object-contain"
					on:error={handleImageError}
				/>

				<!-- Glow effect -->
				<div
					class="absolute inset-0 -z-10 rounded-full bg-gradient-to-r from-purple-500 via-blue-500 to-teal-500 opacity-20 blur-xl"
				></div>
			</div>
		</div>

		<!-- Features Section -->
		<div
			class="delay-900 transform transition-all duration-700 {featuresRevealed
				? 'translate-y-0 opacity-100'
				: 'translate-y-12 opacity-0'}"
		>
			<div class="grid grid-cols-1 gap-6 md:grid-cols-3">
				<div
					class="rounded-xl border border-purple-700/30 bg-gradient-to-br from-purple-900/20 to-slate-900/30 p-5"
				>
					<div class="mb-3 flex items-center">
						<div
							class="mr-3 flex h-10 w-10 items-center justify-center rounded-full bg-purple-500/30"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								class="h-5 w-5 text-purple-400"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
								/>
							</svg>
						</div>
						<h3 class="text-xl font-bold text-white">Community Ownership</h3>
					</div>
					<p class="text-gray-300">Shared values, collective decisions, real belonging</p>
				</div>

				<div
					class="rounded-xl border border-blue-700/30 bg-gradient-to-br from-blue-900/20 to-slate-900/30 p-5"
				>
					<div class="mb-3 flex items-center">
						<div
							class="mr-3 flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/30"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								class="h-5 w-5 text-blue-400"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4"
								/>
							</svg>
						</div>
						<h3 class="text-xl font-bold text-white">Self-Direction</h3>
					</div>
					<p class="text-gray-300">Freedom to pursue your vision and creativity</p>
				</div>

				<div
					class="rounded-xl border border-teal-700/30 bg-gradient-to-br from-teal-900/20 to-slate-900/30 p-5"
				>
					<div class="mb-3 flex items-center">
						<div
							class="mr-3 flex h-10 w-10 items-center justify-center rounded-full bg-teal-500/30"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								class="h-5 w-5 text-teal-400"
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
						<h3 class="text-xl font-bold text-white">Economic Freedom</h3>
					</div>
					<p class="text-gray-300">Real ownership with lasting financial value</p>
				</div>
			</div>

			<!-- Tagline -->
			<div class="mt-8 text-center">
				<p
					class="bg-gradient-to-r from-purple-400 via-blue-400 to-teal-400 bg-clip-text text-2xl font-semibold text-transparent"
				>
					The future of economic organizations
				</p>
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
