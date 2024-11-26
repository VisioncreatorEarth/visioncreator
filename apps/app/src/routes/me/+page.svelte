<script lang="ts">
	import { createMutation, createQuery } from '$lib/wundergraph';
	import { futureMe, Me, dynamicView } from '$lib/stores';
	import { view as meView } from '$lib/views/Me';
	import { onMount } from 'svelte';

	export let data;

	let { session, supabase } = data;
	$: ({ session } = data);

	let showComposeView = false;
	let initialSetupComplete = false;
	let selectedView: any = null;
	let isAsideOpen = true;
	let isMobile = false;

	onMount(() => {
		checkMobile();
		window.addEventListener('resize', checkMobile);
		return () => window.removeEventListener('resize', checkMobile);
	});

	function checkMobile() {
		isMobile = window.innerWidth < 768;
		isAsideOpen = !isMobile;
	}

	function toggleAside() {
		isAsideOpen = !isAsideOpen;
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

	const viewsQuery = createQuery({
		operationName: 'queryMyViews'
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

	$: views = $viewsQuery.data?.views || [];

	function handleViewSelect(view: any) {
		selectedView = view;
		dynamicView.set({ view });
		if (isMobile) {
			isAsideOpen = false;
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

	function handleViewUpdate(event: CustomEvent) {
		const viewData = event.detail?.view;
		if (viewData) {
			dynamicView.set({ view: viewData });

			// Force re-render of ComposeView
			showComposeView = false;
			requestAnimationFrame(() => {
				showComposeView = true;
			});
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
		<div class="flex overflow-hidden h-screen">
			{#if isAsideOpen}
				<aside
					class="fixed bottom-0 right-0 z-10 flex-shrink-0 w-[120px] h-screen transition-transform duration-300 {!isAsideOpen
						? 'translate-x-full'
						: ''}"
				>
					<div class="flex flex-col h-full">
						<div class="flex-grow" />
						<div class="flex flex-col gap-2 items-end p-4 pr-2 mb-12">
							{#each views as view}
								<div
									on:click={() => handleViewSelect(view)}
									on:keydown={(e) => e.key === 'Enter' && handleViewSelect(view)}
									class="flex flex-col items-center justify-center w-[50px] h-[50px] transition-colors duration-200 rounded-lg cursor-pointer {selectedView
										?.metadata?.id === view.metadata.id
										? 'bg-surface-700/60 text-surface-200'
										: 'bg-surface-700/40 text-surface-400 hover:bg-surface-700/50'}"
									tabindex="0"
									role="button"
								>
									<Icon
										icon={view.metadata.name === 'MyDashboard'
											? 'mdi:account'
											: view.metadata.name === 'ShopWithMe'
											? 'mdi:shopping'
											: 'mdi:circle-outline'}
										class="w-6 h-6"
									/>
								</div>
							{/each}
						</div>
					</div>
				</aside>
			{/if}
			<button
				class="fixed bottom-4 right-[12px] z-50 p-2 rounded-full bg-surface-900 border border-surface-600 hover:bg-surface-800"
				on:click={toggleAside}
			>
				<Icon
					icon={isAsideOpen ? 'mdi:view-dashboard' : 'mdi:view-dashboard'}
					class="w-6 h-6 text-surface-200"
				/>
			</button>
			<main class="overflow-auto flex-1 mx-auto max-w-6xl">
				<ComposeView view={$dynamicView.view || meView} />
			</main>
		</div>
	{/if}
{:else if meData}
	<div class="flex overflow-hidden h-screen">
		{#if isAsideOpen}
			<aside
				class="fixed bottom-0 right-0 z-10 flex-shrink-0 w-[120px] h-screen transition-transform duration-300 {!isAsideOpen
					? 'translate-x-full'
					: ''}"
			>
				<div class="flex flex-col h-full">
					<div class="flex-grow" />
					<div class="flex flex-col gap-2 items-end p-4 pr-2 mb-12">
						{#each views as view}
							<div
								on:click={() => handleViewSelect(view)}
								on:keydown={(e) => e.key === 'Enter' && handleViewSelect(view)}
								class="flex flex-col items-center justify-center w-[50px] h-[50px] transition-colors duration-200 rounded-lg cursor-pointer {selectedView
									?.metadata?.id === view.metadata.id
									? 'bg-surface-700/60 text-surface-200'
									: 'bg-surface-700/40 text-surface-400 hover:bg-surface-700/50'}"
								tabindex="0"
								role="button"
							>
								<Icon
									icon={view.metadata.name === 'MyDashboard'
										? 'mdi:account'
										: view.metadata.name === 'ShopWithMe'
										? 'mdi:shopping'
										: 'mdi:circle-outline'}
									class="w-6 h-6"
								/>
							</div>
						{/each}
					</div>
				</div>
			</aside>
		{/if}
		<button
			class="fixed bottom-4 right-[12px] z-50 p-2 rounded-full bg-surface-900 border border-surface-600 hover:bg-surface-800"
			on:click={toggleAside}
		>
			<Icon
				icon={isAsideOpen ? 'mdi:view-dashboard' : 'mdi:view-dashboard'}
				class="w-6 h-6 text-surface-200"
			/>
		</button>
		<main class="overflow-auto flex-1 mx-auto max-w-6xl">
			<ComposeView view={$dynamicView.view || meView} />
		</main>
	</div>
{:else}
	<div class="flex justify-center items-center h-screen text-red-500">Error loading user data</div>
{/if}
