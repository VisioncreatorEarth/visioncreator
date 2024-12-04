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

	interface Subscription {
		id: string;
		status: string;
		started_at: string;
		ended_at: string | null;
		current_period_end: string;
		cancel_at_period_end: boolean;
		product: {
			id: string;
			name: string;
		};
		amount: number;
		currency: string;
		recurring_interval: string;
		metadata: {
			userId: string;
		};
		user: {
			email: string;
			name: string;
		};
	}

	interface SubscriptionsQueryResult {
		subscriptions: Subscription[];
		total: number;
		page: number;
		limit: number;
	}

	const subscriptionsQuery = createQuery<SubscriptionsQueryResult>({
		operationName: 'myPolarSubscriptions',
		input: {
			page: 1,
			limit: 10
		}
	});

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

	function formatPrice(price: Price): string {
		const amount = (price.amount / 100).toFixed(2);
		return `${amount} ${price.interval}`;
	}

	function formatAmount(amount: number, currency: string): string {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: currency
		}).format(amount / 100);
	}

	function formatDate(dateString: string): string {
		const date = new Date(dateString);
		return new Intl.DateTimeFormat('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		}).format(date);
	}

	function getStatusColor(status: string): string {
		switch (status.toLowerCase()) {
			case 'active':
				return 'text-green-600 dark:text-green-400';
			case 'canceled':
				return 'text-red-600 dark:text-red-400';
			case 'past_due':
				return 'text-yellow-600 dark:text-yellow-400';
			default:
				return 'text-gray-600 dark:text-gray-400';
		}
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

	function getBenefits(productId: string) {
		return benefits[productId] || benefits.default;
	}

	function getDetailedStatus(subscription: Subscription): string {
		const status = subscription.status.toLowerCase();
		const endDate = formatDate(subscription.current_period_end);
		
		if (status === 'active') {
			if (subscription.cancel_at_period_end) {
				return `Active until ${endDate}`;
			}
			return `Active, renews on ${endDate}`;
		} else if (status === 'canceled') {
			return `Canceled, ends on ${endDate}`;
		} else if (status === 'past_due') {
			return `Payment overdue since ${endDate}`;
		}
		return subscription.status;
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

{#if $subscriptionsQuery.data?.subscriptions?.length > 0}
	<div class="mt-8">
		<h2 class="text-2xl font-semibold mb-4 dark:text-gray-200">Your Subscriptions</h2>
		<div class="relative overflow-x-auto shadow-md sm:rounded-lg max-h-[500px] bg-surface-50-900-token">
			<table class="w-full text-sm text-left">
				<thead class="text-xs uppercase bg-surface-100-800-token">
					<tr>
						<th scope="col" class="px-6 py-3 text-surface-900-50-token">
							Product
						</th>
						<th scope="col" class="px-6 py-3 text-surface-900-50-token">
							Status
						</th>
						<th scope="col" class="px-6 py-3 text-surface-900-50-token">
							Started
						</th>
						<th scope="col" class="px-6 py-3 text-surface-900-50-token">
							Next Payment
						</th>
						<th scope="col" class="px-6 py-3 text-surface-900-50-token">
							Amount
						</th>
						<th scope="col" class="px-6 py-3 text-surface-900-50-token">
							User ID
						</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-surface-200-700-token">
					{#each $subscriptionsQuery.data.subscriptions as subscription}
						<tr class="bg-surface-50-900-token hover:bg-surface-100-800-token">
							<td class="px-6 py-4 font-medium text-surface-900-50-token">
								{subscription.product.name}
								<div class="text-xs text-surface-600-300-token">
									{subscription.recurring_interval}ly
								</div>
							</td>
							<td class="px-6 py-4">
								<span class={`${getStatusColor(subscription.status)} font-medium`}>
									{getDetailedStatus(subscription)}
								</span>
							</td>
							<td class="px-6 py-4 text-surface-600-300-token">
								{formatDate(subscription.started_at)}
							</td>
							<td class="px-6 py-4 text-surface-600-300-token">
								{formatDate(subscription.current_period_end)}
							</td>
							<td class="px-6 py-4 text-surface-600-300-token">
								{formatAmount(subscription.amount, subscription.currency)}
							</td>
							<td class="px-6 py-4 text-surface-600-300-token">
								{subscription.metadata.userId}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</div>
{/if}
