<script lang="ts">
	import { createMutation, createQuery } from '$lib/wundergraph';
	import { futureMe, Me } from '$lib/stores';
	import SubscribeToNewsletter from '$lib/components/SubscribeToNewsletter.svelte';

	export let data;
	let { session, supabase } = data;
	$: ({ session } = data);

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
		active: boolean;
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

			if (!user?.user_metadata.inviter && $futureMe.visionid) {
				try {
					await supabase.auth.updateUser({
						data: {
							inviter: $futureMe.visionid,
							name: user.user_metadata.name || $futureMe.name || 'UpdateMyName'
						}
					});

					if ($futureMe.visionid) {
						await $createInviteMutation.mutateAsync({
							invitee: session.user.id,
							inviter: $futureMe.visionid
						});

						if ($futureMe.name) {
							await $updateNameMutation.mutateAsync({
								id: session.user.id,
								name: $futureMe.name
							});
						}
					}

					Me.update((store) => ({
						...store,
						id: session.user.id,
						name: $futureMe.name || user.user_metadata.name || 'UpdateMyName'
					}));

					await $meQuery.refetch();
				} catch (error) {
					console.error('Error during initial setup:', error);
				}
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
			onboarded: meData.onboarded,
			active: meData.active
		}));
	}

	async function handleNewsletterCompleted() {
		try {
			await $toggleOnboardedMutation.mutateAsync({
				id: session.user.id
			});
			await $meQuery.refetch();
		} catch (error) {
			console.error('Error updating onboarded status:', error);
		}
	}
</script>

{#if $meQuery.isLoading}
	<div class="flex justify-center items-center h-screen">Loading...</div>
{:else if meData && !meData.onboarded}
	<div class="flex justify-center items-center px-4 w-full min-h-screen sm:px-6 md:px-8">
		<div class="w-full max-w-3xl">
			<SubscribeToNewsletter
				userId={session.user.id}
				userEmail={session.user.email || ''}
				on:next={handleNewsletterCompleted}
			/>
		</div>
	</div>
{:else if !meData}
	<div class="flex justify-center items-center h-screen text-red-500">Error loading user data</div>
{/if}
