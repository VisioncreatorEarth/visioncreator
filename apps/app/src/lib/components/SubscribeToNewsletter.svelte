<script lang="ts">
	import { createQuery, createMutation } from '$lib/wundergraph';
	import { createEventDispatcher, onMount } from 'svelte';
	import { onboardingState, OnboardingState } from '$lib/stores';

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
			"You're now part of something extraordinary. Together, we'll shape the future and inspire 1 billion Visioncreators. Get ready for an incredible journey!";

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

	function handleNext() {
		onboardingState.set(OnboardingState.ShowTooltip);
		dispatch('next');
	}
</script>

<div class="newsletter-content w-full h-full flex items-center justify-center p-2 sm:p-4">
	{#if $newsletterStatus.isLoading}
		<div class="card p-4 w-full max-w-3xl bg-surface-700">
			<header class="card-header">
				<div class="placeholder animate-pulse w-2/3 h-8 mb-4" />
			</header>
			<section class="p-4 space-y-4">
				<div class="placeholder animate-pulse w-full h-4" />
				<div class="placeholder animate-pulse w-5/6 h-4" />
				<div class="placeholder animate-pulse w-4/6 h-4" />
			</section>
			<footer class="card-footer flex justify-end space-x-2">
				<div class="placeholder animate-pulse w-24 h-10" />
				<div class="placeholder animate-pulse w-24 h-10" />
			</footer>
		</div>
	{:else if showMessage}
		<div
			class="card variant-ghost-{messageType === 'success'
				? 'success'
				: 'secondary'} w-full h-full flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 lg:p-10"
		>
			<h3 class="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold mb-2 sm:mb-4">
				{messageType === 'success' ? 'Looking forward to next week' : 'Thank you'}
			</h3>
			<p class="text-xs sm:text-sm md:text-base lg:text-lg mb-4 sm:mb-6 text-center">
				{message}
			</p>
			<button
				on:click={handleNext}
				class="btn btn-sm sm:btn-md variant-ghost-{messageType === 'success'
					? 'success'
					: 'secondary'}"
			>
				Continue
			</button>
		</div>
	{:else}
		<div
			class="w-full h-full flex flex-col items-center justify-center text-center p-4 sm:p-6 md:p-8 lg:p-10 bg-secondary-800 rounded-3xl"
		>
			<h3
				class="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-primary-300 mb-2 sm:mb-4"
			>
				Watch next video one week before the public
			</h3>
			<p class="mt-1 sm:mt-2 text-xs sm:text-sm md:text-base lg:text-lg mb-4 sm:mb-6">
				Subscribe to our weekly newsletter to get early access to our video updates 1 week before
				the public and follow along our journey from 0 to 1 billion visioncreators.
			</p>
			<div class="flex flex-row space-x-2 sm:space-x-4 mb-4 sm:mb-6">
				<button class="btn btn-sm sm:btn-md variant-ghost-secondary" on:click={handleNoThanks}>
					No, thanks
				</button>
				<button class="btn btn-sm sm:btn-md variant-filled-primary" on:click={handleSubscribe}>
					Subscribe
				</button>
			</div>
			<p
				class="text-3xs sm:text-2xs md:text-xs lg:text-sm text-tertiary-300 max-w-xl leading-tight sm:leading-snug"
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

	@media (max-height: 500px) {
		.newsletter-content {
			padding: 0.5rem;
		}
	}
</style>
