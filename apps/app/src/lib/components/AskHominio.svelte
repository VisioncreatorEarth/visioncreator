<!-- AskHominio.svelte -->
<script lang="ts">
	import { onDestroy } from 'svelte';
	import { UltravoxSession } from 'ultravox-client';
	import { createMutation } from '$lib/wundergraph';

	// Create mutations
	const askHominioMutation = createMutation({
		operationName: 'askHominio'
	});

	let session: UltravoxSession | null = null;
	let status:
		| 'disconnected'
		| 'disconnecting'
		| 'connecting'
		| 'idle'
		| 'listening'
		| 'thinking'
		| 'speaking' = 'disconnected';
	let error: string | null = null;
	let transcripts: string[] = [];
	let isCallActive = false;
	let isSpeaking = false;

	function handleStatusChange(event: any) {
		// Access the status from the UltravoxSession instance
		const sessionStatus = session?.status;
		console.log('📊 Raw status event:', event);
		console.log('📊 Session status:', sessionStatus);
		console.log('📊 Call status changed:', {
			previousStatus: status,
			newSessionStatus: sessionStatus,
			timestamp: new Date().toISOString()
		});

		if (!sessionStatus) {
			console.warn('⚠️ No session status available');
			return;
		}

		switch (sessionStatus) {
			case 'disconnected':
				status = 'disconnected';
				isCallActive = false;
				break;
			case 'disconnecting':
				status = 'disconnecting';
				break;
			case 'connecting':
				status = 'connecting';
				break;
			case 'idle':
				status = 'idle';
				isCallActive = true;
				break;
			case 'listening':
				status = 'listening';
				isCallActive = true;
				break;
			case 'thinking':
				status = 'thinking';
				isCallActive = true;
				break;
			case 'speaking':
				status = 'speaking';
				isCallActive = true;
				break;
			default:
				console.warn('⚠️ Unknown status received:', sessionStatus);
		}
	}

	async function startCall() {
		try {
			console.log('🎤 Starting shopping assistant...');
			status = 'connecting';
			error = null;
			transcripts = [];

			const result = await $askHominioMutation.mutateAsync({
				chat_message_prompts: ['Start shopping assistant']
			});

			console.log('📞 Mutation result:', {
				success: !!result.data,
				error: result.error ? result.error.message : null,
				data: result.data
			});

			if (result.error) {
				throw new Error(result.error.message || 'Failed to create call');
			}

			if (!result.data?.joinUrl) {
				throw new Error('No join URL received');
			}

			console.log('🔄 Creating Ultravox session...');
			session = new UltravoxSession({
				joinUrl: result.data.joinUrl,
				transcriptOptional: false
			});

			// Add event listeners
			session.addEventListener('status', handleStatusChange);
			session.addEventListener('transcript', (event) => {
				console.log('🗣️ New transcript:', {
					text: event.detail,
					timestamp: new Date().toISOString()
				});
				if (event.detail && typeof event.detail === 'string') {
					transcripts = [...transcripts, event.detail];
				}
			});

			session.addEventListener('speaking', (event) => {
				console.log('🔊 Speaking status:', {
					speaking: event.detail,
					timestamp: new Date().toISOString()
				});
				isSpeaking = event.detail;
			});

			session.addEventListener('error', (event) => {
				console.error('❌ Session error:', {
					error: event.detail,
					timestamp: new Date().toISOString()
				});
				error = event.detail.message || 'Unknown error occurred';
				status = 'disconnected';
			});

			console.log('🔗 Joining call with URL:', result.data.joinUrl);
			await session.joinCall(result.data.joinUrl);
			console.log('✨ Call successfully connected!');
		} catch (err) {
			console.error('❌ Error starting call:', {
				error: err,
				timestamp: new Date().toISOString()
			});
			error = err instanceof Error ? err.message : 'Failed to start call';
			status = 'disconnected';
		}
	}

	async function endCall() {
		try {
			if (session) {
				console.log('🛑 Ending call...');
				status = 'disconnecting';
				await session.leaveCall();
				session = null;
				status = 'disconnected';
				isCallActive = false;
				transcripts = [];
				isSpeaking = false;
				console.log('✅ Call ended successfully');
			}
		} catch (err) {
			console.error('❌ Error ending call:', {
				error: err,
				timestamp: new Date().toISOString()
			});
			error = err instanceof Error ? err.message : 'Failed to end call';
			status = 'disconnected';
			isCallActive = false;
			session = null;
		}
	}

	onDestroy(() => {
		if (session) {
			console.log('🧹 Cleaning up session...');
			session
				.leaveCall()
				.then(() => console.log('✅ Session cleanup successful'))
				.catch((err) => console.error('❌ Session cleanup error:', err));
			session = null;
		}
	});
</script>

<div class="fixed bottom-20 left-1/2 z-50 transform -translate-x-1/2">
	<div class="flex flex-col gap-4 items-center">
		{#if isCallActive && transcripts.length > 0}
			<div
				class="overflow-y-auto p-4 w-full max-w-md max-h-48 rounded-lg shadow-lg backdrop-blur-sm bg-white/90"
			>
				{#each transcripts as transcript}
					<p class="mb-2 text-sm text-gray-700">{transcript}</p>
				{/each}
			</div>
		{/if}

		{#if error}
			<div class="p-4 text-sm text-red-500 bg-red-100 rounded-lg">{error}</div>
		{/if}

		<div
			class="flex flex-col gap-4 items-center px-12 py-8 w-full max-w-md rounded-xl shadow-lg bg-surface-800"
		>
			{#if status !== 'idle'}
				<div
					class="inline-flex items-center px-4 py-2 text-sm rounded-full shadow-inner text-tertiary-200 bg-surface-700"
				>
					<span class="flex relative mr-2 w-2 h-2">
						<span
							class="inline-flex absolute w-full h-full rounded-full opacity-75 animate-ping bg-tertiary-400"
						/>
						<span class="inline-flex relative w-2 h-2 rounded-full bg-tertiary-500" />
					</span>
					{status}
				</div>
			{/if}

			<div class="flex justify-center w-full">
				{#if !isCallActive}
					<button
						class="btn variant-ghost-primary"
						on:click={startCall}
						disabled={status === 'connecting'}
					>
						{status === 'connecting' ? 'Connecting...' : 'Start Call'}
					</button>
				{:else}
					<button class="btn variant-ghost-error" on:click={endCall}> Stop </button>
				{/if}
			</div>
		</div>
	</div>
</div>

<style>
	/* Add smooth scrolling for transcripts */
	div :global(.overflow-y-auto) {
		scrollbar-width: thin;
		scrollbar-color: rgba(156, 163, 175, 0.5) transparent;
	}

	div :global(.overflow-y-auto::-webkit-scrollbar) {
		width: 6px;
	}

	div :global(.overflow-y-auto::-webkit-scrollbar-track) {
		background: transparent;
	}

	div :global(.overflow-y-auto::-webkit-scrollbar-thumb) {
		background-color: rgba(156, 163, 175, 0.5);
		border-radius: 3px;
	}
</style>
