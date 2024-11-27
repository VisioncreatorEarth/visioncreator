<script lang="ts">
	import { createQuery } from '$lib/wundergraph';
	import { onMount } from 'svelte';

	const timeUsageQuery = createQuery({
		operationName: 'queryCallsAndTimeStats',
		enabled: true,
		liveQuery: true
	});

	const voicesQuery = createQuery({
		operationName: 'getVoices',
		enabled: true
	});

	type Voice = {
		voiceId: string;
		name: string;
		description: string;
		previewUrl: string | null;
		language: string;
	};

	let audioElements: Record<string, HTMLAudioElement> = {};
	let currentlyPlaying: string | null = null;

	function handleTimeUpdate(voiceId: string) {
		const audio = audioElements[voiceId];
		if (audio) {
			const progress = (audio.currentTime / audio.duration) * 100;
			const progressBar = document.getElementById(`progress-${voiceId}`);
			if (progressBar) {
				progressBar.style.width = `${progress}%`;
			}
		}
	}

	function playPreview(voiceId: string) {
		const audio = audioElements[voiceId];
		if (!audio) return;

		if (currentlyPlaying === voiceId) {
			audio.pause();
			audio.currentTime = 0;
			currentlyPlaying = null;
		} else {
			if (currentlyPlaying && audioElements[currentlyPlaying]) {
				audioElements[currentlyPlaying].pause();
				audioElements[currentlyPlaying].currentTime = 0;
			}
			audio.play().catch(error => {
				console.error('Error playing audio:', error);
				currentlyPlaying = null;
			});
			currentlyPlaying = voiceId;
		}
	}

	function handleEnded(voiceId: string) {
		if (currentlyPlaying === voiceId) {
			currentlyPlaying = null;
		}
	}

	function groupVoicesByCategory(voices: Voice[]): Record<string, Voice[]> {
		return voices.reduce((acc, voice) => {
			if (!acc[voice.language]) {
				acc[voice.language] = [];
			}
			acc[voice.language].push(voice);
			return acc;
		}, {} as Record<string, Voice[]>);
	}

	function calculateDuration(start: string, end?: string): string {
		if (!end) return 'Active';
		const startTime = new Date(start).getTime();
		const endTime = new Date(end).getTime();
		const durationMs = endTime - startTime;
		const seconds = Math.floor(durationMs / 1000);
		const minutes = Math.floor(seconds / 60);
		const remainingSeconds = seconds % 60;
		return `${minutes}m ${remainingSeconds.toString().padStart(2, '0')}s`;
	}

	function formatTimestamp(timestamp: string): string {
		return new Date(timestamp).toLocaleString();
	}

	function formatDuration(duration: string): string {
		const seconds = parseFloat(duration.replace('s', ''));
		const minutes = Math.floor(seconds / 60);
		const remainingSeconds = Math.round(seconds % 60);
		return `${minutes}m ${remainingSeconds.toString().padStart(2, '0')}s`;
	}

	onMount(() => {
		// Initialize audio elements
		const audioElementsHtml = document.querySelectorAll('audio');
		audioElementsHtml.forEach((audio) => {
			const voiceId = audio.id;
			audioElements[voiceId] = audio as HTMLAudioElement;
		});
	});
</script>

