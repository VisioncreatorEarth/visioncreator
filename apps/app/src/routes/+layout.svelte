<script lang="ts">
	import '../app.postcss';
	import { Drawer, initializeStores, getDrawerStore } from '@skeletonlabs/skeleton';
	import { QueryClientProvider } from '@tanstack/svelte-query';
	import type { LayoutData } from './$types';
	import { invalidate } from '$app/navigation';
	import { client } from '$lib/wundergraph';
	import { Auth } from '@supabase/auth-ui-svelte';
	import { vcAuthTheme } from '$lib/themes/vcAuthTheme';
	import * as vcAuthLocalization from '$lib/themes/vcAuthLocalization.json';
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { writable } from 'svelte/store';
	import { dev } from '$app/environment';

	let authReady = writable(false);
	let authAction = writable('signup');
	export let data: LayoutData;

	initializeStores();
	const drawerStore = getDrawerStore();

	let { supabase, session, queryClient, url } = data;
	$: ({ supabase, session, queryClient, url } = data);

	onMount(() => {
		drawerStore.subscribe((state) => {
			if (state.open && browser) {
				setTimeout(() => {
					authReady.set(true);
				}, 100);
				authReady.set(false);
				authAction.set(state.action || 'signup');
			}
		});
		const { data } = supabase.auth.onAuthStateChange((event, _session) => {
			if (_session?.expires_at !== session?.expires_at) {
				invalidate('supabase:auth');
			}
		});
		return () => data.subscription.unsubscribe();
	});

	$: if (session?.access_token) {
		client.setAuthorizationToken(session.access_token);
	}
</script>

<QueryClientProvider client={queryClient}>
	<Drawer height="h-auto">
		<div class="@container">
			{#if $drawerStore.meta}
				<ComposeView view={$drawerStore.meta} />
			{:else}
				<div class="max-w-xl mx-auto @3xl:my-16 p-6 max-h-full">
					<div
						class="flex flex-col items-center justify-center p-6 text-center shadow-md bg-surface-700 rounded-3xl"
					>
						<div class="h2 text-xl font-bold mb-2.5 @3xl:text-3xl">
							{$authAction === 'signup' ? 'Put me on the waitlist' : 'Welcome Back!'}
						</div>
						{#if $authAction === 'signup'}
							<p class="max-w-2xl text-md @3xl:text-lg">
								Join our journey and be part of something extraordinary. Grab your chance to be one
								of the first humans on earth to receive your exclusive early pioneer invite.
							</p>
							<p class="text-xs mt-2 leading-snug">
								*by signing up to our waitlist, you consent to our
								<a href="https://visioncreator.earth/en/privacy-policy" class="underline"
									>Privacy Policy</a
								>.
							</p>
						{:else}
							<p class="max-w-2xl text-md @3xl:text-lg">
								Great to see you again! Ready to continue our journey together? Let's make some
								vision magic happen!
							</p>
						{/if}
					</div>
					{#if $authReady}
						<Auth
							supabaseClient={supabase}
							view="magic_link"
							redirectTo={`${url}/auth/callback`}
							showLinks={false}
							theme="dark"
							appearance={{
								theme: vcAuthTheme
							}}
						/>
					{/if}
				</div>
			{/if}}
			{#if dev}
				<div class="fixed z-50 transform -translate-x-1/2 bottom-4 left-1/2">
					<a
						href="http://127.0.0.1:54324/monitor"
						target="_blank"
						rel="noopener noreferrer"
						class="btn btn-sm variant-ghost-secondary"
					>
						Open Mailbox
					</a>
				</div>
			{/if}
		</div>
	</Drawer>

	<slot />
</QueryClientProvider>
