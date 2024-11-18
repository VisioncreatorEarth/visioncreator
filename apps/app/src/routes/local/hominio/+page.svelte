<script lang="ts">
	import { onDestroy } from 'svelte';
	import { UltravoxSession } from 'ultravox-client';
	import { switchViewTool } from '$lib/clientTools';
	import type { ViewUpdateData } from '$lib/clientTools';
	import { createMutation } from '$lib/wundergraph';
	import ComposeView from '$lib/components/ComposeView.svelte';
	import { dynamicView } from '$lib/stores';

	// Create the askHominio mutation
	const askHominioMutation = createMutation({
		operationName: 'askHominio'
	});

	let session: UltravoxSession | null = null;
	let status = 'idle';
	let error: string | null = null;
	let transcripts: string[] = [];
	let isCallActive = false;
	let currentView = {
		component: 'o-HelloEarth',
		props: {},
		context: { type: 'dashboard' }
	};

	async function startCall() {
		try {
			status = 'connecting';
			error = null;

			const result = await $askHominioMutation.mutateAsync({
				chat_message_prompts: ['Hi, what do you want to see']
			});

			const data = result.data;

			if (result.error) {
				throw new Error(result.error.message || 'Failed to create call');
			}

			if (!data?.joinUrl) {
				throw new Error('No join URL received');
			}

			console.log('Creating Ultravox session...');
			session = new UltravoxSession();

			// Register the view switching tool
			session.registerToolImplementation('switchView', async (data: ViewUpdateData) => {
				console.log('Switching view to:', data);
				const viewConfig = {
					component: data.view,
					props: {},
					context: { type: data.view.replace('o-', '').toLowerCase(), ...data.context }
				};

				// Update both local state and dynamic view store
				currentView = viewConfig;
				dynamicView.update((store) => ({ ...store, view: viewConfig }));

				return { success: true };
			});

			session.addEventListener('status', (event) => {
				console.log('Call status:', event.detail);
				status = event.detail;
			});

			session.addEventListener('transcript', (event) => {
				console.log('Received transcript:', event.detail);
				transcripts = [...transcripts, event.detail];
			});

			// Add view update event listener
			window.addEventListener('viewUpdate', ((event: CustomEvent<ViewUpdateData>) => {
				const viewConfig = {
					component: event.detail.view,
					props: {},
					context: {
						type: event.detail.view.replace('o-', '').toLowerCase(),
						...event.detail.context
					}
				};
				currentView = viewConfig;
				dynamicView.update((store) => ({ ...store, view: viewConfig }));
				// You can use event.detail.context for additional view-specific data
			}) as EventListener);

			session.addEventListener('error', (event) => {
				console.error('Session error:', event.detail);
				error = event.detail.message || 'Unknown error occurred';
				status = 'error';
			});

			console.log('Joining call with URL:', data.joinUrl);
			await session.joinCall(data.joinUrl);
			isCallActive = true;
			status = 'connected';
		} catch (err) {
			console.error('Error starting call:', err);
			error = err instanceof Error ? err.message : 'Failed to start call';
			status = 'error';
		}
	}

	async function endCall() {
		try {
			if (session) {
				await session.leaveCall();
				session = null;
			}
			isCallActive = false;
			status = 'idle';
			transcripts = [];
			currentView = {
				component: 'o-HelloEarth',
				props: {},
				context: { type: 'dashboard' }
			};
		} catch (err) {
			console.error('Error ending call:', err);
			error = err instanceof Error ? err.message : 'Failed to end call';
		}
	}

	onDestroy(() => {
		if (session) {
			session.leaveCall().catch(console.error);
		}
	});
</script>

<div class="flex flex-col h-screen">
	<div class="p-4 shadow-md bg-surface-900">
		<div class="mx-auto max-w-7xl">
			<div class="flex justify-between items-center">
				<h1 class="text-2xl font-bold">Hominio</h1>
				<div class="flex gap-2 items-center">
					{#if !isCallActive}
						<button
							class="px-4 py-2 text-white bg-blue-500 rounded hover:bg-blue-600"
							on:click={startCall}
							disabled={status === 'connecting'}
						>
							{status === 'connecting' ? 'Connecting...' : 'Start Call'}
						</button>
					{:else}
						<button
							class="px-4 py-2 text-white bg-red-500 rounded hover:bg-red-600"
							on:click={endCall}
						>
							End Call
						</button>
					{/if}
				</div>
			</div>

			{#if error}
				<div class="p-4 mt-4 text-red-700 bg-red-100 rounded">
					{error}
				</div>
			{/if}

			<!-- {#if isCallActive}
				<div class="p-4 mt-4 bg-gray-100 rounded">
					<h2 class="mb-2 font-semibold">Transcripts:</h2>
					{#each transcripts as transcript}
						<p class="mb-1">{transcript}</p>
					{/each}
				</div>
			{/if} -->
		</div>
	</div>

	<div class="overflow-hidden flex-1">
		<ComposeView view={currentView} {session} showSpacer={true} />
	</div>
</div>
