<script lang="ts">
	import { createQuery, createMutation } from '$lib/wundergraph';
	import { page } from '$app/stores';
	import { dev } from '$app/environment';

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
		operationName: 'polarMySubscriptions',
		input: {
			active: undefined
		},
		liveQuery: true
	});

	$: isLoading = $subscriptionsQuery.isLoading || $productsQuery.isLoading;

	$: if ($subscriptionsQuery.isLoading) {
		console.log('Loading subscriptions...');
	}

	$: if ($subscriptionsQuery.data) {
		console.log('Subscriptions loaded:', $subscriptionsQuery.data);
	}

	$: if ($subscriptionsQuery.error) {
		console.error('Subscriptions Query Error:', $subscriptionsQuery.error);
	}

	const updateSubscriptionMutation = createMutation({
		operationName: 'polarUpdateSubscription'
	});

	interface Benefits {
		'free-product': {
			icon: string;
			text: string;
		}[];
		hominio: {
			icon: string;
			text: string;
		}[];
		visioncreator: {
			icon: string;
			text: string;
		}[];
	}

	const benefits: Benefits = {
		'free-product': [
			{ icon: 'mdi:clock-time-five-outline', text: '5 min Hominio talk time free' },
			{ icon: 'mdi:open-source-initiative', text: 'Self-host (Open Source)' },
			{ icon: 'mdi:tools', text: 'Use all skills (manually)' }
		],
		hominio: [
			{ icon: 'mdi:clock-outline', text: '60 min Hominio talk time per month' },
			{ icon: 'mdi:cart-outline', text: 'Smart Hominio shopping skill' },
			{ icon: 'mdi:checkbox-marked-circle-outline', text: 'Smart Hominio todo skill' }
		],
		visioncreator: [
			{ icon: 'mdi:clock', text: '240 min Hominio talk time per month' },
			{ icon: 'mdi:vote', text: 'Vote for new skills' },
			{ icon: 'mdi:cash-multiple', text: 'Earn new income streams' }
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
		if (isLoading) {
			return false;
		}

		if (!$subscriptionsQuery.data?.subscriptions?.length) {
			return product.id === 'free-product';
		}

		const activeSubscription = $subscriptionsQuery.data.subscriptions.find(
			(sub) => sub.status === 'active'
		);

		if (product.id === 'free-product') {
			return activeSubscription && activeSubscription.cancel_at_period_end;
		}

		return $subscriptionsQuery.data.subscriptions.some(
			(sub) => sub.product.id === product.id && sub.status === 'active'
		);
	}

	function getButtonText(product: Product): string {
		if (isLoading) {
			return 'Loading...';
		}

		if ($checkoutMutation.isLoading || $updateSubscriptionMutation.isLoading) {
			return 'Processing...';
		}

		if (!$subscriptionsQuery.data?.subscriptions?.length) {
			return product.id === 'free-product' ? 'Current Plan' : 'Select Plan';
		}

		const activeSubscription = $subscriptionsQuery.data.subscriptions.find(
			(sub) => sub.status === 'active'
		);

		if (product.id === 'free-product') {
			if (!activeSubscription) {
				return 'Current Plan';
			}
			return activeSubscription.cancel_at_period_end ? 'Select Plan' : 'Downgrade';
		}

		if (activeSubscription?.product.id === product.id) {
			return activeSubscription.cancel_at_period_end
				? `Active until ${formatDate(activeSubscription.current_period_end)}`
				: 'Current Plan';
		}

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
				console.log('Redirecting to Polar dashboard:', {
					subscriptionId: activeSubscription.id,
					isDev: dev
				});

				const baseUrl = dev ? 'https://sandbox.polar.sh' : 'https://polar.sh';
				window.location.href = `${baseUrl}/purchases/subscriptions/${activeSubscription.id}`;
			} catch (error) {
				console.error('Error redirecting to Polar dashboard:', error);
			}
		} else {
			await handleCheckout(product);
		}
	}
</script>

<div class="container mx-auto mt-8 max-w-6xl">
	<h1 class="mb-8 text-3xl font-bold text-center">Choose Your Plan</h1>

	{#if isLoading}
		<p class="text-center">Loading...</p>
	{:else if $productsQuery.error}
		<p class="text-center text-error-500">Error: {$productsQuery.error}</p>
	{:else if $productsQuery.data?.products && $productsQuery.data.products.length > 0}
		<div class="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
			{#each $productsQuery.data.products as product (product.id)}
				<div
					class="flex flex-col p-6 h-full card variant-filled-surface-900 {isCurrentPlan(product)
						? 'variant-filled-surface-700'
						: ''}"
				>
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
								<ul class="mt-4 space-y-3">
									{#each benefits[product.id === 'free-product' ? 'free-product' : product.name.toLowerCase()] as benefit}
										<li class="flex gap-2 items-center">
											<span class="text-xl text-primary-500">
												<iconify-icon icon={benefit.icon} />
											</span>
											<span>{benefit.text}</span>
										</li>
									{/each}
								</ul>
							</div>
						{/if}
					</section>
					<footer class="mt-6 card-footer">
						<button
							class="w-full btn bg-gradient-to-br variant-gradient-secondary-primary btn-md @3xl:btn-lg"
							on:click={() => handlePlanChange(product)}
							disabled={isCurrentPlan(product) ||
								$checkoutMutation.isLoading ||
								$updateSubscriptionMutation.isLoading ||
								$subscriptionsQuery.isLoading}
						>
							{#if $updateSubscriptionMutation.isLoading}
								<div class="flex gap-2 justify-center items-center">
									<svg
										class="w-4 h-4 animate-spin"
										xmlns="http://www.w3.org/2000/svg"
										fill="none"
										viewBox="0 0 24 24"
									>
										<circle
											class="opacity-25"
											cx="12"
											cy="12"
											r="10"
											stroke="currentColor"
											stroke-width="4"
										/>
										<path
											class="opacity-75"
											fill="currentColor"
											d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
										/>
									</svg>
									<span>Updating...</span>
								</div>
							{:else if $checkoutMutation.isLoading}
								<div class="flex gap-2 justify-center items-center">
									<svg
										class="w-4 h-4 animate-spin"
										xmlns="http://www.w3.org/2000/svg"
										fill="none"
										viewBox="0 0 24 24"
									>
										<circle
											class="opacity-25"
											cx="12"
											cy="12"
											r="10"
											stroke="currentColor"
											stroke-width="4"
										/>
										<path
											class="opacity-75"
											fill="currentColor"
											d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
										/>
									</svg>
									<span>Processing...</span>
								</div>
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
								{formatAmount(
									subscription.amount,
									subscription.currency
								)}/{subscription.recurring_interval}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</div>
{/if}
