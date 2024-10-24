<script lang="ts">
	import '../app.postcss';
	import { QueryClientProvider } from '@tanstack/svelte-query';
	import type { LayoutData } from './$types';
	import { invalidate } from '$app/navigation';
	import { client } from '$lib/wundergraph';
	import { onMount } from 'svelte';
	import ActionModal from '$lib/components/ActionModal.svelte';
	import { browser } from '$app/environment';

	export let data: LayoutData;
	let { supabase, session, queryClient } = data;
	$: ({ supabase, session, queryClient } = data);

	$: if (session?.access_token) {
		client.setAuthorizationToken(session.access_token);
	}

	// Listen for auth state changes
	onMount(() => {
		const { data: authData } = supabase.auth.onAuthStateChange(async (event, _session) => {
			console.log('Auth state change:', event);

			if (event === 'SIGNED_OUT') {
				// Immediately redirect on signout event
				if (browser) {
					window.location.replace('/');
				}
				return;
			}

			if (_session?.expires_at !== session?.expires_at) {
				await invalidate('supabase:auth');
			}
		});

		return () => {
			if (authData?.subscription) {
				authData.subscription.unsubscribe();
			}
		};
	});

	// Enhanced signout handler
	async function handleSignOut() {
		try {
			// First invalidate auth state
			await invalidate('supabase:auth');

			// Then sign out from Supabase
			const { error } = await supabase.auth.signOut();
			if (error) throw error;

			// The onAuthStateChange listener will handle the redirect
		} catch (error) {
			console.error('Error signing out:', error);
			// Fallback redirect
			if (browser) {
				window.location.replace('/');
			}
		}
	}
</script>

<QueryClientProvider client={queryClient}>
	<div class="@container overflow-hidden w-full h-full">
		<slot />
	</div>

	<ActionModal {session} {supabase} on:signout={handleSignOut} />
</QueryClientProvider>

<div class="fixed bottom-0 left-0 right-0 z-40 h-24 pointer-events-none">
	<div
		class="absolute inset-0 bg-gradient-to-t from-surface-900 via-surface-900/50 to-transparent"
	/>
</div>
