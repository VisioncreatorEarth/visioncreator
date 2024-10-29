<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';
	import Avatar from './Avatar.svelte';
	import { getContext } from 'svelte';

	export let isRecording: boolean;
	export let audioStream: MediaStream | null;

	// Get the me store from context (similar to Profile.svelte)
	const me = getContext('me');

	let container: HTMLDivElement;
	let audioMotion: any;
	let micStream: MediaStreamAudioSourceNode;

	onMount(async () => {
		if (browser) {
			const AudioMotionAnalyzer = (await import('audiomotion-analyzer')).default;
			audioMotion = new AudioMotionAnalyzer(container, {
				mode: 2,
				channelLayout: 'single',
				fftSize: 8192,
				minFreq: 20,
				maxFreq: 22000,
				smoothing: 0.85,
				radius: 0.75,
				lineWidth: 2,
				fillAlpha: 0.5,
				showBgColor: false,
				bgAlpha: 0,
				showScaleY: false,
				showPeaks: false,
				lumiBars: false,
				radial: true,
				spinSpeed: 0,
				reflexRatio: 0,
				reflexAlpha: 0,
				reflexBright: 1,
				reflexFit: true,
				showLeds: false,
				ledBars: false,
				width: 300,
				height: 300,
				overlay: true,
				outlineBars: true,
				mirror: 0,
				gradient: 'rainbow'
			});
		}
	});

	$: if (browser && audioMotion && isRecording && audioStream) {
		connectMicrophone(audioStream);
	} else if (browser && audioMotion && !isRecording) {
		disconnectMicrophone();
	}

	function connectMicrophone(stream: MediaStream) {
		if (audioMotion && stream) {
			micStream = audioMotion.audioCtx.createMediaStreamSource(stream);
			audioMotion.connectInput(micStream);
			audioMotion.volume = 0;
		}
	}

	function disconnectMicrophone() {
		if (audioMotion && micStream) {
			audioMotion.disconnectInput(micStream, true);
		}
	}

	onDestroy(() => {
		if (browser && audioMotion) {
			audioMotion.destroy();
		}
	});
</script>

<div class="relative w-[300px] h-[300px] flex items-center justify-center">
	<!-- Audio visualizer container -->
	<div bind:this={container} class="absolute inset-0 flex items-center justify-center" />

	<!-- Centered avatar - adjusted for perfect centering -->
	<div class="absolute inset-0 flex items-center justify-center">
		<div class="flex items-center justify-center w-40 h-40">
			<Avatar
				me={{
					data: { seed: 'random user' },
					design: { highlight: true, ring: true },
					size: 'xl'
				}}
			/>
		</div>
	</div>
</div>

<style>
	:global(.avatar-container) {
		filter: drop-shadow(0 0 8px rgba(255, 255, 255, 0.2));
	}
</style>
