<script lang="ts">
	import { createQuery, createMutation } from '$lib/wundergraph';
	import { onMount } from 'svelte';

	export let me;

	let showBanner = false;
	let showSuccessBanner = false;
	let showErrorBanner = false;

	$: newsletterStatus = createQuery({
		operationName: 'MyNewsletterStatus',
		input: {
			id: $me.session?.user?.id,
			email: $me.session?.user?.email
		},
		liveQuery: true
	});

	const toggleNewsletterMutation = createMutation({
		operationName: 'NewsletterToggle'
	});

	const handleSubscribe = async () => {
		if (!$me.session?.user?.id || !$me.session?.user?.email) {
			return;
		}

		showSuccessBanner = true;
		showBanner = false;

		try {
			const response = await $toggleNewsletterMutation.mutateAsync({
				id: $me.session.user.id,
				email: $me.session.user.email
			});
			console.log('Subscribe newsletter response:', response);
			await $newsletterStatus.refetch();

			setTimeout(() => {
				showSuccessBanner = false;
			}, 6000); // Hide success banner after 7 seconds
		} catch (error) {
			console.error('Error during newsletter subscription:', error);
			showSuccessBanner = false;
			showErrorBanner = true;
			setTimeout(() => {
				showErrorBanner = false;
				showBanner = true;
			}, 5000); // Hide error banner and show original banner after 5 seconds
		}
	};

	onMount(() => {
		setTimeout(() => {
			showBanner = true;
		}, 2000);
	});
</script>

{#if showSuccessBanner}
	<div
		class="w-full max-w-6xl p-2 @3xl:p-6 overflow-auto text-center rounded-3xl bg-success-600 flex flex-col items-center justify-center space-y-4 transition-all duration-300 ease-in-out"
	>
		<h3 class="text-2xl font-bold text-white">Welcome to the Visioncreator Family!</h3>
		<p class="text-lg text-white">
			You're now part of something extraordinary. Together, we'll shape the future and inspire
			millions. Get ready for an incredible journey!
		</p>
	</div>
{:else if showErrorBanner}
	<div
		class="w-full max-w-6xl p-2 @3xl:p-6 overflow-auto text-center rounded-3xl bg-error-700 flex flex-col items-center justify-center space-y-4 transition-all duration-300 ease-in-out"
	>
		<h3 class="text-2xl font-bold text-white">Oops! Something went wrong</h3>
		<p class="text-lg text-white">
			We couldn't subscribe you at this moment. Please try again in a few seconds.
		</p>
		<button type="button" class="btn btn-md variant-filled-tertiary" on:click={handleSubscribe}>
			Try Again
		</button>
	</div>
{:else if !$newsletterStatus.data && showBanner}
	<div
		class="w-full max-w-6xl p-2 @3xl:p-6 overflow-auto text-center rounded-3xl bg-secondary-800 flex flex-col items-center justify-center space-y-4 transition-all duration-300 ease-in-out"
	>
		<div class="text-lg rounded-lg flex flex-col items-center">
			<h3 class="text-2xl font-bold text-primary-300">
				Watch next video one week before the public
			</h3>
			<p class="mt-2">
				Subscribe to our weekly newsletter, to get early access to our video updates 1 week before
				the public and follow along our journey from 0 to 1 billion visioncreators.
			</p>
			<p class="text-2xs max-w-3xl mt-2 leading-snug text-center">
				*By pressing the subscribe button, you consent that we send you our weekly newsletter. You
				can revoke this consent at any time by clicking on the unsubscribe link in our newsletter
				mails or via this dashboard, when you are logged in. Here you can find our
				<a href="https://visioncreator.earth/en/privacy-policy" class="underline">Privacy Policy</a
				>.
			</p>
		</div>

		<button type="button" class="btn btn-md variant-filled-tertiary" on:click={handleSubscribe}>
			Subscribe to Visionletter
		</button>
	</div>
{/if}
