<script lang="ts">
	import { createMutation, createQuery } from '$lib/wundergraph';
	import { futureMe, Me } from '$lib/stores';
	import { onMount } from 'svelte';
	import { view as meView } from '$lib/views/Me';

	export let data;

	let { session, supabase } = data;
	$: ({ session } = data);

	let showNewsletter = false;
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

	$: if ($meQuery.data) {
		Me.update((store) => ({
			...store,
			id: $meQuery.data.id,
			name: $meQuery.data.name,
			onboarded: $meQuery.data.onboarded
		}));
	}

	function handleSkip() {
		showNewsletter = true;
	}

	function handleVideoEnded() {
		handleSkip();
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
</script>

{#if $meQuery.isLoading}
	<div class="flex items-center justify-center h-screen">Loading...</div>
{:else if $meQuery.data && !$meQuery.data.onboarded}
	{#if !showNewsletter}
		<div class="flex flex-col items-center justify-center h-screen text-center">
			<h1 class="text-4xl font-bold mb-2">Phenomenal</h1>
			<p class="text-xl mb-4">Your are now a pioneer, peaking into the future</p>
			<div class="w-full max-w-3xl mb-4">
				<VideoPlayer on:videoEnded={handleVideoEnded} />
			</div>
			<button on:click={handleSkip} class="btn btn-sm variant-ghost-secondary"> Skip </button>
		</div>
	{:else if !showComposeView}
		<div class="w-full px-4 sm:px-6 md:px-8 flex justify-center items-center min-h-screen">
			<div class="w-full max-w-3xl">
				<SubscribeToNewsletter
					userId={session.user.id}
					userEmail={session.user.email || ''}
					on:next={handleNewsletterCompleted}
				/>
			</div>
		</div>
	{:else}
		<ComposeView view={meView} {session} />
	{/if}
{:else if $meQuery.data}
	<ComposeView view={meView} {session} />
{:else}
	<div class="flex items-center justify-center h-screen text-red-500">Error loading user data</div>
{/if}
