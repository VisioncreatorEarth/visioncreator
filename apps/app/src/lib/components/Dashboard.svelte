<script lang="ts">
	import { writable } from 'svelte/store';

	export let me;

	let showQRCode = writable(false);
</script>

<div class="@container fixed inset-0 overflow-hidden">
	<div class="relative w-full h-full">
		<!-- Background Image -->
		<div
			class="absolute inset-0 bg-center bg-no-repeat bg-cover"
			style="background-image: url('/dashboard.jpg');"
		>
			<div class="absolute inset-0 bg-black/20" />
		</div>

		<!-- Grid Layout -->
		<div class="relative grid h-full grid-rows-[auto]">
			<!-- Main Content -->
			<div class="z-10 flex flex-col items-center justify-center p-4 overflow-y-auto">
				<!-- Founding Family Message -->
				{#if !$showQRCode}
					<div
						class="flex flex-col items-center justify-center max-w-2xl mx-auto space-y-6 text-center"
					>
						<h2
							class="text-2xl font-bold sm:text-3xl md:text-4xl text-tertiary-100 dark:text-surface-100"
						>
							Join the founding family of 144
						</h2>

						<!-- Milestone Progress -->
						<div
							class="w-full h-4 max-w-md mb-2 rounded-full bg-tertiary-200/20 dark:bg-surface-800/20"
						>
							<div
								class="h-full transition-all duration-500 rounded-full bg-tertiary-300 dark:bg-surface-200"
								style="width: {(18 / 21) * 100}%"
							/>
						</div>

						<div class="space-y-3">
							<p class="text-xl font-semibold text-tertiary-100 dark:text-surface-100">
								Last 3 seats in Founding Circle 6
							</p>
							<p class="text-base text-tertiary-200 dark:text-surface-200">
								Join <span class="font-bold text-tertiary-100 dark:text-surface-100">18</span> visionaries
								in our most privileged circles
							</p>
						</div>

						<!-- Simplified Circle Display -->
						<div class="w-full max-w-md space-y-2">
							<div class="flex justify-between w-full mt-2">
								{#each Array.from({ length: 11 }, (_, i) => i + 1) as circle}
									<div class="flex flex-col items-center">
										<div
											class={`w-2 h-2 rounded-full ${
												circle <= 6
													? 'bg-tertiary-300 dark:bg-surface-200'
													: 'bg-tertiary-200/40 dark:bg-surface-800/40'
											}`}
										/>
										<span class="mt-1 text-xs font-medium text-tertiary-200 dark:text-surface-200">
											C{circle}
										</span>
									</div>
								{/each}
							</div>
						</div>

						<!-- CTA Button -->
						<button
							class="px-8 py-4 mt-8 text-lg font-semibold text-white transition-all duration-200 transform rounded-full bg-tertiary-500 dark:bg-surface-500 hover:bg-tertiary-600 dark:hover:bg-surface-600 hover:scale-105"
						>
							Request Details by Mail
						</button>
					</div>
				{/if}
			</div>
		</div>
	</div>
</div>

<footer class="fixed bottom-0 right-0 py-2 @sm:py-2 text-white z-50">
	<div class="px-4 @sm:px-4">
		<a
			href="https://unsplash.com/de/fotos/lichtstrahl-in-der-nahe-des-gewassers--p-KCm6xB9I"
			target="_blank"
			rel="noopener noreferrer"
			class="transition-colors text-2xs text-tertiary-500/80 hover:text-tertiary-500"
		>
			Image by SpaceX
		</a>
	</div>
</footer>

<style>
	:global(body) {
		background-color: rgba(24, 25, 73, 1);
	}
</style>
