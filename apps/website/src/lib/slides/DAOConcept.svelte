<script>
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';

	let visible = false;

	onMount(() => {
		setTimeout(() => {
			visible = true;
		}, 300);
	});
</script>

<div
	class="slide-content flex h-full flex-col items-center justify-center bg-[#0a192f] p-6 md:p-12"
>
	<div class="mx-auto w-full max-w-6xl">
		<!-- Header -->
		{#if visible}
			<div class="mb-10" in:fade={{ duration: 400 }}>
				<h1 class="text-5xl font-bold leading-tight text-white md:text-6xl lg:text-7xl">
					The DAO <span class="text-[#f0b429]">Concept</span>
				</h1>
				<div class="mb-4 mt-4 h-1 w-32 bg-[#64ffda]/30"></div>
				<p class="text-xl text-gray-300 md:text-2xl">
					Decentralized Autonomous Organization — a new model for ownership
				</p>
			</div>
		{/if}

		<!-- Main Content -->
		{#if visible}
			<div
				class="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2"
				in:fade={{ duration: 400, delay: 150 }}
			>
				<!-- Left Side - Central Concept -->
				<div class="flex flex-col items-center justify-center">
					<div class="relative h-64 w-64 md:h-80 md:w-80">
						<!-- Center node -->
						<div
							class="absolute inset-0 z-20 m-auto flex h-32 w-32 items-center justify-center rounded-full border-4 border-[#64ffda]"
						>
							<span class="text-3xl font-bold text-white">DAO</span>
						</div>

						<!-- Connection points with symbols -->
						<div class="absolute left-1/2 top-0 z-30 -translate-x-1/2 -translate-y-4">
							<div
								class="flex h-16 w-16 items-center justify-center rounded-full border-2 border-[#f0b429]"
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="h-8 w-8 text-[#f0b429]"
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

						<div class="absolute right-0 top-1/2 z-30 -translate-y-1/2 translate-x-4">
							<div
								class="flex h-16 w-16 items-center justify-center rounded-full border-2 border-[#64ffda]"
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="h-8 w-8 text-[#64ffda]"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M13 10V3L4 14h7v7l9-11h-7z"
									/>
								</svg>
							</div>
						</div>

						<div class="absolute bottom-0 left-1/2 z-30 -translate-x-1/2 translate-y-4">
							<div
								class="flex h-16 w-16 items-center justify-center rounded-full border-2 border-[#f0b429]"
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="h-8 w-8 text-[#f0b429]"
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
						</div>

						<div class="absolute left-0 top-1/2 z-30 -translate-x-4 -translate-y-1/2">
							<div
								class="flex h-16 w-16 items-center justify-center rounded-full border-2 border-[#64ffda]"
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="h-8 w-8 text-[#64ffda]"
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
						</div>

						<!-- Connection lines -->
						<div
							class="absolute left-1/2 top-1/2 z-0 h-full w-px -translate-x-1/2 -translate-y-1/2 bg-white/10"
						></div>
						<div
							class="absolute left-1/2 top-1/2 z-0 h-px w-full -translate-x-1/2 -translate-y-1/2 bg-white/10"
						></div>
					</div>
				</div>

				<!-- Right Side - Feature Cards -->
				<div class="flex flex-col space-y-4">
					<div class="rounded-lg border border-gray-800 bg-[#0a1a3a]/50 p-4">
						<div class="flex items-start">
							<div
								class="mr-4 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#f0b429]/30 bg-[#0a192f]"
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="h-5 w-5 text-[#f0b429]"
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
							<div>
								<h3 class="text-xl font-bold text-[#f0b429]">Governance & Voting</h3>
								<p class="mt-1 text-gray-300">Members vote on proposals and community decisions</p>
							</div>
						</div>
					</div>

					<div class="rounded-lg border border-gray-800 bg-[#0a1a3a]/50 p-4">
						<div class="flex items-start">
							<div
								class="mr-4 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#64ffda]/30 bg-[#0a192f]"
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="h-5 w-5 text-[#64ffda]"
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
							<div>
								<h3 class="text-xl font-bold text-[#64ffda]">VCR Token Ownership</h3>
								<p class="mt-1 text-gray-300">
									Tokens earned through contribution, ensuring fair distribution
								</p>
							</div>
						</div>
					</div>

					<div class="rounded-lg border border-gray-800 bg-[#0a1a3a]/50 p-4">
						<div class="flex items-start">
							<div
								class="mr-4 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#f0b429]/30 bg-[#0a192f]"
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="h-5 w-5 text-[#f0b429]"
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
							<div>
								<h3 class="text-xl font-bold text-[#f0b429]">Community-Driven Innovation</h3>
								<p class="mt-1 text-gray-300">
									Diverse perspectives combine to create breakthrough solutions
								</p>
							</div>
						</div>
					</div>

					<div class="rounded-lg border border-gray-800 bg-[#0a1a3a]/50 p-4">
						<div class="flex items-start">
							<div
								class="mr-4 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#64ffda]/30 bg-[#0a192f]"
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="h-5 w-5 text-[#64ffda]"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M13 10V3L4 14h7v7l9-11h-7z"
									/>
								</svg>
							</div>
							<div>
								<h3 class="text-xl font-bold text-[#64ffda]">Flexible Contribution</h3>
								<p class="mt-1 text-gray-300">
									Work based on your skills and availability, with proportional rewards
								</p>
							</div>
						</div>
					</div>
				</div>
			</div>
		{/if}

		<!-- Bottom Message -->
		{#if visible}
			<div class="mt-12 text-center" in:fade={{ duration: 400, delay: 300 }}>
				<p class="text-2xl text-white md:text-3xl">
					<span class="text-[#64ffda]">Everyone</span> becomes an
					<span class="text-[#f0b429]">owner</span>
				</p>
			</div>
		{/if}

		<!-- Slide Number -->
		<div class="absolute bottom-4 right-4 text-sm text-gray-500">05</div>
	</div>
</div>

<style>
	.slide-content {
		min-height: 100vh;
		position: relative;
		overflow: hidden;
	}
</style>
