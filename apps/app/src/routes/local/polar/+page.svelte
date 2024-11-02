<script lang="ts">
	import { createQuery } from '$lib/wundergraph';

	interface Price {
		priceAmount: number;
		priceCurrency: string;
		recurringInterval?: string;
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

	function formatPrice(price: Price): string {
		const amount = (price.priceAmount / 100).toFixed(2);
		const currency = price.priceCurrency.toUpperCase();
		return `${amount} ${currency}`;
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
				<div class="flex flex-col h-full p-6 card variant-filled-surface-900">
					<header class="mb-4 card-header">
						<h2 class="h1 text-7xl">{product.name}</h2>
					</header>
					<section class="flex-grow">
						{#if product.prices && product.prices.length > 0}
							<div class="flex items-baseline mb-4">
								<span class="text-4xl font-bold">{formatPrice(product.prices[0])}</span>
								{#if product.prices[0].recurringInterval}
									<span class="ml-1 text-lg opacity-75">
										{getIntervalLabel(product.prices[0].recurringInterval)}
									</span>
								{/if}
							</div>
						{:else}
							<p class="mb-4 text-lg italic">Price not available</p>
						{/if}
						<p class="mb-6 text-sm opacity-75">{product.description}</p>
						<ul class="mb-6 space-y-2">
							{#each getBenefits(product.id) as benefit}
								<li class="flex items-center">
									<Icon icon={benefit.icon} class="mr-2 text-primary-500" />
									<span>{benefit.text}</span>
								</li>
							{/each}
						</ul>
					</section>
					<footer class="mt-auto card-footer">
						<button class="w-full btn variant-filled-primary">Select Plan</button>
					</footer>
				</div>
			{/each}
		</div>
	{:else}
		<p class="text-center">No products found.</p>
	{/if}
</div>
