<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import ComposeView from '$lib/components/ComposeView.svelte';
	import SubscribeToNewsletter from '$lib/components/SubscribeToNewsletter.svelte';
	import { view as meView } from '$lib/views/Me';
	import { createMutation, createQuery } from '$lib/wundergraph';
	import { futureMe, Me, onboardingState, OnboardingState } from '$lib/stores';
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

	$: newsletterStatusQuery = createQuery({
		operationName: 'MyNewsletterStatus',
		input: {
			id: $Me.id,
			email: session?.user?.email || ''
		},
		enabled: !!$Me.id && !!session?.user?.email
	});

	function nextState() {
		onboardingState.update((current) => {
			switch (current) {
				case OnboardingState.Welcome:
					return OnboardingState.SeenVideo;
				case OnboardingState.SeenVideo:
					return OnboardingState.FinishedOnboarding;
				default:
					return current;
			}
		});
	}

	function handleVideoEnded() {
		nextState();
	}

	async function checkNewsletterStatus() {
		if ($Me.id && session?.user?.email) {
			await $newsletterStatusQuery.refetch();
			if ($newsletterStatusQuery.data) {
				onboardingState.set(OnboardingState.FinishedOnboarding);
			}
		}
	}

	onMount(async () => {
		if (browser) {
			const supabaseMe = await supabase.auth.getUser();
			Me.update((store) => ({ ...store, id: supabaseMe.data.user?.id || '' }));

			if (
				!supabaseMe.data.user?.user_metadata.inviter &&
				!supabaseMe.data.user?.user_metadata.name
			) {
				try {
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

					// Wait for a short time to ensure the updates have propagated
					await new Promise((resolve) => setTimeout(resolve, 1000));
				} catch (error) {
					console.error('Error during signup process:', error);
				}
			}

			await checkNewsletterStatus();
			isLoading = false;
		}
	});

	$: if ($Me.id && session?.user?.email) {
		checkNewsletterStatus();
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
{:else if $onboardingState === OnboardingState.Welcome}
	<div
		in:fade={{ duration: 300 }}
		class="flex items-center justify-center min-h-screen bg-surface-900"
	>
		<div class="p-4 sm:p-6 w-full max-w-7xl flex flex-col items-center justify-center text-center">
			<h1
				class="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-2 sm:mb-4 text-primary-300"
			>
				Phenomenal
			</h1>
			<p class="text-base sm:text-lg md:text-xl lg:text-2xl mb-4 sm:mb-8 text-tertiary-300">
				You are now a Visioncreator
			</p>
			<div data-testid="video-player" class="w-full aspect-w-16 aspect-h-9 mb-4 sm:mb-6">
				{#await import('$lib/components/VideoPlayer.svelte') then { default: VideoPlayer }}
					<svelte:component this={VideoPlayer} on:videoEnded={handleVideoEnded} />
				{/await}
			</div>
			<button on:click={nextState} class="btn btn-sm sm:btn-md variant-ghost-secondary"
				>Skip Video</button
			>
		</div>
	</div>
{:else if $onboardingState === OnboardingState.SeenVideo}
	<div
		in:fade={{ duration: 300 }}
		class="flex items-center justify-center min-h-screen bg-surface-900 p-2 sm:p-4"
	>
		<div class="newsletter-container w-full max-w-7xl flex items-center justify-center">
			<SubscribeToNewsletter
				userId={$Me.id}
				userEmail={session?.user?.email ?? ''}
				on:next={nextState}
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
