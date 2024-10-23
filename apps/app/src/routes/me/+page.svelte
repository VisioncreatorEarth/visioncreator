<script lang="ts">
	import { createMutation, createQuery } from '$lib/wundergraph';
	import { futureMe, Me } from '$lib/stores';
	import { onMount } from 'svelte';
	import { view as meView } from '$lib/views/Me';
	import ComposeView from '$lib/components/ComposeView.svelte';
	import { dynamicView } from '$lib/stores';

	export let data;

	let { session, supabase } = data;
	$: ({ session } = data);

	let showComposeView = false;

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

	onMount(async () => {
		const supabaseMe = await supabase.auth.getUser();
		Me.update((store) => ({ ...store, id: supabaseMe.data.user?.id || '' }));

		if (!supabaseMe.data.user?.user_metadata.inviter && !supabaseMe.data.user?.user_metadata.name) {
			try {
				await supabase.auth.updateUser({
					data: { inviter: $futureMe.visionid, name: $futureMe.name || 'UpdateMyName' }
				});

				await $updateNameMutation.mutateAsync({
					id: session.user.id,
					name: $futureMe.name
				});

				await $createInviteMutation.mutateAsync({
					invitee: session.user.id,
					inviter: $futureMe.visionid
				});

				$meQuery.refetch();
			} catch (error) {
				console.error('Error during signup process:', error);
			}
		}
	});

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
		}
	}

	// Subscribe to the store
	$: currentView = $dynamicView.view;

	function handleViewUpdate(event: CustomEvent) {
		console.log('View update received:', event.detail); // Debug log
		if (event.detail && event.detail.view) {
			dynamicView.update((store) => ({
				...store,
				view: event.detail.view
			}));
		}
	}

	// Debug: Watch for view changes
	$: if (currentView) {
		console.log('Current view updated:', currentView);
	}
</script>

<svelte:window on:updateView={handleViewUpdate} />

{#if $meQuery.isLoading}
	<div class="flex items-center justify-center h-screen">Loading...</div>
{:else if meData && !meData.onboarded}
	{#if !showComposeView}
		<div class="flex items-center justify-center w-full min-h-screen px-4 sm:px-6 md:px-8">
			<div class="w-full max-w-3xl">
				<SubscribeToNewsletter
					userId={session.user.id}
					userEmail={session.user.email || ''}
					on:next={handleNewsletterCompleted}
				/>
			</div>
		</div>
	{:else}
		<ComposeView view={currentView || meView} {session} />
	{/if}
{:else if meData}
	<ComposeView view={currentView || meView} {session} />
{:else}
	<div class="flex items-center justify-center h-screen text-red-500">Error loading user data</div>
{/if}
