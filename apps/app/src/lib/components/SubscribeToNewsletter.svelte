<script lang="ts">
	import { createQuery, createMutation } from '$lib/wundergraph';
	import { createEventDispatcher } from 'svelte';
	import { Me } from '$lib/stores';

	export let userEmail: string;

	const dispatch = createEventDispatcher();

	const newsletterStatus = createQuery({
		operationName: 'MyNewsletterStatus',
		input: { email: userEmail },
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
		message = "Next video is gonna sparkle. You've subscribed to something extraordinary. ";

		try {
			await $toggleNewsletterMutation.mutateAsync({ email: userEmail });
			Me.update((store) => ({ ...store, newsletter: true }));
		} catch (error) {
			console.error('Error during newsletter subscription:', error);
		}
	}

	function handleNoThanks() {
		showMessage = true;
		messageType = 'info';
		message = 'No worries! You can always subscribe later, if you change your mind.';
		Me.update((store) => ({ ...store, newsletter: false }));
	}

	function handleNext() {
		dispatch('next');
	}
</script>

<div class="flex justify-center items-center p-2 w-full h-full newsletter-content sm:p-4">
	{#if $newsletterStatus.isLoading}
		<div class="p-4 w-full max-w-3xl card bg-surface-700">
			<header class="card-header">
				<div class="mb-4 w-2/3 h-8 animate-pulse placeholder" />
			</header>
			<section class="p-4 space-y-4">
				<div class="w-full h-4 animate-pulse placeholder" />
				<div class="w-5/6 h-4 animate-pulse placeholder" />
				<div class="w-4/6 h-4 animate-pulse placeholder" />
			</section>
			<footer class="flex justify-end space-x-2 card-footer">
				<div class="w-24 h-10 animate-pulse placeholder" />
				<div class="w-24 h-10 animate-pulse placeholder" />
			</footer>
		</div>
	{:else if showMessage}
		<div
			class="flex flex-col justify-center items-center p-4 w-full h-full rounded-3xl card variant-ghost-secondary sm:p-6 md:p-8 lg:p-10 bg-secondary-800"
		>
			<h3
				class="mb-2 text-lg font-bold sm:text-xl md:text-2xl lg:text-3xl text-primary-300 sm:mb-4"
			>
				{messageType === 'success' ? 'Get ready for an incredible ride!' : 'Maybe next time.'}
			</h3>
			<p
				class="mb-4 text-xs text-center sm:text-sm md:text-base lg:text-lg sm:mb-6 text-tertiary-300"
			>
				{message}
			</p>
			<button on:click={handleNext} class="btn btn-sm sm:btn-md variant-ghost-secondary">
				Continue
			</button>
		</div>
	{:else}
		<div
			class="flex flex-col justify-center items-center p-4 w-full h-full text-center rounded-3xl sm:p-6 md:p-8 lg:p-10 bg-secondary-800"
		>
			<h3
				class="mb-2 text-lg font-bold sm:text-xl md:text-2xl lg:text-3xl text-primary-300 sm:mb-4"
			>
				Receive weekly Visionletter
			</h3>
			<p class="mt-1 mb-4 text-xs sm:mt-2 sm:text-sm md:text-base lg:text-lg sm:mb-6">
				Subscribe to our weekly video updates to follow along our journey.
			</p>
			<div class="flex flex-row mb-4 space-x-2 sm:space-x-4 sm:mb-6">
				<button class="btn btn-sm sm:btn-md variant-ghost-secondary" on:click={handleNoThanks}>
					No, thanks
				</button>
				<button class="btn btn-sm sm:btn-md variant-filled-primary" on:click={handleSubscribe}>
					Subscribe
				</button>
			</div>
			<p
				class="max-w-xl leading-tight text-3xs sm:text-2xs md:text-xs text-tertiary-300 sm:leading-snug"
			>
				*By pressing the subscribe button, you consent that we send you our weekly newsletter. You
				can revoke this consent at any time by clicking on the unsubscribe link in our newsletter
				mails or via dashboard, when you are logged in. Here you can find our
				<a
					href="https://visioncreator.earth/en/privacy-policy"
					class="underline transition-colors duration-200 hover:text-primary-300">Privacy Policy</a
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
