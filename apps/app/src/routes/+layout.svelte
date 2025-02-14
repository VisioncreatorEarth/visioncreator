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
	// import GlobalChat from '$lib/components/GlobalChat.svelte';
	import { chatStore, toggleChat, closeChat } from '$lib/stores/chatStore';
	import Icon from '@iconify/svelte';
	import { view as defaultView } from '$lib/views/Default';
	import AsidePanel from '$lib/components/AsidePanel.svelte';

	export let data: LayoutData;
	let { supabase, session, queryClient } = data;
	$: ({ supabase, session, queryClient } = data);

	$: if (session?.access_token) {
		client.setAuthorizationToken(session.access_token);
	}

	let modalOpen = false;

	// Add custom view state
	let currentCustomView: any = null;

	// Function to check and open modal based on URL parameter
	function checkAndOpenModal() {
		const modalParam = $page.url.searchParams.get('modal');
		const modalType = $page.url.searchParams.get('open');

		if (modalType === 'legal-and-privacy-policy' && !modalOpen) {
			modalOpen = true;
			window.dispatchEvent(
				new CustomEvent('openModal', {
					detail: { type: 'legal-and-privacy-policy' }
				})
			);
		} else if (modalParam) {
			modalOpen = true;
			window.dispatchEvent(
				new CustomEvent('openModal', {
					detail: {
						type: 'custom-view',
						component: modalParam
					}
				})
			);
		}
	}

	// Function to handle modal close
	function handleModalClose() {
		modalOpen = false;
		if (browser) {
			const url = new URL(window.location.href);
			// Remove modal and open params but keep view param
			url.searchParams.delete('modal');
			url.searchParams.delete('open');
			goto(url.toString(), { replaceState: true });
		}
	}

	// Listen for auth state changes
	onMount(() => {
		if (browser) {
			// Initial check for modal
			checkAndOpenModal();

			// Watch for URL changes
			const unsubscribe = page.subscribe(() => {
				checkAndOpenModal();
			});

			return () => {
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

	function handleCustomView(viewConfig: any) {
		currentCustomView = viewConfig;
		window.dispatchEvent(
			new CustomEvent('openModal', {
				detail: { type: 'custom-view' }
			})
		);
	}
</script>

<QueryClientProvider client={queryClient}>
	<div class="flex min-h-screen bg-surface-900 @container w-full relative">
		<!-- Left Aside Area -->
		<AsidePanel side="left" />

		<!-- Main Content Area -->
		<div class="flex flex-col flex-1 min-h-screen overflow-x-hidden">
			<slot />
		</div>

		<!-- Right Aside Area -->
		<AsidePanel side="right" />
	</div>

	<ActionModal {session} {supabase} customView={currentCustomView} on:signout={handleSignOut} />

	<!--
	Navigation Pill - Temporarily disabled
	{#if data.session}
	<div class="fixed z-40 -translate-x-1/2 bottom-5 left-1/2">
		<div class="relative flex items-center border rounded-full shadow-xl bg-surface-300/10 border-surface-200/20 backdrop-blur-sm">
			<button
				on:click={toggleChat}
				class="flex items-center justify-center px-4 transition-all rounded-full h-11 text-surface-200 hover:bg-surface-200/30 hover:text-white"
			>
				<Icon icon="mingcute:chat-2-fill" class="w-7 h-7" />
			</button>

			<button
				class="relative z-10 flex items-center justify-center w-12 h-12 text-white transition-all rounded-full shadow-xl bg-primary-500 hover:bg-primary-600 hover:scale-105 ring-2 ring-surface-200/30"
				style="margin-top: -1.5rem; margin-bottom: -1.5rem;"
			>
				<Icon icon="mdi:plus" class="w-7 h-7" />
			</button>

			<button
				on:click={() => goto('/')}
				class="flex items-center justify-center px-4 transition-all rounded-full h-11 text-surface-200 hover:bg-surface-200/30 hover:text-white"
			>
				<Icon icon="material-symbols:family-home-rounded" class="w-7 h-7" />
			</button>
		</div>
	</div>
	{/if}
	-->

	<!-- Global Chat Modal -->
	<!-- {#if showChat}
		<GlobalChat show={showChat} onClose={() => (showChat = false)} />
	{/if} -->
</QueryClientProvider>

<footer class="fixed bottom-0 left-0 z-40 text-white">
	<div class="px-2 @sm:px-4">
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
		class="absolute inset-0 bg-gradient-to-t to-transparent from-surface-900 via-surface-900/50"
	/>
</div>
