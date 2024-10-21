<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';

	export let isRecording: boolean;
	export let audioStream: MediaStream | null;

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
				radius: 0.5,
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

<div bind:this={container} class="w-[300px] h-[300px]" />

<style>
	div {
		background: transparent;
	}
</style>
