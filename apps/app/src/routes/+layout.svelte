<script lang="ts">
	import '../app.postcss';
	import { QueryClientProvider } from '@tanstack/svelte-query';
	import type { LayoutData } from './$types';
	import { invalidate } from '$app/navigation';
	import { client } from '$lib/wundergraph';
	import { onMount } from 'svelte';
	import ActionModal from '$lib/components/ActionModal.svelte';

	export let data: LayoutData;
	let { supabase, session, queryClient } = data;
	$: ({ supabase, session, queryClient } = data);

	$: if (session?.access_token) {
		client.setAuthorizationToken(session.access_token);
	}

	onMount(() => {
		const { data: authData } = supabase.auth.onAuthStateChange(async (event, _session) => {
			if (_session?.expires_at !== session?.expires_at) {
				invalidate('supabase:auth');
			}
		});
		return () => authData.subscription.unsubscribe();
	});
</script>

<QueryClientProvider client={queryClient}>
	<div class="@container overflow-hidden w-full h-full">
		<slot />
	</div>

	<ActionModal {session} {supabase} />
</QueryClientProvider>

<div class="fixed bottom-0 left-0 right-0 z-40 h-24 pointer-events-none">
	<div
		class="absolute inset-0 bg-gradient-to-t from-surface-900 via-surface-900/50 to-transparent"
	/>
</div>
