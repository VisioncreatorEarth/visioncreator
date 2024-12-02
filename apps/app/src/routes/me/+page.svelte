<script lang="ts">
	import { createMutation, createQuery } from '$lib/wundergraph';
	import { futureMe } from '$lib/stores';
	import SubscribeToNewsletter from '$lib/components/SubscribeToNewsletter.svelte';

	export let data;
	let { session, supabase } = data;
	$: ({ session } = data);

	let initialSetupComplete = false;

	const onboardMeMutation = createMutation({
		operationName: 'onboardMe'
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
		if (!initialSetupComplete && session?.user && (!meData?.name || $futureMe.visionid)) {
			const {
				data: { user }
			} = await supabase.auth.getUser();

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

	// Handle initial setup on mount and when session changes
	$: if (session?.user && !initialSetupComplete) {
		handleInitialSetup();
	}

	async function handleNewsletterCompleted() {
		try {
			await $toggleOnboardedMutation.mutateAsync();
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
				userEmail={session.user.email || ''}
				on:next={handleNewsletterCompleted}
			/>
		</div>
	</div>
{:else if !meData}
	<div class="flex justify-center items-center h-screen text-red-500">Error loading user data</div>
{/if}
