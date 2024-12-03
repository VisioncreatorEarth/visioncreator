<script lang="ts">
	import { createQuery, createMutation } from '$lib/wundergraph';
	import { page } from '$app/stores';
	import Icon from '@iconify/svelte';

	interface Price {
		id: string;
		amount: number;
		interval: string;
	}

	interface Product {
		id: string;
		name: string;
		description: string;
		isRecurring: boolean;
		prices: Price[];
	}

	interface ProductsQueryResult {
		products?: Product[];
		error?: string;
	}

	const productsQuery = createQuery<ProductsQueryResult>({
		operationName: 'polarListProducts'
	});

	const queryMe = createQuery({
		operationName: 'queryMe'
	});

	const checkoutMutation = createMutation({
		operationName: 'polarCreateCheckout'
	});

	function formatPrice(price: Price): string {
		const amount = (price.amount / 100).toFixed(2);
		return `${amount} ${price.interval}`;
	}

	function getIntervalLabel(interval: string): string {
		switch (interval) {
			case 'month':
				return '/mo';
			case 'year':
				return '/yr';
			default:
				return `/${interval}`;
		}
	}

	const benefits = {
		'free-product': [
			{ icon: 'mdi:open-source-initiative', text: 'Open Source' },
			{ icon: 'mdi:server', text: 'Self-hosted' },
			{ icon: 'mdi:key-variant', text: 'Bring Your Own API Key' },
			{ icon: 'mdi:infinity', text: 'Unlimited Projects' }
		],
		default: [
			{ icon: 'mdi:check-circle', text: 'Premium Support' },
			{ icon: 'mdi:rocket-launch', text: 'Advanced Features' },
			{ icon: 'mdi:chart-line', text: 'Analytics Dashboard' },
			{ icon: 'mdi:account-group', text: 'Team Collaboration' }
		]
	};

	function getBenefits(productId: string) {
		return benefits[productId] || benefits.default;
	}

	async function handleCheckout(product: Product) {
		if (!product.prices || product.prices.length === 0) {
			console.error('No prices available for product');
			return;
		}

		const priceId = product.prices[0].id;
		if (!priceId) {
			console.error('No price ID available');
			return;
		}

		const origin = $page.url.origin;
		const successUrl = `${origin}/local/polar/success?checkout_id={CHECKOUT_ID}`;

		try {
			const result = await $checkoutMutation.mutateAsync({
				productPriceId: priceId,
				successUrl,
				customerEmail: $page.data.session?.user?.email,
				customerName: $queryMe.data?.name
			});

			if (result.success && result.checkoutUrl) {
				window.location.href = result.checkoutUrl;
			} else {
				console.error('Failed to create checkout:', result.error);
			}
		} catch (error) {
			console.error('Error during checkout:', error);
		}
	}
</script>

<div class="container px-4 py-8 mx-auto">
	<h1 class="mb-8 text-3xl font-bold text-center">Choose Your Plan</h1>

	{#if $productsQuery.isLoading}
		<p class="text-center">Loading products...</p>
	{:else if $productsQuery.error}
		<p class="text-center text-error-500">Error: {$productsQuery.error}</p>
	{:else if $productsQuery.data?.products && $productsQuery.data.products.length > 0}
		<div class="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
			{#each $productsQuery.data.products as product (product.id)}
				<div class="flex flex-col p-6 h-full card variant-filled-surface-900">
					<header class="mb-4 card-header">
						<h2 class="text-4xl h2">{product.name}</h2>
					</header>
					<section class="flex-grow">
						{#if product.prices && product.prices.length > 0}
							<div class="flex flex-col gap-4">
								<div class="text-5xl font-bold">
									{#if product.prices[0].amount === 0}
										Free
									{:else}
										${(product.prices[0].amount / 100).toFixed(2)}
									{/if}
									<span class="text-2xl font-normal">/ {product.prices[0].interval}</span>
								</div>
								<p class="text-lg">{product.description}</p>
							</div>
						{/if}
					</section>
					<footer class="mt-auto card-footer">
						<button
							class="w-full btn variant-filled-primary"
							on:click={() => handleCheckout(product)}
							disabled={product.id === 'free-product' || $checkoutMutation.isLoading}
						>
							{#if $checkoutMutation.isLoading}
								Processing...
							{:else}
								{product.id === 'free-product' ? 'Current Plan' : 'Select Plan'}
							{/if}
						</button>
					</footer>
				</div>
			{/each}
		</div>
	{:else}
		<p class="text-center">No products found.</p>
	{/if}
</div>
