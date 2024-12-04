<script lang="ts">
	import { createQuery, createMutation } from '$lib/wundergraph';
	import { page } from '$app/stores';

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
	}

	const subscriptionsQuery = createQuery<SubscriptionsQueryResult>({
		operationName: 'myPolarSubscriptions',
		input: {
			active: undefined
		}
	});

	$: if ($subscriptionsQuery.data) {
		console.log('Subscriptions Query Data:', {
			subscriptions: $subscriptionsQuery.data.subscriptions,
			count: $subscriptionsQuery.data.subscriptions?.length
		});
	}

	$: if ($subscriptionsQuery.error) {
		console.error('Subscriptions Query Error:', $subscriptionsQuery.error);
	}

	const updateSubscriptionMutation = createMutation({
		operationName: 'updatePolarSubscription'
	});

	interface Benefits {
		'free-product': {
			icon: string;
			text: string;
		}[];
		default: {
			icon: string;
			text: string;
		}[];
	}

	const benefits: Benefits = {
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

	function getStatusColor(subscription: Subscription): string {
		if (subscription.status === 'active') {
			return subscription.cancel_at_period_end ? 'text-warning-500' : 'text-success-500';
		}
		return 'text-error-500';
	}

	function getDetailedStatus(subscription: Subscription): { status: string; detail?: string } {
		if (subscription.status === 'active') {
			if (subscription.cancel_at_period_end) {
				return {
					status: 'Canceled',
					detail: `Active until ${formatDate(subscription.current_period_end)}`
				};
			}
			return { status: 'Active' };
		}
		return { status: subscription.status };
	}

	function isCurrentPlan(product: Product): boolean {
		if (!$subscriptionsQuery.data?.subscriptions?.length) return product.id === 'free-product';

		return $subscriptionsQuery.data.subscriptions.some(
			(sub) => sub.product.id === product.id && sub.status === 'active'
		);
	}

	function getButtonText(product: Product): string {
		console.log('getButtonText called with product:', {
			id: product.id,
			name: product.name,
			subscriptionsLoading: $subscriptionsQuery.isLoading,
			subscriptionsData: $subscriptionsQuery.data
		});

		// Return loading state if subscriptions are still loading
		if ($subscriptionsQuery.isLoading) {
			console.log('Subscriptions still loading...');
			return 'Loading...';
		}

		// Ensure we have subscription data
		if (!$subscriptionsQuery.data) {
			console.log('No subscription data available yet');
			return 'Loading...';
		}

		if (!$subscriptionsQuery.data.subscriptions?.length) {
			const buttonText = product.id === 'free-product' ? 'Current Plan' : 'Select Plan';
			console.log('No active subscriptions, returning:', buttonText);
			return buttonText;
		}

		const activeSub = $subscriptionsQuery.data.subscriptions.find(
			(sub) => sub.product.id === product.id && sub.status === 'active'
		);

		console.log(
			'Active subscription found:',
			activeSub
				? {
						id: activeSub.id,
						status: activeSub.status,
						productId: activeSub.product.id,
						cancelAtPeriodEnd: activeSub.cancel_at_period_end
				  }
				: 'none'
		);

		if (activeSub) {
			const buttonText = activeSub.cancel_at_period_end
				? `Active until ${formatDate(activeSub.current_period_end)}`
				: 'Current Plan';
			console.log('Returning button text for active sub:', buttonText);
			return buttonText;
		}

		if ($checkoutMutation.isLoading) {
			console.log('Checkout in progress');
			return 'Processing...';
		}

		console.log('Default case - Select Plan');
		return 'Select Plan';
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
		const successUrl = `${origin}/me/subscriptions/success?checkout_id={CHECKOUT_ID}`;

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

	async function handlePlanChange(product: Product) {
		if (!product.prices || product.prices.length === 0) {
			console.error('No prices available for product');
			return;
		}

		const hasExistingSubscription = $subscriptionsQuery.data?.subscriptions?.length > 0;
		const activeSubscription = $subscriptionsQuery.data?.subscriptions?.find(
			(sub) => sub.status === 'active'
		);

		if (hasExistingSubscription && activeSubscription) {
			try {
				console.log('Updating subscription:', {
					subscriptionId: activeSubscription.id,
					productPriceId: product.prices[0].id,
					subscription: activeSubscription,
					product: product
				});

				const result = await $updateSubscriptionMutation.mutateAsync({
					subscriptionId: activeSubscription.id,
					productPriceId: product.prices[0].id
				});

				if (result.success && result.checkoutUrl) {
					window.location.href = result.checkoutUrl;
				} else {
					console.error('Failed to initiate subscription update:', result);
				}
			} catch (error) {
				console.error('Error updating subscription:', error);
			}
		} else {
			await handleCheckout(product);
		}
	}
</script>

<div class="container mx-auto mt-8 max-w-6xl">
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
							on:click={() => handlePlanChange(product)}
							disabled={isCurrentPlan(product) ||
								$checkoutMutation.isLoading ||
								$updateSubscriptionMutation.isLoading ||
								$subscriptionsQuery.isLoading}
						>
							{#if $updateSubscriptionMutation.isLoading}
								Updating...
							{:else if $subscriptionsQuery.isLoading}
								Loading...
							{:else}
								{getButtonText(product)}
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
	<div class="mx-auto mt-8 max-w-6xl">
		<h2 class="mb-4 text-2xl font-semibold dark:text-gray-200">Your Subscriptions</h2>
		<div
			class="relative overflow-x-auto shadow-md sm:rounded-lg max-h-[500px] bg-surface-50-900-token"
		>
			<table class="w-full text-sm text-left">
				<thead class="text-xs uppercase bg-surface-100-800-token">
					<tr>
						<th scope="col" class="px-6 py-3 text-surface-900-50-token"> Product </th>
						<th scope="col" class="px-6 py-3 text-surface-900-50-token"> Status </th>
						<th scope="col" class="px-6 py-3 text-surface-900-50-token"> Started </th>
						<th scope="col" class="px-6 py-3 text-surface-900-50-token"> Next Payment </th>
						<th scope="col" class="px-6 py-3 text-surface-900-50-token"> Amount </th>
						<th scope="col" class="px-6 py-3 text-surface-900-50-token"> Subscription ID </th>
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
							<td class="px-4 py-2">
								{#if subscription.status === 'active' && subscription.cancel_at_period_end}
									<div class="flex flex-col">
										<span class="font-medium text-warning-500">
											{getDetailedStatus(subscription).status}
										</span>
										<span class="text-sm text-warning-500/75">
											{getDetailedStatus(subscription).detail}
										</span>
									</div>
								{:else}
									<span class={getStatusColor(subscription)}>
										{getDetailedStatus(subscription).status}
									</span>
								{/if}
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
								{subscription.id}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</div>
{/if}
