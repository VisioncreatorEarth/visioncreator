<script lang="ts">
	import { createQuery } from '$lib/wundergraph';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

	const checkoutId = $page.url.searchParams.get('checkout_id');

	const checkoutQuery = createQuery({
		operationName: 'polarGetCheckout',
		input: { checkoutId: checkoutId || '' },
		enabled: !!checkoutId
	});

	let pollInterval: NodeJS.Timeout;

	onMount(() => {
		if (!checkoutId) {
			goto('/me/subscriptions');
			return;
		}

		// Poll the checkout status every 2 seconds
		pollInterval = setInterval(async () => {
			await $checkoutQuery.refetch();

			if ($checkoutQuery.data?.status === 'succeeded') {
				clearInterval(pollInterval);
				// Wait 2 seconds before redirecting to show success message
				setTimeout(() => goto('/me'), 2000);
			}
		}, 2000);

		return () => {
			if (pollInterval) clearInterval(pollInterval);
		};
	});
</script>

<div class="container flex flex-col justify-center items-center px-4 mx-auto min-h-screen">
	{#if $checkoutQuery.isLoading}
		<div class="text-center">
			<h2 class="mb-4 text-2xl font-bold">Processing your payment...</h2>
			<p>Please wait while we confirm your payment.</p>
		</div>
	{:else if $checkoutQuery.error}
		<div class="text-center text-error-500">
			<h2 class="mb-4 text-2xl font-bold">Error</h2>
			<p>{$checkoutQuery.error.message}</p>
			<a href="/local/polar" class="mt-4 btn variant-filled-primary">Return to Plans</a>
		</div>
	{:else if $checkoutQuery.data?.status === 'succeeded'}
		<div class="text-center text-success-500">
			<h2 class="mb-4 text-2xl font-bold">Payment Successful!</h2>
			<p class="mb-8">Thank you for your purchase. Redirecting you back...</p>
		</div>
	{:else if $checkoutQuery.data?.status === 'confirmed'}
		<div class="text-center">
			<h2 class="mb-4 text-2xl font-bold">Almost there!</h2>
			<p>We're processing your payment. Please wait...</p>
		</div>
	{:else if $checkoutQuery.data?.status === 'failed'}
		<div class="text-center text-error-500">
			<h2 class="mb-4 text-2xl font-bold">Payment Failed</h2>
			<p>There was an error processing your payment.</p>
			<a href="/local/polar" class="mt-4 btn variant-filled-primary">Try Again</a>
		</div>
	{:else}
		<div class="text-center">
			<h2 class="mb-4 text-2xl font-bold">Processing Payment</h2>
			<p>Please wait while we process your payment...</p>
		</div>
	{/if}
</div>
