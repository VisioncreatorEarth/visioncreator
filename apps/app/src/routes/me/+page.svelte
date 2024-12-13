<script lang="ts">
	import { createMutation } from '$lib/wundergraph';
	import { futureMe } from '$lib/stores';

	export let data;
	let { session, supabase } = data;
	$: ({ session } = data);

	let initialSetupComplete = false;

	const onboardMeMutation = createMutation({
		operationName: 'onboardMe'
	});

	async function handleInitialSetup() {
		if (!initialSetupComplete && session?.user && $futureMe.visionid) {
			const {
				data: { user }
			} = await supabase.auth.getUser();

			try {
				await $onboardMeMutation.mutateAsync({
					name: $futureMe.name || '',
					inviter: $futureMe.visionid
				});
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
</script>