<div class="flex h-screen">
	<main class="overflow-y-auto flex-1 bg-surface-900">
		<div class="p-6 space-y-6">
			{#if $timeUsageQuery.isLoading}
				<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
					<div class="p-6 rounded-lg animate-pulse bg-surface-800">
						<div class="mb-4 w-1/3 h-6 rounded bg-surface-700" />
						<div class="space-y-3">
							<div class="w-3/4 h-4 rounded bg-surface-700" />
							<div class="w-1/2 h-4 rounded bg-surface-700" />
						</div>
					</div>
					<div class="p-6 rounded-lg animate-pulse bg-surface-800">
						<div class="mb-4 w-1/3 h-6 rounded bg-surface-700" />
						<div class="space-y-3">
							<div class="w-3/4 h-4 rounded bg-surface-700" />
							<div class="w-1/2 h-4 rounded bg-surface-700" />
						</div>
					</div>
				</div>
			{:else if $timeUsageQuery.data}
				<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
					<div class="p-6 rounded-lg bg-surface-800">
						<h3 class="mb-4 text-lg font-semibold text-surface-200">Time Used</h3>
						<div class="text-3xl font-bold text-white">
							{formatDuration($timeUsageQuery.data.timeUsed)}
						</div>
					</div>
					<div class="p-6 rounded-lg bg-surface-800">
						<h3 class="mb-4 text-lg font-semibold text-surface-200">Time Remaining</h3>
						<div class="text-3xl font-bold text-white">
							{formatDuration($timeUsageQuery.data.timeRemaining)}
						</div>
					</div>
				</div>

				<div class="p-6 rounded-lg bg-surface-800 md:col-span-2">
					<h3 class="mb-4 text-lg font-semibold text-white">Call History</h3>
					<div class="space-y-4">
						{#each $timeUsageQuery.data.calls ?? [] as call}
							<div class="p-4 rounded bg-surface-700/50">
								<div class="flex justify-between items-center">
									<div class="flex items-center space-x-3">
										<span
											class="px-2 py-1 text-xs rounded-full {call.ended
												? 'bg-success-500/10 text-success-500'
												: 'bg-warning-900/50 text-warning-200'}"
										>
											{call.ended ? `Ended (${call.endReason || 'Unknown'})` : 'Active'}
										</span>
										<span class="text-sm text-surface-200">
											by {call.userName}
										</span>
										<span class="text-sm text-surface-100">
											{calculateDuration(call.created, call.ended)}
										</span>
									</div>
									<span class="text-xs text-surface-300">{formatTimestamp(call.created)}</span>
								</div>
							</div>
						{/each}
					</div>
				</div>
			{/if}
		</div>
	</main>
	<aside class="w-96 overflow-y-auto bg-surface-800 p-6">
		<h2 class="text-xl font-semibold mb-4">Available Voices</h2>
		{#if $voicesQuery.isLoading}
			<div class="space-y-4">
				{#each Array(3) as _}
					<div class="p-4 rounded-lg animate-pulse bg-surface-700">
						<div class="w-1/2 h-4 mb-2 rounded bg-surface-600" />
						<div class="w-3/4 h-3 rounded bg-surface-600" />
					</div>
				{/each}
			</div>
		{:else if $voicesQuery.error}
			<div class="p-4 rounded-lg bg-surface-700 text-red-400">
				Error loading voices: {$voicesQuery.error.message}
			</div>
		{:else if $voicesQuery.data?.voices}
			<div class="space-y-6">
				{#each Object.entries(groupVoicesByCategory($voicesQuery.data.voices)) as [language, languageVoices]}
					<div>
						<h3 class="text-sm font-medium text-surface-300 mb-3">{language}</h3>
						<div class="space-y-3">
							{#each languageVoices as voice}
								<div class="p-4 rounded-lg bg-surface-700 hover:bg-surface-600 transition-colors">
									<div class="flex items-start justify-between">
										<div class="flex-1">
											<h4 class="font-medium">{voice.name}</h4>
											<p class="text-xs text-surface-400 mt-1">({voice.voiceId})</p>
											{#if voice.previewUrl}
												<div class="mt-3">
													<audio
														bind:this={audioElements[voice.voiceId]}
														preload="none"
														on:ended={() => handleEnded(voice.voiceId)}
														on:timeupdate={() => handleTimeUpdate(voice.voiceId)}
													>
														<source src={voice.previewUrl} type="audio/mpeg">
														Your browser does not support the audio element.
													</audio>
													<div class="flex items-center gap-3">
														<button
															class="text-primary-400 hover:text-primary-300 transition-colors"
															on:click={() => playPreview(voice.voiceId)}
														>
															{#if currentlyPlaying === voice.voiceId}
																<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
																	<path d="M5 4h3v12H5V4zm7 0h3v12h-3V4z"/>
																</svg>
															{:else}
																<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
																	<path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"/>
																</svg>
															{/if}
														</button>
														<div class="flex-1 h-1 bg-surface-600 rounded-full overflow-hidden">
															<div
																id="progress-{voice.voiceId}"
																class="h-full bg-primary-400 transition-all duration-100"
																style="width: 0%"
															/>
														</div>
													</div>
												</div>
											{/if}
										</div>
									</div>
								</div>
							{/each}
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</aside>
</div>

<style>
	:global(html) {
		background-color: rgb(var(--color-surface-900));
	}
</style>
