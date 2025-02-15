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
		console.log('handleInitialSetup called:', {
			isComplete: initialSetupComplete,
			hasSession: !!session?.user,
			hasVisionId: !!$futureMe.visionid,
			futureMeState: $futureMe
		});

		if (!initialSetupComplete && session?.user) {
			const {
				data: { user }
			} = await supabase.auth.getUser();

			console.log('Auth user data:', { user });

			try {
				const nameToUse = $futureMe.name || '';
				console.log('Prepared mutation data:', {
					nameToUse,
					inviter: $futureMe.visionid,
					futureMe: $futureMe
				});

				await $onboardMeMutation.mutateAsync({
					name: nameToUse,
					inviter: $futureMe.visionid
				});

				console.log('onboardMeMutation completed successfully');
				initialSetupComplete = true;
			} catch (error) {
				console.error('Error during initial setup:', {
					error,
					errorMessage: error.message,
					errorStack: error.stack
				});
			}
		}
	}

	// Handle initial setup on mount and when session changes
	$: if (session?.user && !initialSetupComplete) {
		console.log('Session/initialSetupComplete changed:', {
			hasSession: !!session?.user,
			isComplete: initialSetupComplete
		});
		handleInitialSetup();
	}
</script>
