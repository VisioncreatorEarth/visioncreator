<script>
	import { onMount } from 'svelte';
	import { tweened } from 'svelte/motion';

	function customEase(t) {
		return 0.4 * t + 0.6 * t * t;
	}

	let progress = tweened(0, {
		duration: 26666,
		easing: customEase
	});

	let fibonacciNumbers = [0, 1];
	while (fibonacciNumbers[fibonacciNumbers.length - 1] < 1e9) {
		fibonacciNumbers.push(
			fibonacciNumbers[fibonacciNumbers.length - 1] + fibonacciNumbers[fibonacciNumbers.length - 2]
		);
	}

	let currentFib = fibonacciNumbers[0];
	$: euroPool = currentFib * 30;

	$: {
		let index = Math.min(
			fibonacciNumbers.length - 1,
			Math.floor($progress * fibonacciNumbers.length)
		);
		currentFib = fibonacciNumbers[index];
	}

	let mediaRecorder;
	let recordedChunks = [];
	let isRecording = false;

	onMount(async () => {
		progress.set(1);
		await startRecording();
	});

	async function startRecording() {
		try {
			const stream = await navigator.mediaDevices.getDisplayMedia({
				video: { 
					displaySurface: "browser",
					frameRate: 30,
					width: 1920,
					height: 1080,
					cursor: "always"
				},
				audio: {
					echoCancellation: false,
					noiseSuppression: false,
					sampleRate: 48000,
					channelCount: 2
				}
			});

			recordedChunks = [];
			mediaRecorder = new MediaRecorder(stream, {
				mimeType: 'video/mp4',
				videoBitsPerSecond: 4000000, // 4 Mbps
				audioBitsPerSecond: 128000 // 128 kbps
			});

			mediaRecorder.ondataavailable = (event) => {
				if (event.data.size > 0) {
					recordedChunks.push(event.data);
				}
			};

			mediaRecorder.onstop = () => {
				const blob = new Blob(recordedChunks, { 
					type: 'video/mp4'
				});
				
				const url = URL.createObjectURL(blob);
				const a = document.createElement('a');
				const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
				a.href = url;
				a.download = `milestone-1080p-${timestamp}.mp4`;
				a.click();
				URL.revokeObjectURL(url);
				stream.getTracks().forEach(track => track.stop());
			};

			mediaRecorder.start(1000);
			isRecording = true;
		} catch (err) {
			console.error("Error starting recording:", err);
			alert("Error starting recording. Please try again.");
		}
	}

	function stopRecording() {
		if (mediaRecorder && mediaRecorder.state !== 'inactive') {
			mediaRecorder.stop();
			isRecording = false;
		}
	}

	const mainSize = 880;
	const goldenRatio = 1.618033988749895;

	function getPosition(i) {
		const angle = i * goldenRatio * Math.PI * 2;
		const distance = Math.pow(i / (fibonacciNumbers.length - 1), 0.5) * (mainSize / 2 - 44);
		return {
			x: mainSize / 2 + Math.cos(angle) * distance,
			y: mainSize / 2 + Math.sin(angle) * distance
		};
	}

	function getNodeSize(fib) {
		return Math.max(8, Math.min(40, Math.log(fib + 1) * 4));
	}
</script>

<div class="fixed top-4 left-4 z-50">
	<button
		on:click={stopRecording}
		class="flex gap-2 items-center px-4 py-2 text-white bg-gray-700 rounded-full shadow-lg hover:bg-gray-800"
	>
		<div class="w-3 h-3 bg-white" />
		Stop Recording
	</button>
</div>

<div
	class="flex overflow-hidden justify-center items-center h-screen"
	style="background-color: #00B140;"
>
	<div
		class="flex overflow-hidden relative justify-center items-center rounded-full shadow-2xl bg-surface-800"
		style="width: {mainSize}px; height: {mainSize}px;"
	>
		{#each fibonacciNumbers as fib, i}
			{#if $progress > i / fibonacciNumbers.length}
				{@const pos = getPosition(i)}
				{@const size = getNodeSize(fib)}
				<div
					class="absolute rounded-full animate-pulse bg-primary-500"
					style="
						left: {pos.x}px;
						top: {pos.y}px;
						width: {size}px;
						height: {size}px;
						transition: all 0.5s ease-out;
						opacity: {$progress};
					"
				/>
			{/if}
		{/each}

		<svg class="absolute inset-0 w-full h-full pointer-events-none">
			{#each fibonacciNumbers as _, i}
				{#if i > 0 && $progress > i / fibonacciNumbers.length}
					{@const pos1 = getPosition(i - 1)}
					{@const pos2 = getPosition(i)}
					<line
						x1={pos1.x}
						y1={pos1.y}
						x2={pos2.x}
						y2={pos2.y}
						stroke="rgba(167, 139, 250, 0.3)"
						stroke-width="1"
					/>
				{/if}
			{/each}
		</svg>

		<div class="flex z-10 flex-col items-center text-center">
			<span class="mb-8 text-8xl font-bold opacity-70 text-primary-300">
				{currentFib.toLocaleString()}
			</span>
			<span class="text-3xl opacity-60 text-primary-200">
				€{euroPool.toLocaleString()} Pool
			</span>
		</div>
	</div>
</div>

<style lang="postcss">
	:global(body) {
		background-color: #00b140;
	}
</style>
