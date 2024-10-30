<script lang="ts">
	import '../app.postcss';
	import { QueryClientProvider } from '@tanstack/svelte-query';
	import type { LayoutData } from './$types';
	import { invalidate } from '$app/navigation';
	import { client } from '$lib/wundergraph';
	import { onMount } from 'svelte';
	import ActionModal from '$lib/components/ActionModal.svelte';
	import { browser } from '$app/environment';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';

	export let data: LayoutData;
	let { supabase, session, queryClient } = data;
	$: ({ supabase, session, queryClient } = data);

	$: if (session?.access_token) {
		client.setAuthorizationToken(session.access_token);
	}

	let modalOpen = false;

	// Function to check and open modal based on URL parameter
	function checkAndOpenModal() {
		const modalParam = $page.url.searchParams.get('open');
		if (modalParam === 'legal-and-privacy-policy' && !modalOpen) {
			modalOpen = true;
			window.dispatchEvent(
				new CustomEvent('openModal', {
					detail: { type: 'legal-and-privacy-policy' }
				})
			);
		}
	}

	// Function to handle modal close
	function handleModalClose() {
		modalOpen = false;
		if (browser) {
			goto('/', { replaceState: true });
		}
	}

	// Listen for auth state changes
	onMount(() => {
		if (browser) {
			// Initial check for modal
			checkAndOpenModal();

			// Listen for modal close event
			window.addEventListener('closeModal', handleModalClose);

			// Watch for URL changes
			const unsubscribe = page.subscribe(() => {
				checkAndOpenModal();
			});

			return () => {
				window.removeEventListener('closeModal', handleModalClose);
				unsubscribe();
			};
		}

		const { data: authData } = supabase.auth.onAuthStateChange(async (event, _session) => {
			console.log('Auth state change:', event);

			if (event === 'SIGNED_OUT') {
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
			await invalidate('supabase:auth');
			const { error } = await supabase.auth.signOut();
			if (error) throw error;
		} catch (error) {
			console.error('Error signing out:', error);
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

<footer class="fixed bottom-0 left-0 py-2 @sm:py-2 text-white z-40">
	<div class="px-4 @sm:px-4">
		<div class="flex space-x-2 @sm:space-x-4">
			<button
				class="text-2xs @sm:text-xs text-tertiary-500/80 hover:text-tertiary-500 transition-colors"
				on:click={() => {
					if (browser) {
						// Use openModal event with explicit type
						window.dispatchEvent(
							new CustomEvent('openModal', {
								detail: { type: 'legal-and-privacy-policy' }
							})
						);
					}
				}}
			>
				Site Notice & Privacy Policy
			</button>
		</div>
	</div>
</footer>

<div class="fixed bottom-0 left-0 right-0 z-30 h-24 pointer-events-none">
	<div
		class="absolute inset-0 bg-gradient-to-t from-surface-900 via-surface-900/50 to-transparent"
	/>
</div>
