<script>
	import { onMount } from 'svelte';
	import { PolarEmbedCheckout } from '@polar-sh/checkout/embed';

	onMount(() => {
		PolarEmbedCheckout.init();
	});
</script>

<div class="flex flex-col gap-6">
	<div class="p-6 card bg-surface-100">
		<h3 class="mb-4 h3">Monthly Plan</h3>
		<ul class="mb-4 space-y-2 list-disc list-inside">
			<li>Full access to all features</li>
			<li>Priority support</li>
			<li>Early access to new features</li>
			<li>No usage limits</li>
		</ul>
		<a
			href="https://sandbox-api.polar.sh/v1/checkout-links/polar_cl_XuT1s3CRatVEB94tWBZS1vpY3bbJ7dcXGWAzsqTa9Hw/redirect"
			data-polar-checkout
			data-polar-checkout-theme="dark"
		>
			Purchase
		</a>
	</div>
</div>

<style>
	[data-polar-checkout] {
		display: inline-block;
		padding: 0.5rem 1rem;
		background-color: rgb(var(--color-primary-500));
		color: white;
		border-radius: 0.375rem;
		text-align: center;
		width: 100%;
	}
</style>
