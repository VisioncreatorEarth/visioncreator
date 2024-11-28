<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import Icon from '@iconify/svelte';
	import { goto } from '$app/navigation';
	import { dynamicView } from '$lib/stores';
	import { page } from '$app/stores';
	import { view as meView } from '$lib/views/Me';
	import { view as hominioShopView } from '$lib/views/HominioShopWithMe';
	import { createQuery } from '$lib/wundergraph';

	export let layout: 'horizontal' | 'vertical' = 'vertical';
	export let showLabels = false;
	export let selectedView: any = null;
	export let itemSize = layout === 'horizontal' ? 100 : 50;

	const dispatch = createEventDispatcher();
	let isMobile: boolean;
	let isTablet: boolean;

	const userCapabilitiesQuery = createQuery({
		operationName: 'queryMyCapabilities',
		enabled: true,
		refetchOnWindowFocus: true
	});

	$: isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
	$: isTablet =
		typeof window !== 'undefined' && window.innerWidth >= 768 && window.innerWidth < 1024;
	$: effectiveItemSize = layout === 'horizontal' ? (isMobile ? 50 : isTablet ? 80 : 100) : 50;
	$: iconSize = layout === 'horizontal' ? (isMobile ? 6 : isTablet ? 7 : 8) : 6;
	$: showEffectiveLabels = showLabels && !isMobile;

	$: {
		console.log('User Capabilities Query Data:', $userCapabilitiesQuery.data);
		console.log('User Capabilities Array:', $userCapabilitiesQuery.data?.capabilities);
		if ($userCapabilitiesQuery.data?.capabilities) {
			console.log('Filtered Capabilities:', $userCapabilitiesQuery.data.capabilities.filter(cap => 
				cap.type === 'TIER' && (
					// Check both the name and the tier in config
					['FREE Tier', 'HOMINIO Tier', 'HOMINIO PLUS Tier'].includes(cap.name) ||
					(cap.config?.tier && ['FREE', 'HOMINIO', 'HOMINIO_PLUS'].includes(cap.config.tier))
				)
			));
		}
		console.log('Has Required Capability:', hasRequiredCapability);
	}

	$: hasRequiredCapability = $userCapabilitiesQuery.data?.capabilities?.some(
		(cap) => cap.type === 'TIER' && (
			// Check both the name and the tier in config
			['FREE Tier', 'HOMINIO Tier', 'HOMINIO PLUS Tier'].includes(cap.name) ||
			(cap.config?.tier && ['FREE', 'HOMINIO', 'HOMINIO_PLUS'].includes(cap.config.tier))
		)
	) ?? false;

	$: {
		console.log('Current views array:', views);
		console.log('hasRequiredCapability in views:', hasRequiredCapability);
	}

	$: containerClass =
		layout === 'horizontal'
			? 'flex flex-wrap gap-2 md:gap-3 lg:gap-4 px-4 pb-4'
			: 'flex flex-col gap-2 items-end p-4 pr-2 mb-12';

	$: views = [
		{
			metadata: {
				id: 'me',
				name: 'MyDashboard'
			},
			view: meView
		},
		...(hasRequiredCapability
			? [
					{
						metadata: {
							id: 'shop',
							name: 'ShopWithMe'
						},
						view: hominioShopView
					}
			  ]
			: [])
	];

	function handleViewSelect(view: any) {
		selectedView = view;
		dynamicView.set(view);
		if ($page.url.pathname !== '/me') {
			goto('/me');
		}
		dispatch('viewSelect', { view });
		dispatch('close');
	}

	function handleEpisodesClick() {
		goto('/episodes');
		dispatch('episodesClick');
		dispatch('close');
	}
</script>

<svelte:window on:resize={() => (isMobile = window.innerWidth < 768)} />

<div class={containerClass}>
	{#each views as view}
		<div
			on:click={() => handleViewSelect(view)}
			on:keydown={(e) => e.key === 'Enter' && handleViewSelect(view)}
			class="flex flex-col items-center justify-center transition-colors duration-200 rounded-lg cursor-pointer {selectedView
				?.metadata?.id === view.metadata.id
				? 'bg-surface-600/60 text-surface-200'
				: 'bg-surface-600/40 text-surface-400 hover:bg-surface-600/50'}"
			style="width: {effectiveItemSize}px; height: {effectiveItemSize}px;"
			tabindex="0"
			role="button"
		>
			<Icon
				icon={view.metadata.name === 'MyDashboard'
					? 'mdi:account'
					: view.metadata.name === 'ShopWithMe'
					? 'mdi:shopping'
					: view.metadata.name === 'DoWithMe'
					? 'mdi:check-circle'
					: 'mdi:circle-outline'}
				class="w-{iconSize} h-{iconSize} {showEffectiveLabels ? 'mb-1 md:mb-2' : ''}"
			/>
			{#if showEffectiveLabels}
				<span class="text-xs md:text-sm">
					{view.metadata.name === 'MyDashboard'
						? 'Me'
						: view.metadata.name === 'ShopWithMe'
						? 'ShopWithMe'
						: view.metadata.name === 'DoWithMe'
						? 'DoMe'
						: view.metadata.name}
				</span>
			{/if}
		</div>
	{/each}
	<div
		on:click={handleEpisodesClick}
		on:keydown={(e) => e.key === 'Enter' && handleEpisodesClick()}
		class="flex flex-col justify-center items-center rounded-lg transition-colors duration-200 cursor-pointer bg-surface-600/40 text-surface-400 hover:bg-surface-600/50"
		style="width: {effectiveItemSize}px; height: {effectiveItemSize}px;"
		tabindex="0"
		role="button"
	>
		<Icon
			icon="mdi:play-circle"
			class="w-{iconSize} h-{iconSize} {showEffectiveLabels ? 'mb-1 md:mb-2' : ''}"
		/>
		{#if showEffectiveLabels}
			<span class="text-xs md:text-sm">Episodes</span>
		{/if}
	</div>
</div>
