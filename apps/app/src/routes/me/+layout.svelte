<script lang="ts">
	import { page } from '$app/stores';
	import { browser } from '$app/environment';
	import { dynamicView, futureMe } from '$lib/stores';
	import { goto } from '$app/navigation';
	import ComposeView from '$lib/components/ComposeView.svelte';
	import { view as meView } from '$lib/views/Me';
	import { view as hominioShopView } from '$lib/views/HominioShopWithMe';
	import { view as hominioDoView } from '$lib/views/HominioDoMe';
	import { view as hominioBankView } from '$lib/views/HominioBankMe';
	import { view as hominioHostView } from '$lib/views/HominioHostMe';
	import { view as leaderboardView } from '$lib/views/Leaderboard';
	import { view as episodesView } from '$lib/views/Episodes';
	import { view as proposalsView } from '$lib/views/Proposals';
	import { createMutation, createQuery } from '$lib/wundergraph';
	import SubscribeToNewsletter from '$lib/components/SubscribeToNewsletter.svelte';

	export let data;
	let { session } = data;
	$: ({ session } = data);

	let initialSetupComplete = false;

	// Map of view names to their corresponding view objects
	const viewMap = {
		HominioShopWithMe: hominioShopView,
		HominioDoMe: hominioDoView,
		HominioBankMe: hominioBankView,
		HominioHostMe: hominioHostView,
		Episodes: episodesView,
		Proposals: proposalsView,
		Leaderboard: leaderboardView,
		Me: meView
	};

	interface MeQueryResult {
		id: string;
		name: string;
		onboarded: boolean;
		active: boolean;
	}

	$: meQuery = createQuery<MeQueryResult>({
		operationName: 'queryMe'
	});

	$: meData = $meQuery.data as MeQueryResult | null;

	const onboardMeMutation = createMutation({
		operationName: 'onboardMe'
	});

	const toggleOnboardedMutation = createMutation({
		operationName: 'toggleOnboarded'
	});

	async function handleInitialSetup() {
		if (!initialSetupComplete && session?.user && $futureMe.visionid) {
			try {
				await $onboardMeMutation.mutateAsync({
					name: $futureMe.name || '',
					inviter: $futureMe.visionid
				});
				await $meQuery.refetch();
				initialSetupComplete = true;
			} catch (error) {
				console.error('Error during initial setup:', error);
			}
		}
	}

	async function handleNewsletterCompleted() {
		try {
			await $toggleOnboardedMutation.mutateAsync();
			await $meQuery.refetch();
		} catch (error) {
			console.error('Error updating onboarded status:', error);
		}
	}

	// Handle initial setup on mount and when session changes
	$: if (session?.user && !initialSetupComplete) {
		handleInitialSetup();
	}

	// Check if the current route is exactly /me
	$: if (browser && $page.url.pathname === '/me') {
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

{#if $meQuery.isLoading}
	<div class="flex items-center justify-center h-screen">Loading...</div>
{:else if meData && !meData.onboarded}
	<div class="flex items-center justify-center w-full min-h-screen px-4 sm:px-6 md:px-8">
		<div class="w-full max-w-3xl">
			<SubscribeToNewsletter
				userEmail={session.user.email || ''}
				on:next={handleNewsletterCompleted}
			/>
		</div>
	</div>
{:else if !meData}
	<div class="flex items-center justify-center h-screen text-red-500">Error loading user data</div>
{:else}
	<slot />

	{#if $dynamicView.view}
		<ComposeView view={$dynamicView.view} />
	{/if}
{/if}
