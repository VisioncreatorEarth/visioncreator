<script>
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';

	let visible = false;

	onMount(() => {
		setTimeout(() => {
			visible = true;
		}, 300);
	});

	const coreNeeds = [
		{
			name: 'Belonging',
			icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
			color: '#64ffda',
			description: 'Being part of a community that values your contributions and perspective'
		},
		{
			name: 'Autonomy',
			icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
			color: '#f0b429',
			description: 'Having freedom to make meaningful decisions about your work and approach'
		},
		{
			name: 'Agency',
			icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
			color: '#64ffda',
			description: 'Having real influence over outcomes and ability to shape your environment'
		},
		{
			name: 'Security',
			icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
			color: '#f0b429',
			description: 'Fair compensation and a stable foundation for your life and future'
		},
		{
			name: 'Purpose',
			icon: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z',
			color: '#64ffda',
			description: 'Work that connects to your values and contributes to something larger'
		}
	];
</script>

<div
	class="slide-content flex h-full flex-col items-center justify-center bg-[#0a192f] p-6 md:p-12"
>
	<!-- Content Container -->
	<div class="mx-auto w-full max-w-6xl">
		<!-- Header -->
		{#if visible}
			<div class="mb-10" in:fade={{ duration: 400 }}>
				<h1 class="text-5xl font-bold leading-tight text-white md:text-6xl lg:text-7xl">
					Core Human <span class="text-[#f0b429]">Needs</span>
				</h1>
				<div class="mb-4 mt-4 h-1 w-32 bg-[#64ffda]/30"></div>
				<p class="text-xl text-gray-300 md:text-2xl">What every workplace should address</p>
			</div>
		{/if}

		<!-- Introduction Box -->
		{#if visible}
			<div class="mb-10" in:fade={{ duration: 400, delay: 150 }}>
				<div class="rounded-lg border border-gray-800 bg-[#0a1a3a]/50 p-6">
					<div class="flex items-center">
						<div
							class="mr-5 flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[#64ffda]/30 bg-[#0a192f]"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								class="h-6 w-6 text-[#64ffda]"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
								/>
							</svg>
						</div>
						<h3 class="text-2xl font-bold text-white">The Workplace That Feels Like Home</h3>
					</div>
					<p class="mt-4 pl-[4.25rem] text-gray-300">
						Imagine a workplace that supports your whole being, where fundamental human needs aren't
						just acknowledged, but actively nurtured. This is what a truly human-centered work
						environment provides.
					</p>
				</div>
			</div>
		{/if}

		<!-- Core Needs Grid -->
		{#if visible}
			<div
				class="mb-12 grid grid-cols-1 gap-6 md:grid-cols-3"
				in:fade={{ duration: 400, delay: 250 }}
			>
				{#each coreNeeds as need, i}
					<div class="rounded-lg border border-gray-800 bg-[#0a1a3a]/50 p-5">
						<div class="flex items-start">
							<div
								class="mr-4 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border bg-[#0a192f]"
								style="border-color: {need.color}30;"
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="h-5 w-5"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
									style="color: {need.color};"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d={need.icon}
									/>
								</svg>
							</div>
							<div>
								<h3 class="text-xl font-bold" style="color: {need.color};">{need.name}</h3>
								<p class="mt-1 text-gray-300">{need.description}</p>
							</div>
						</div>
					</div>
				{/each}
			</div>
		{/if}

		<!-- Bottom Message -->
		{#if visible}
			<div class="text-center" in:fade={{ duration: 400, delay: 350 }}>
				<p class="text-2xl text-white md:text-3xl">
					Work becomes a <span class="text-[#64ffda]">fulfilling extension</span> of your
					<span class="text-[#f0b429]">true self</span>
				</p>
			</div>
		{/if}

		<!-- Slide Number -->
		<div class="absolute bottom-4 right-4 text-sm text-gray-500">04</div>
	</div>
</div>

<style>
	.slide-content {
		min-height: 100vh;
		position: relative;
		overflow: hidden;
	}
</style>
