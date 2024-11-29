<script lang="ts">
	import { createMutation, createQuery } from '$lib/wundergraph';
	import { futureMe, Me, dynamicView } from '$lib/stores';
	import { view as meView } from '$lib/views/Me';
	import { view as hominioShopView } from '$lib/views/HominioShopWithMe';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { browser } from '$app/environment';

	export let data;

	let { session, supabase } = data;
	$: ({ session } = data);

	let showComposeView = false;
	let initialSetupComplete = false;
	let selectedView: any = null;
	let isInitialized = false;

	// Set default view immediately to prevent flashing
	dynamicView.set(meView);

	// Query for user capabilities to determine available views
	const userCapabilitiesQuery = createQuery({
		operationName: 'queryMyCapabilities',
		enabled: true,
		refetchOnWindowFocus: true
	});

	$: hasRequiredCapability =
		$userCapabilitiesQuery.data?.capabilities?.some(
			(cap) =>
				cap.type === 'TIER' &&
				(['FREE Tier', 'HOMINIO Tier', 'HOMINIO PLUS Tier'].includes(cap.name) ||
					(cap.config?.tier && ['FREE', 'HOMINIO', 'HOMINIO_PLUS'].includes(cap.config.tier)))
		) ?? false;

	// Define available views matching ViewMenu structure
	$: viewsArray = [
		{
			metadata: {
				id: 'MyDashboard',
				name: 'MyDashboard',
				icon: 'mdi:account'
			},
			view: meView
		},
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
			: []),
		{
			metadata: {
				id: 'Episodes',
				name: 'Episodes',
				icon: 'mdi:play-circle'
			},
			view: {
				id: 'Episodes',
				layout: {
					areas: `"main"`,
					overflow: 'auto',
					style: 'mx-auto max-w-6xl'
				},
				children: [
					{
						id: 'episodes',
						component: 'Episodes',
						slot: 'main'
					}
				]
			}
		}
	];

	// Initialize view on mount
	onMount(() => {
		if (!isInitialized) {
			initializeView();
			isInitialized = true;
		}
	});

	// Watch for URL changes after initial load
	$: if (browser && $page && isInitialized) {
		initializeView();
	}

	function initializeView() {
		if (!browser) return;
		
		const viewParam = $page.url.searchParams.get('view');
		const viewItem = viewsArray.find(v => v.metadata.id === (viewParam || 'MyDashboard'));
		
		if (viewItem) {
			if (!$dynamicView || viewItem.view.id !== $dynamicView.id) {
				dynamicView.set(viewItem.view);
			}
		} else if (!$dynamicView || $dynamicView.id !== meView.id) {
			dynamicView.set(meView);
		}
	}

	const updateNameMutation = createMutation({
		operationName: 'updateMe'
	});

	const createInviteMutation = createMutation({
		operationName: 'createInvite'
	});

	const toggleOnboardedMutation = createMutation({
		operationName: 'toggleOnboarded'
	});

	interface MeQueryResult {
		id: string;
		name: string;
		onboarded: boolean;
	}

	$: meQuery = createQuery<MeQueryResult>({
		operationName: 'queryMe',
		input: { id: session?.user?.id || '' },
		enabled: !!session?.user?.id
	});

	$: meData = $meQuery.data as MeQueryResult | null;

	function handleViewSelect({ detail: { view } }: CustomEvent) {
		selectedView = view;
		dynamicView.set(view);
	}

	function handleEpisodesClick() {
		goto('/episodes');
	}

	function handleViewUpdate(event: CustomEvent) {
		const viewData = event.detail?.view;
		if (viewData) {
			dynamicView.set(viewData);

			// Force re-render of ComposeView
			showComposeView = false;
			requestAnimationFrame(() => {
				showComposeView = true;
			});
		}
	}

	async function handleInitialSetup() {
		if (!initialSetupComplete && session?.user) {
			const {
				data: { user }
			} = await supabase.auth.getUser();

			// Only proceed if we don't have an inviter set and have a visionid
			if (!user?.user_metadata.inviter && $futureMe.visionid) {
				try {
					// Update user metadata with inviter and name
					await supabase.auth.updateUser({
						data: {
							inviter: $futureMe.visionid,
							name: $futureMe.name || 'UpdateMyName'
						}
					});

					// Create invite relationship if we have a valid visionid
					if ($futureMe.visionid) {
						await $createInviteMutation.mutateAsync({
							invitee: session.user.id,
							inviter: $futureMe.visionid
						});

						// Update name in database if needed
						if ($futureMe.name) {
							await $updateNameMutation.mutateAsync({
								name: $futureMe.name
							});
						}
					}

					// Update Me store
					Me.update((store) => ({
						...store,
						id: session.user.id,
						name: $futureMe.name || 'UpdateMyName'
					}));

					// Refetch user data
					await $meQuery.refetch();

					console.log('Initial setup completed successfully');
				} catch (error) {
					console.error('Error during initial setup:', error);
					initialSetupComplete = true;
				}
			} else {
				console.log('No initial setup needed', {
					hasInviter: !!user?.user_metadata.inviter,
					hasVisionId: !!$futureMe.visionid
				});
			}

			initialSetupComplete = true;
		}
	}

	// Handle initial setup on mount and when session changes
	$: if (session?.user && !initialSetupComplete) {
		handleInitialSetup();
	}

	// Update Me store when meData changes
	$: if (meData) {
		Me.update((store) => ({
			...store,
			id: meData.id,
			name: meData.name,
			onboarded: meData.onboarded
		}));
	}

	async function handleNewsletterCompleted() {
		try {
			await $toggleOnboardedMutation.mutateAsync({
				id: session.user.id
			});

			await $meQuery.refetch();
			showComposeView = true;
		} catch (error) {
			console.error('Error updating onboarded status:', error);
			showComposeView = false;
		}
	}
</script>

<svelte:window on:updateView={handleViewUpdate} />

{#if $meQuery.isLoading}
	<div class="flex justify-center items-center h-screen">Loading...</div>
{:else if meData && !meData.onboarded}
	{#if !showComposeView}
		<div class="flex justify-center items-center px-4 w-full min-h-screen sm:px-6 md:px-8">
			<div class="w-full max-w-3xl">
				<SubscribeToNewsletter
					userId={session.user.id}
					userEmail={session.user.email || ''}
					on:next={handleNewsletterCompleted}
				/>
			</div>
		</div>
	{:else}
		<ComposeView view={$dynamicView} />
	{/if}
{:else if meData}
	<ComposeView view={$dynamicView} />
{:else}
	<div class="flex justify-center items-center h-screen text-red-500">Error loading user data</div>
{/if}
