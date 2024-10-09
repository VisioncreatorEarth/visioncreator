<script lang="ts">
	import '../app.postcss';
	import { Drawer, initializeStores, getDrawerStore } from '@skeletonlabs/skeleton';
	import { QueryClientProvider } from '@tanstack/svelte-query';
	import type { LayoutData } from './$types';
	import { invalidate } from '$app/navigation';
	import { client } from '$lib/wundergraph';
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { writable } from 'svelte/store';
	import { dev } from '$app/environment';
	import { fade } from 'svelte/transition';

	let authReady = writable(false);
	let authAction = writable('signup');
	export let data: LayoutData;

	initializeStores();
	const drawerStore = getDrawerStore();

	let { supabase, session, queryClient } = data;
	$: ({ supabase, session, queryClient } = data);

	let email = '';
	let message = '';
	let showInput = true;
	let messageType = '';
	let emailInput: HTMLInputElement;

	function focusOnInit(node: HTMLInputElement) {
		node.focus();
	}

	onMount(() => {
		drawerStore.subscribe((state) => {
			if (state.open && browser) {
				setTimeout(() => {
					authReady.set(true);
					if (emailInput) {
						emailInput.focus();
					}
				}, 100);
				authReady.set(false);
				authAction.set(state.action || 'signup');
			}
		});
		const { data: authData } = supabase.auth.onAuthStateChange((event, _session) => {
			if (_session?.expires_at !== session?.expires_at) {
				invalidate('supabase:auth');
			}
		});
		return () => authData.subscription.unsubscribe();
	});

	$: if (session?.access_token) {
		client.setAuthorizationToken(session.access_token);
	} else {
		console.log('No access token available');
	}

	async function handleSignUp() {
		const formData = new FormData();
		formData.append('email', email);

		try {
			const response = await fetch('/auth/signInWithOtp', {
				method: 'POST',
				body: formData
			});

			const result = await response.json();

			if (!response.ok) {
				// Handle error responses
				message = result.errors?.email || result.message || 'An unexpected error occurred.';
				messageType = 'error';
			} else {
				// Handle successful responses
				message = result.message;
				messageType = 'success';
			}

			showInput = false;
			email = '';
		} catch (error) {
			console.error('Error:', error);
			message = 'An unexpected error occurred. Please try again.';
			messageType = 'error';
			showInput = false;
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter' && showInput) {
			handleSignUp();
		}
	}

	function resetForm() {
		showInput = true;
		message = '';
		setTimeout(() => {
			if (emailInput) {
				emailInput.focus();
			}
		}, 0);
	}
</script>

<QueryClientProvider client={queryClient}>
	<Drawer height="h-auto">
		<div class="@container">
			<div class="max-w-xl mx-auto @3xl:my-16 p-6 max-h-full">
				<div
					class="flex flex-col items-center justify-center p-6 text-center shadow-md bg-surface-700 rounded-3xl"
				>
					<div class="h2 text-xl font-bold mb-2.5 @3xl:text-3xl">
						{$authAction === 'signup' ? 'Put me on the waitlist' : 'Welcome Back'}
					</div>
					{#if $authAction === 'signup'}
						<p class="max-w-2xl text-md @3xl:text-lg">
							Grab your chance to be one of the first humans on earth to receive your exclusive
							early pioneer invite.
						</p>
						<p class="text-xs mt-2 leading-snug">
							*by signing up to our waitlist, you consent to our
							<a href="https://visioncreator.earth/en/privacy-policy" class="underline"
								>Privacy Policy</a
							>.
						</p>
					{:else}
						<p class="max-w-2xl text-md @3xl:text-lg">
							Great to see you again. Ready to continue our journey together? Let's make some vision
							magic happen.
						</p>
					{/if}
				</div>
				<div class="w-full space-y-4 mt-4">
					{#if showInput}
						<input
							bind:value={email}
							bind:this={emailInput}
							use:focusOnInit
							on:keydown={handleKeydown}
							placeholder="Enter your email address"
							class="w-full px-4 py-3 @md:px-6 @md:py-4 text-lg @md:text-2xl text-white transition-all duration-300 ease-in-out bg-white border rounded-full outline-none bg-opacity-20 border-primary-300 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:ring-opacity-50"
						/>
						<button
							on:click={handleSignUp}
							class="w-full btn bg-gradient-to-br variant-gradient-secondary-primary btn-md @3xl:btn-lg"
						>
							{$authAction === 'signup' ? 'Sign Up Now' : 'Login'}
						</button>
					{:else}
						<div in:fade={{ duration: 200 }} out:fade={{ duration: 200 }} class="text-center">
							<div
								class="card p-6 rounded-3xl {messageType === 'success'
									? 'variant-ghost-success'
									: 'variant-ghost-error'}"
							>
								<p>{message}</p>
							</div>
							<button
								on:click={resetForm}
								class="btn btn-sm variant-ghost-tertiary mt-4 rounded-full">Try Again</button
							>
						</div>
					{/if}
				</div>
			</div>
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
