<script lang="ts">
	import { page } from '$app/stores';
	import { browser } from '$app/environment';
	import { dynamicView } from '$lib/stores';
	import { goto } from '$app/navigation';
	import ComposeView from '$lib/components/ComposeView.svelte';
	import { view as meView } from '$lib/views/Me';
	import { view as hominioShopView } from '$lib/views/HominioShopWithMe';
	import { view as hominioDoView } from '$lib/views/HominioDoMe';
	import { view as hominioBankView } from '$lib/views/HominioBankMe';
	import { view as hominioHostView } from '$lib/views/HominioHostMe';
	import { view as episodesView } from '$lib/views/Episodes';

	export let data;
	let { session } = data;
	$: ({ session } = data);

	// Map of view names to their corresponding view objects
	const viewMap = {
		HominioShopWithMe: hominioShopView,
		HominioDoMe: hominioDoView,
		HominioBankMe: hominioBankView,
		HominioHostMe: hominioHostView,
		Episodes: episodesView,
		Me: meView
	};

	// Watch for URL parameter changes and update view accordingly
	$: if (browser) {
		const viewParam = $page.url.searchParams.get('view');
		if (viewParam && !viewMap[viewParam]) {
			// If view doesn't exist, redirect to /me
			goto('/me', { replaceState: true });
		} else {
			const viewToSet = viewMap[viewParam] || meView;
			dynamicView.set({ view: viewToSet });
		}
	}
</script>

<slot />

{#if $dynamicView.view}
	<ComposeView view={$dynamicView.view} />
{/if}
