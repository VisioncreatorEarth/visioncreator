<script lang="ts">
	import { createMutation, createQuery } from '$lib/wundergraph';
	import { futureMe, Me, dynamicView } from '$lib/stores';
	import { view as meView } from '$lib/views/Me';

	export let data;

	let { session, supabase } = data;
	$: ({ session } = data);

	let showComposeView = false;
	let initialSetupComplete = false;

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
		<ComposeView view={$dynamicView.view || meView} />
	{/if}
{:else if meData}
	<ComposeView view={$dynamicView.view || meView} />
{:else}
	<div class="flex justify-center items-center h-screen text-red-500">Error loading user data</div>
{/if}
