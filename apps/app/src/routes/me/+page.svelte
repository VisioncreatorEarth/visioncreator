<script lang="ts">
	import { createMutation } from '$lib/wundergraph';
	import { futureMe, Me } from '$lib/stores';
	import { onMount } from 'svelte';
	import { view as meView } from '$lib/views/Me';

	export let data;

	let { session, supabase } = data;
	$: ({ session } = data);

	const updateNameMutation = createMutation({
		operationName: 'updateMe'
	});

	const createInviteMutation = createMutation({
		operationName: 'createInvite'
	});

	// const toggleNewsletterMutation = createMutation({
	// 	operationName: 'NewsletterToggle'
	// });

	onMount(async () => {
		const supabaseMe = await supabase.auth.getUser();
		Me.update((store) => ({ ...store, id: supabaseMe.data.user?.id || '' }));

		if (!supabaseMe.data.user?.user_metadata.inviter && !supabaseMe.data.user?.user_metadata.name) {
			try {
				const { data, error } = await supabase.auth.updateUser({
					data: { inviter: $futureMe.visionid, name: $futureMe.name || 'UpdateMyName' }
				});
				if (error) throw error;

				const updateNameResult = await $updateNameMutation.mutateAsync({
					id: session.user.id,
					name: $futureMe.name
				});

				const createInviteResult = await $createInviteMutation.mutateAsync({
					invitee: session.user.id,
					inviter: $futureMe.visionid
				});

				// const toggleNewsletterResult = await $toggleNewsletterMutation.mutateAsync({
				// 	id: session.user.id,
				// 	email: session?.user.email
				// });
			} catch (error) {
				console.error('Error during signup process:', error);
			}
		}
	});
</script>

<ComposeView view={meView} {session} />
