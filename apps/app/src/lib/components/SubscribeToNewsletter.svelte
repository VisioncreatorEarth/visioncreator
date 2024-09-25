<script lang="ts">
	import { createQuery, createMutation } from '$lib/wundergraph';
	import { createEventDispatcher } from 'svelte';

	export let userId: string;
	export let userEmail: string;

	const dispatch = createEventDispatcher();

	const newsletterStatus = createQuery({
		operationName: 'MyNewsletterStatus',
		input: {
			id: userId,
			email: userEmail
		},
		liveQuery: true
	});

	const toggleNewsletterMutation = createMutation({
		operationName: 'NewsletterToggle'
	});

	let showMessage = false;
	let message = '';
	let messageType: 'success' | 'info' = 'info';

	async function handleSubscribe() {
		showMessage = true;
		messageType = 'success';
		message =
			"Welcome to the Visioncreator Family! You're now part of something extraordinary. Together, we'll shape the future and inspire millions. Get ready for an incredible journey!";

		try {
			await $toggleNewsletterMutation.mutateAsync({
				id: userId,
				email: userEmail
			});
		} catch (error) {
			console.error('Error during newsletter subscription:', error);
			// If there's an error, we'll keep the success message for UX, but log the error
		}
	}

	function handleNoThanks() {
		showMessage = true;
		messageType = 'info';
		message = 'No problem! You can always subscribe later if you change your mind.';
	}

	function handleContinue() {
		dispatch('next');
	}
</script>

<div class="newsletter-content w-full h-full flex items-center justify-center">
	{#if $newsletterStatus.isLoading}
		<p class="text-base sm:text-lg md:text-xl lg:text-2xl">Loading...</p>
	{:else if $newsletterStatus.data || showMessage}
		<div
			class="card variant-ghost-{messageType === 'success'
				? 'success'
				: 'secondary'} w-full h-full flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 lg:p-10"
		>
			<h3 class="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-4">
				{messageType === 'success' ? 'Welcome aboard!' : 'Thank you'}
			</h3>
			<p class="text-sm sm:text-base md:text-lg lg:text-xl mb-6">
				{message}
			</p>
			<button
				on:click={handleContinue}
				class="btn variant-ghost-{messageType === 'success' ? 'success' : 'secondary'}"
			>
				Continue
			</button>
		</div>
	{:else}
		<div
			class="w-full h-full flex flex-col items-center justify-center text-center p-4 sm:p-6 md:p-8 lg:p-10 bg-secondary-800 rounded-3xl"
		>
			<h3 class="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-primary-300 mb-4">
				Watch next video one week before the public
			</h3>
			<p class="mt-2 text-sm sm:text-base md:text-lg lg:text-xl mb-6">
				Subscribe to our weekly newsletter to get early access to our video updates 1 week before
				the public and follow along our journey from 0 to 1 billion visioncreators.
			</p>
			<div class="flex flex-row space-x-2 sm:space-x-4 mb-6">
				<button class="btn variant-ghost-secondary" on:click={handleNoThanks}> No, thanks </button>
				<button class="btn variant-filled-primary" on:click={handleSubscribe}> Subscribe </button>
			</div>
			<p
				class="text-2xs sm:text-xs md:text-sm lg:text-base text-tertiary-300 max-w-xl leading-tight sm:leading-snug"
			>
				*By pressing the subscribe button, you consent that we send you our weekly newsletter. You
				can revoke this consent at any time by clicking on the unsubscribe link in our newsletter
				emails or via this dashboard, when you are logged in. Here you can find our
				<a
					href="https://visioncreator.earth/en/privacy-policy"
					class="underline hover:text-primary-300 transition-colors duration-200">Privacy Policy</a
				>.
			</p>
		</div>
	{/if}
</div>

<style>
	.newsletter-content {
		min-height: 100%;
		height: 100%;
	}

	.card {
		border-radius: 1.5rem;
	}
</style>
