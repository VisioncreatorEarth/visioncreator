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
	let status = 'idle';
	let error: string | null = null;
	let transcripts: string[] = [];
	let isCallActive = false;

	async function startCall() {
		try {
			console.log('🎤 Starting shopping assistant...');
			status = 'connecting';
			error = null;

			const result = await $askHominioMutation.mutateAsync({
				chat_message_prompts: ['Start shopping assistant']
			});

			console.log('📞 Mutation result:', {
				success: !!result.data,
				error: result.error ? result.error.message : null
			});

			const data = result.data;

			if (result.error) {
				throw new Error(result.error.message || 'Failed to create call');
			}

			if (!data?.joinUrl) {
				throw new Error('No join URL received');
			}

			console.log('🔄 Creating Ultravox session...');
			session = new UltravoxSession();

			session.addEventListener('status', (event) => {
				console.log('📊 Call status changed:', event.detail);
				status = event.detail;
			});

			session.addEventListener('transcript', (event) => {
				console.log('🗣️ New transcript:', event.detail);
				transcripts = [...transcripts, event.detail];
			});

			session.addEventListener('error', (event) => {
				console.error('❌ Session error:', event.detail);
				error = event.detail.message || 'Unknown error occurred';
				status = 'error';
			});

			console.log('🔗 Joining call with URL:', data.joinUrl);
			await session.joinCall(data.joinUrl);
			isCallActive = true;
			status = 'connected';
			console.log('✨ Call successfully connected!');
		} catch (err) {
			console.error('❌ Error starting call:', err);
			error = err instanceof Error ? err.message : 'Failed to start call';
			status = 'error';
		}
	}

	async function endCall() {
		try {
			console.log('👋 Ending call...');
			if (session) {
				await session.leaveCall();
				session = null;
				console.log('✅ Call ended successfully');
			}
			isCallActive = false;
			status = 'idle';
			transcripts = [];
		} catch (err) {
			console.error('❌ Error ending call:', err);
			error = err instanceof Error ? err.message : 'Failed to end call';
		}
	}

	onDestroy(() => {
		if (session) {
			console.log('🧹 Cleaning up session...');
			session.leaveCall().catch(console.error);
		}
	});
</script>

<div class="fixed bottom-5 left-1/2 transform -translate-x-1/2 z-50">
	<div class="flex flex-col items-center gap-4">
		{#if isCallActive && transcripts.length > 0}
			<div class="p-4 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg max-w-md w-full max-h-48 overflow-y-auto">
				{#each transcripts as transcript}
					<p class="mb-2 text-sm text-gray-700">{transcript}</p>
				{/each}
			</div>
		{/if}

		<div class="p-4 bg-white rounded-lg shadow-lg max-w-md w-full">
			<div class="flex flex-col gap-4">
				<div class="flex justify-between items-center">
					<h2 class="text-lg font-semibold">Shopping Assistant</h2>
					<div>
						{#if !isCallActive}
							<button
								class="px-4 py-2 text-sm text-white bg-blue-500 rounded-full hover:bg-blue-600 transition-colors"
								on:click={startCall}
								disabled={status === 'connecting'}
							>
								{status === 'connecting' ? 'Connecting...' : 'Start Shopping'}
							</button>
						{:else}
							<button
								class="px-4 py-2 text-sm text-white bg-red-500 rounded-full hover:bg-red-600 transition-colors"
								on:click={endCall}
							>
								Stop
							</button>
						{/if}
					</div>
				</div>

				{#if error}
					<div class="p-2 text-sm text-red-700 bg-red-100 rounded">
						{error}
					</div>
				{/if}

				{#if status !== 'idle'}
					<div class="text-sm text-gray-600 text-center">
						Status: {status}
					</div>
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
