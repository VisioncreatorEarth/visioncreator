<script lang="ts">
	import { createMutation, createQuery } from '$lib/wundergraph';
	import { futureMe } from '$lib/stores';
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
		operationName: 'queryMe'
	});

	$: meData = $meQuery.data as MeQueryResult | null;

	async function handleInitialSetup() {
		if (!initialSetupComplete && session?.user) {
			const {
				data: { user }
			} = await supabase.auth.getUser();

			// Check if we need to handle inviter and vision ID
			if (!user?.user_metadata.inviter && $futureMe.visionid) {
				try {
					await supabase.auth.updateUser({
						data: {
							inviter: $futureMe.visionid,
							name: $futureMe.name || ''
						}
					});

					if ($futureMe.visionid) {
						await $createInviteMutation.mutateAsync({
							invitee: session.user.id,
							inviter: $futureMe.visionid
						});

						if ($futureMe.name) {
							await $updateNameMutation.mutateAsync({
								name: $futureMe.name
							});
						} else {
							await $updateNameMutation.mutateAsync({
								name: ''
							});
						}
					}
				} catch (error) {
					console.error('Error during initial setup:', error);
				}
			} else {
				console.log('Skipping initial setup:', {
					hasInviter: !!user?.user_metadata.inviter,
					hasVisionId: !!$futureMe.visionid
				});
			}

			try {
				if (meData && meData.name === '') {
					await $updateNameMutation.mutateAsync({
						name: ''
					});
					await $meQuery.refetch();
				}
			} catch (error) {
				console.error('Error generating random name:', error);
			}

			initialSetupComplete = true;
		}
	}

	// Handle initial setup on mount and when session changes
	$: if (session?.user && !initialSetupComplete) {
		handleInitialSetup();
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
