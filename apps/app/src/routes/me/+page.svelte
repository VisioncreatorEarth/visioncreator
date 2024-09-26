<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import ComposeView from '$lib/components/ComposeView.svelte';
	import SubscribeToNewsletter from '$lib/components/SubscribeToNewsletter.svelte';
	import VideoPlayer from '$lib/components/VideoPlayer.svelte';
	import { view as meView } from '$lib/views/Me';
	import { createMutation, createQuery } from '$lib/wundergraph';
	import { futureMe, Me, onboardingMachine, OnboardingState } from '$lib/stores';
	import { fade } from 'svelte/transition';

	export let data;

	let { session, supabase } = data;
	$: ({ session } = data);

	let isLoading = true;

	const updateNameMutation = createMutation({
		operationName: 'updateMe'
	});

	const createInviteMutation = createMutation({
		operationName: 'createInvite'
	});

	const toggleOnboardedMutation = createMutation({
		operationName: 'toggleOnboarded'
	});

	const queryMe = createQuery({
		operationName: 'queryMe',
		input: { id: $Me.id },
		enabled: !!$Me.id
	});

	onMount(async () => {
		if (browser) {
			console.log('onMount: Initial state', $onboardingMachine.state);
			const supabaseMe = await supabase.auth.getUser();
			Me.update((store) => ({ ...store, id: supabaseMe.data.user?.id || '' }));

			if ($queryMe.data && 'onboarded' in $queryMe.data) {
				console.log('queryMe data received', $queryMe.data);
				onboardingMachine.setRemoteOnboarded($queryMe.data.onboarded);
				console.log('After setRemoteOnboarded', $onboardingMachine.state);
			}

			if (
				!supabaseMe.data.user?.user_metadata.inviter &&
				!supabaseMe.data.user?.user_metadata.name
			) {
				try {
					console.log('Updating user data');
					await supabase.auth.updateUser({
						data: { inviter: $futureMe.visionid, name: $futureMe.name }
					});

					await $updateNameMutation.mutateAsync({
						id: session.user.id,
						name: $futureMe.name
					});

					await $createInviteMutation.mutateAsync({
						invitee: session.user.id,
						inviter: $futureMe.visionid
					});

					console.log('Before INVITE_MUTATED transition', $onboardingMachine.state);
					onboardingMachine.transition('INVITE_MUTATED');
					console.log('After INVITE_MUTATED transition', $onboardingMachine.state);

					await new Promise((resolve) => setTimeout(resolve, 1000));
				} catch (error) {
					console.error('Error during signup process:', error);
				}
			}

			isLoading = false;
			console.log('onMount: Final state', $onboardingMachine.state);
		}
	});

	function handleVideoEnded() {
		console.log('Video ended, current state:', $onboardingMachine.state);
		onboardingMachine.transition('VIDEO_VIEWED');
		console.log('After VIDEO_VIEWED transition:', $onboardingMachine.state);
		// Immediately transition to Newsletter state
		onboardingMachine.transition('INVITE_MUTATED');
	}

	function handleSkipVideo() {
		console.log('Video skipped, current state:', $onboardingMachine.state);
		onboardingMachine.transition('VIDEO_VIEWED');
		console.log('After VIDEO_VIEWED transition:', $onboardingMachine.state);
		// Immediately transition to Newsletter state
		onboardingMachine.transition('INVITE_MUTATED');
	}

	function handleNewsletterComplete() {
		console.log('Newsletter completed, current state:', $onboardingMachine.state);
		onboardingMachine.transition('NEWSLETTER_COMPLETED');
		console.log('After NEWSLETTER_COMPLETED transition:', $onboardingMachine.state);
	}

	$: {
		console.log('State changed:', $onboardingMachine.state);
	}
</script>

{#if isLoading}
	<div class="flex items-center justify-center min-h-screen bg-surface-900">
		<div class="card p-4 w-full max-w-7xl">
			<header class="card-header">
				<div class="placeholder animate-pulse w-2/3 h-8 mb-4" />
			</header>
			<section class="p-4">
				<div class="placeholder animate-pulse w-full h-4 mb-2" />
				<div class="placeholder animate-pulse w-5/6 h-4 mb-2" />
				<div class="placeholder animate-pulse w-4/6 h-4" />
			</section>
		</div>
	</div>
{:else if $onboardingMachine.state === OnboardingState.Welcome}
	<div
		in:fade={{ duration: 300 }}
		class="flex items-center justify-center min-h-screen bg-surface-900"
	>
		<div class="w-full max-w-7xl flex flex-col items-center justify-center text-center p-4 sm:p-6">
			<h1
				class="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-2 sm:mb-4 text-primary-300"
			>
				Phenomenal
			</h1>
			<p class="text-base sm:text-lg md:text-xl lg:text-2xl mb-4 sm:mb-8 text-tertiary-300">
				You are now a Visioncreator
			</p>
			<div class="w-full aspect-w-16 aspect-h-9 mb-4 sm:mb-6">
				<VideoPlayer on:videoEnded={handleVideoEnded} />
			</div>
			<button on:click={handleSkipVideo} class="btn btn-sm sm:btn-md variant-ghost-secondary">
				Skip Video
			</button>
		</div>
	</div>
{:else if $onboardingMachine.state === OnboardingState.Newsletter}
	<div
		in:fade={{ duration: 300 }}
		class="flex items-center justify-center min-h-screen bg-surface-900 p-2 sm:p-4"
	>
		<div class="newsletter-container w-full max-w-7xl flex items-center justify-center">
			<SubscribeToNewsletter
				userId={$Me.id}
				userEmail={session?.user?.email ?? ''}
				on:next={handleNewsletterComplete}
			/>
		</div>
	</div>
{:else}
	<ComposeView view={meView} {session} />
{/if}

<style>
	.newsletter-container {
		min-height: 100%;
		height: 100%;
		max-height: 100vh;
		overflow-y: auto;
	}

	@media (max-height: 500px) {
		.newsletter-container {
			padding: 1rem;
		}
	}
</style>
