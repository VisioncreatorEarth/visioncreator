<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { fade } from 'svelte/transition';
	import { dev } from '$app/environment';
	import { goto } from '$app/navigation';

	export let modalType: 'login' | 'signup';
	export let supabase: any;

	const dispatch = createEventDispatcher();

	// Form state
	let emailInput = '';
	let nameInput = '';
	let message = '';
	let messageType = '';
	let showInput = true;

	async function handleAuth(isSignup = false) {
		try {
			if (isSignup && !nameInput) {
				alert('Please enter your name');
				return;
			}

			const { error } = await supabase.auth.signInWithOtp({
				email: emailInput,
				options: {
					data: isSignup ? { name: nameInput } : undefined,
					emailRedirectTo: window.location.origin // Ensure redirect to root
				}
			});

			if (error) throw error;

			message = 'Check your email for the login link!';
			messageType = 'success';
			showInput = false;
		} catch (error) {
			console.error('Auth error:', error);
			message = error.message;
			messageType = 'error';
			showInput = false;
		}
	}

	function resetForm() {
		showInput = true;
		message = '';
		messageType = '';
		emailInput = '';
		nameInput = '';
	}
</script>

<div class="@container">
	<div class="max-w-xl max-h-full p-6 mx-auto">
		<div
			class="flex flex-col items-center justify-center p-6 text-center shadow-md bg-surface-700 rounded-3xl"
		>
			<div class="h2 text-xl font-bold mb-2.5 @3xl:text-3xl">
				{modalType === 'signup' ? 'Put me on the waitlist' : 'Welcome Back'}
			</div>
			{#if modalType === 'signup'}
				<p class="max-w-2xl text-md @3xl:text-lg">
					Grab your chance to be one of the first humans on earth to receive your exclusive early
					pioneer invite.
				</p>
				<p class="mt-2 text-xs leading-snug">
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
		<div class="w-full mt-4 space-y-4">
			{#if showInput}
				{#if modalType === 'signup'}
					<input
						bind:value={nameInput}
						placeholder="First name (optional)"
						class="w-full px-4 py-2 @md:px-6 @md:py-3 text-lg @md:text-2xl text-white transition-all duration-300 ease-in-out bg-white border rounded-full outline-none bg-opacity-20 border-primary-300 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:ring-opacity-50"
					/>
				{/if}
				<input
					type="email"
					bind:value={emailInput}
					placeholder="Email address"
					class="w-full px-4 py-2 @md:px-6 @md:py-3 text-lg @md:text-2xl text-white transition-all duration-300 ease-in-out bg-white border rounded-full outline-none bg-opacity-20 border-primary-300 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:ring-opacity-50"
				/>
				<button
					on:click={() => handleAuth(modalType === 'signup')}
					class="w-full btn bg-gradient-to-br variant-gradient-secondary-primary btn-md @3xl:btn-lg"
				>
					{modalType === 'signup' ? 'Sign Up Now' : 'Login'}
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
						type="button"
						on:click={resetForm}
						class="mt-4 rounded-full btn btn-sm variant-ghost-tertiary"
					>
						Try Again
					</button>
				</div>
			{/if}
			{#if dev}
				<div class="flex justify-center mt-4">
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
	</div>
</div>
