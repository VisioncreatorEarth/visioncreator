<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import Icon from '@iconify/svelte';
	import { goto } from '$app/navigation';
	import { dynamicView } from '$lib/stores';
	import { page } from '$app/stores';
	import { view as meView } from '$lib/views/Leaderboard';
	import { view as hominioShopView } from '$lib/views/HominioShopWithMe';
	import { view as episodesView } from '$lib/views/Episodes';
	import { view as leaderboardView } from '$lib/views/Leaderboard';
	import { createQuery } from '$lib/wundergraph';

	export let showLabels = false;
	export let itemSize = 100;

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
	$: effectiveItemSize = isMobile ? 50 : isTablet ? 80 : 100;
	$: iconSize = isMobile ? 6 : isTablet ? 7 : 8;
	$: showEffectiveLabels = showLabels && !isMobile;

	$: hasRequiredCapability =
		$userCapabilitiesQuery.data?.capabilities?.some(
			(cap) =>
				cap.type === 'TIER' &&
				(['FREE Tier', 'HOMINIO Tier', 'VISIONCREATOR Tier'].includes(cap.name) ||
					(cap.config?.tier && ['FREE', 'HOMINIO', 'VISIONCREATOR'].includes(cap.config.tier)))
		) ?? false;

	$: views = [
		{
			metadata: {
				id: 'MyDashboard',
				name: 'MyDashboard',
				icon: 'mdi:account'
			},
			view: meView
		},
		// {
		// 	metadata: {
		// 		id: 'Leaderboard',
		// 		name: 'Leaderboard',
		// 		icon: 'mdi:trophy'
		// 	},
		// 	view: meView
		// },
		...(hasRequiredCapability
			? [
					{
						metadata: {
							id: 'HominioShopWithMe',
							name: 'ShopWithMe',
							icon: 'mdi:shopping'
						},
						view: hominioShopView
					}
			  ]
			: [])
		// {
		// 	metadata: {
		// 		id: 'Episodes',
		// 		name: 'Episodes',
		// 		icon: 'mdi:play-circle'
		// 	},
		// 	view: episodesView
		// }
	];

	function handleViewSelect(viewItem: any) {
		if (viewItem.metadata.id !== 'MyDashboard') {
			// Only add URL param for non-dashboard views
			const searchParams = new URLSearchParams($page.url.searchParams);
			searchParams.set('view', viewItem.metadata.id);
			goto(`/me?${searchParams.toString()}`);
		} else {
			// For dashboard, go to clean /me URL
			goto('/me');
		}
		dynamicView.set(viewItem.view);
		dispatch('viewSelect', { view: viewItem.view });
		dispatch('close');
	}

	$: activeViewId = $page.url.searchParams.get('view') || 'MyDashboard';
</script>

<div class="flex flex-wrap gap-2 px-4 pb-4 md:gap-3 lg:gap-4">
	{#each views as viewItem}
		<div
			on:click={() => handleViewSelect(viewItem)}
			on:keydown={(e) => e.key === 'Enter' && handleViewSelect(viewItem)}
			class="flex relative flex-col items-center justify-center transition-colors duration-200 rounded-lg cursor-pointer {activeViewId ===
			viewItem.metadata.id
				? 'bg-surface-600/70 text-surface-100'
				: 'bg-surface-600/50 text-surface-300 hover:bg-surface-600/60'}"
			style="width: {effectiveItemSize}px; height: {effectiveItemSize}px;"
			tabindex="0"
			role="button"
		>
			{#if activeViewId === viewItem.metadata.id}
				<div class="absolute bottom-0 left-1/2 w-8 h-0.5 -translate-x-1/2 bg-primary-500" />
			{/if}
			<Icon
				icon={viewItem.metadata.icon}
				class="w-{iconSize} h-{iconSize} {showEffectiveLabels ? 'mb-1 md:mb-2' : ''}"
			/>
			{#if showEffectiveLabels}
				<span class="text-xs md:text-sm">
					{viewItem.metadata.name === 'MyDashboard'
						? 'Me'
						: viewItem.metadata.name === 'ShopWithMe'
						? 'ShopWithMe'
						: viewItem.metadata.name}
				</span>
			{/if}
		</div>
	{/each}
</div>
