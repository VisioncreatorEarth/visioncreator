<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { dev } from '$app/environment';
	import { browser } from '$app/environment';
	import { futureMe } from '$lib/stores';
	import { onMount } from 'svelte';

	export let modalType: 'login' | 'signup';
	export let supabase: any;

	const dispatch = createEventDispatcher();

	// Lock the initial modal type
	const lockedModalType = modalType;

	// Form state
	let emailInput = '';
	let nameInput = '';
	let message = '';
	let messageType = '';
	let showInput = true;
	let nameInputEl: HTMLInputElement;
	let emailInputEl: HTMLInputElement;
	let isLoading = false; // Single declaration of isLoading
	let isMobile = false;

	// Validation state
	let nameError = '';
	let emailError = '';

	if (browser) {
		isMobile = window.matchMedia('(max-width: 768px)').matches;
	}

	onMount(() => {
		if (!isMobile) {
			if (lockedModalType === 'signup' && nameInputEl) {
				nameInputEl.focus();
			} else if (emailInputEl) {
				emailInputEl.focus();
			}
		}
	});

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter' && showInput && !isLoading) {
			handleAuth();
		}
	}

	function validateName(value: string) {
		if (value.length > 0 && value.length < 3) {
			nameError = 'Name must be at least 3 characters';
			return false;
		}
		if (value.length > 20) {
			nameError = 'Name must be less than 20 characters';
			return false;
		}
		nameError = '';
		return true;
	}

	function validateEmail(value: string) {
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!value) {
			emailError = 'Email is required';
			return false;
		}
		if (!emailRegex.test(value)) {
			emailError = 'Please enter a valid email address';
			return false;
		}
		emailError = '';
		return true;
	}

	function resetForm() {
		showInput = true;
		message = '';
		messageType = '';
		emailInput = '';
		nameInput = '';
		emailError = '';
		nameError = '';
	}

	async function handleAuth() {
		const isSignup = lockedModalType === 'signup';

		const isEmailValid = validateEmail(emailInput);
		const isNameValid = !isSignup || validateName(nameInput);

		if (!isEmailValid || !isNameValid) {
			return;
		}

		try {
			isLoading = true;

			const authData = {
				email: emailInput,
				options: {
					data: isSignup
						? {
								name: nameInput,
								visionid: $futureMe.visionid
						  }
						: undefined,
					emailRedirectTo: window.location.origin
				}
			};

			const { error } = await supabase.auth.signInWithOtp(authData);

			if (error) throw error;

			message = 'Check your email for the login link!';
			messageType = 'success';
			showInput = false;
		} catch (error) {
			console.error('Auth error:', error);
			message = error.message;
			messageType = 'error';
			showInput = false;
		} finally {
			isLoading = false;
		}
	}

	// Real-time validation
	$: if (nameInput) validateName(nameInput);
	$: if (emailInput) validateEmail(emailInput);
</script>

<div class="@container">
	<div class="max-w-xl max-h-full p-6 mx-auto">
		<div
			class="flex flex-col items-center justify-center p-6 text-center shadow-md bg-surface-700 rounded-3xl"
		>
			<div class="h2 text-xl font-bold mb-2.5 @3xl:text-3xl">
				{lockedModalType === 'signup' ? 'Put me on the waitlist' : 'Welcome Back'}
			</div>
			{#if lockedModalType === 'signup'}
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
				{#if lockedModalType === 'signup'}
					<div class="space-y-1">
						<input
							bind:value={nameInput}
							bind:this={nameInputEl}
							placeholder="First name (optional)"
							on:keydown={handleKeydown}
							class="w-full px-4 py-2 @md:px-6 @md:py-3 text-lg @md:text-2xl text-white transition-all duration-300 ease-in-out bg-white border rounded-full outline-none bg-opacity-20 border-primary-300 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:ring-opacity-50 placeholder:text-surface-300/60"
							tabindex="1"
						/>
						{#if nameError}
							<p class="ml-4 text-sm text-error-400">{nameError}</p>
						{/if}
					</div>
				{/if}
				<div class="space-y-1">
					<input
						type="email"
						bind:value={emailInput}
						bind:this={emailInputEl}
						placeholder="Email address"
						on:keydown={handleKeydown}
						class="w-full px-4 py-2 @md:px-6 @md:py-3 text-lg @md:text-2xl text-white transition-all duration-300 ease-in-out bg-white border rounded-full outline-none bg-opacity-20 border-primary-300 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:ring-opacity-50 placeholder:text-surface-300/60"
						tabindex="2"
					/>
					{#if emailError}
						<p class="ml-4 text-sm text-error-400">{emailError}</p>
					{/if}
				</div>
				<button
					on:click={() => handleAuth()}
					class="w-full btn bg-gradient-to-br variant-gradient-secondary-primary btn-md @3xl:btn-lg"
					disabled={!!emailError || !!nameError || isLoading}
					tabindex="3"
				>
					{#if isLoading}
						<div class="flex items-center justify-center gap-2">
							<svg
								class="w-4 h-4 animate-spin"
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
							>
								<circle
									class="opacity-25"
									cx="12"
									cy="12"
									r="10"
									stroke="currentColor"
									stroke-width="4"
								/>
								<path
									class="opacity-75"
									fill="currentColor"
									d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
								/>
							</svg>
							<span>Processing...</span>
						</div>
					{:else}
						{lockedModalType === 'signup' ? 'Sign Up Now' : 'Login'}
					{/if}
				</button>
			{:else}
				<div class="text-center">
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
						class="mt-4 btn btn-sm variant-ghost-secondary hover:variant-ghost-primary"
						tabindex="1"
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
