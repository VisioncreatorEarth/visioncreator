<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte';
	import Icon from '@iconify/svelte';

	export let title: string;
	export let hookTitle: string;
	export let shareableImageUrl: string;
	export let episodeNumber: number;

	const vcreatorsCount = Math.floor(Number(Math.random()) * (100 - 10 + 1)) + 10;
	const uniqueId = String(Math.random()).substring(2, 15);
	const signupLink = `https://visioncreator.earth/signup?ref=${uniqueId}`;
	const dispatch = createEventDispatcher();
	let step = 0;
	let copiedMessage = '';
	let canvas: HTMLCanvasElement;
	let processedImageUrl = '';

	onMount(() => {
		processImage();
	});

	async function processImage() {
		const img = new Image();
		img.crossOrigin = 'Anonymous';
		img.src = shareableImageUrl;
		img.onload = () => {
			const ctx = canvas.getContext('2d');
			if (!ctx) return;

			const size = Math.min(img.width, img.height);
			canvas.width = canvas.height = size;

			// Draw image
			ctx.drawImage(
				img,
				(img.width - size) / 2,
				(img.height - size) / 2,
				size,
				size,
				0,
				0,
				size,
				size
			);

			// Add overlay
			ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
			ctx.fillRect(0, 0, size, size);

			// Add title
			ctx.fillStyle = 'white';
			ctx.font = 'bold 48px Arial';
			ctx.textAlign = 'center';
			ctx.fillText(title, size / 2, size / 2 - 30);

			// Add hook title
			ctx.font = '36px Arial';
			ctx.fillText(hookTitle, size / 2, size / 2 + 30);

			// Add VC number
			ctx.font = 'bold 24px Arial';
			ctx.fillText(`#${vcreatorsCount}`, 40, 40);

			processedImageUrl = canvas.toDataURL('image/jpeg');
		};
	}

	function startJourney() {
		step = 1;
	}

	function downloadImage() {
		const link = document.createElement('a');
		link.href = processedImageUrl;
		link.download = 'world-record-startup.jpg';
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		step = 2;
		generateCaption();
	}

	function generateCaption() {
		copiedMessage = `🚀 Join me in making history! We're building the world's largest startup with 1 billion co-owners.

Already ${vcreatorsCount} strong.

Every share grows our community and your piece of the pie.

Become a VisionCreator: ${signupLink}
#WorldRecordStartup #VisionCreator`;
	}

	async function copyCaption() {
		try {
			await navigator.clipboard.writeText(copiedMessage);
			alert('Message copied to clipboard!');
			step = 3;
		} catch (err) {
			console.error('Failed to copy text: ', err);
		}
	}

	function openInstagram() {
		window.location.href = 'https://www.instagram.com/';
		dispatch('shareComplete');
	}

	function getTitle(step: number) {
		switch (step) {
			case 0:
				return 'Help Chielo write history!';
			case 1:
				return 'Share video image';
			case 2:
				return 'Copy the caption!';
			case 3:
				return 'Ready to inspire?';
			default:
				return 'Join the VisionCreator movement!';
		}
	}

	$: stepTitle = getTitle(step);
</script>

<div class="flex flex-col items-center p-8 bg-surface-800 rounded-lg shadow-md text-primary-300">
	<h2 class="text-2xl font-bold mb-6 text-center text-primary-500">{stepTitle}</h2>
	{#if step === 0}
		<p class="text-md mb-6 text-center">
			We're building the world's largest startup with 1 billion human co-owners, <br />while you
			will grow 10+ new joyful income streams doing so.
		</p>
		<ol class="list-decimal list-inside mb-4 text-left">
			<li class="mb-2">Download the image</li>
			<li class="mb-2">Copy the message</li>
			<li>Share on Instagram</li>
		</ol>
		<p class="text-lg mb-6 text-center font-bold">Are you in?</p>
		<button class="btn variant-filled-primary" on:click={startJourney}>
			<Icon icon="mdi:rocket-launch" class="mr-2 text-2xl" />
			Yes, I am VisionCreator!
		</button>
	{:else if step === 1}
		<p class="text-lg mb-6 text-center">Awesome! Here's a preview of your shareable image:</p>
		<img src={processedImageUrl} alt="VisionCreator Image" class="mb-6 rounded-lg max-w-md" />
		<button class="btn variant-filled-primary" on:click={downloadImage}>
			<Icon icon="mdi:download" class="mr-2 text-2xl" />
			Get Shareable Image
		</button>
	{:else if step === 2}
		<p class="text-lg mb-6 text-center">Great! Here's your VisionCreator message:</p>
		<div class="bg-surface-700 p-4 rounded-lg mb-6 max-w-md">
			<p class="text-sm whitespace-pre-wrap">{copiedMessage}</p>
		</div>
		<button class="btn variant-filled-primary" on:click={copyCaption}>
			<Icon icon="mdi:content-copy" class="mr-2 text-2xl" />
			Copy Message
		</button>
	{:else if step === 3}
		<p class="text-lg mb-6 text-center">Ready to share and watch your potential grow?</p>
		<button class="btn variant-filled-primary" on:click={openInstagram}>
			<Icon icon="mdi:instagram" class="mr-2 text-2xl" />
			Open Instagram Now
		</button>
	{/if}
</div>

<canvas bind:this={canvas} style="display: none;" />
