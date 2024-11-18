<script lang="ts">
	import { onDestroy } from 'svelte';
	import { UltravoxSession } from 'ultravox-client';

	let session: UltravoxSession | null = null;
	let status = 'idle';
	let error: string | null = null;
	let transcripts: string[] = [];
	let isCallActive = false;

	async function startCall() {
		try {
			status = 'connecting';
			error = null;

			const response = await fetch('/api', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					chat_message_prompts: ['Hello! How can I help you today?']
				})
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.error || 'Failed to create call');
			}

			if (!data.joinUrl) {
				throw new Error('No join URL received');
			}

			console.log('Creating Ultravox session...');
			session = new UltravoxSession();

			session.addEventListener('status', (event) => {
				console.log('Call status:', event.detail);
				status = event.detail;
			});

			session.addEventListener('transcript', (event) => {
				console.log('Received transcript:', event.detail);
				transcripts = [...transcripts, event.detail];
			});

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

<div class="container p-4 mx-auto">
	<div class="mx-auto max-w-2xl">
		<div class="flex justify-between items-center mb-4">
			<h1 class="text-2xl font-bold">Ultravox AI Call</h1>
			<div class="flex gap-2 items-center">
				<span class="text-sm {status === 'connected' ? 'text-green-600' : 'text-gray-600'}">
					Status: {status}
				</span>
				{#if !isCallActive}
					<button
						on:click={startCall}
						class="px-4 py-2 text-white bg-blue-500 rounded hover:bg-blue-600"
						disabled={status === 'connecting'}
					>
						Start Call
					</button>
				{:else}
					<button
						on:click={endCall}
						class="px-4 py-2 text-white bg-red-500 rounded hover:bg-red-600"
					>
						End Call
					</button>
				{/if}
			</div>
		</div>

		{#if error}
			<div class="px-4 py-3 mb-4 text-red-700 bg-red-100 rounded border border-red-400">
				{error}
			</div>
		{/if}

		<div class="p-4 bg-white rounded-lg shadow-lg">
			<h2 class="mb-4 text-xl font-semibold">Transcripts</h2>
			{#if transcripts.length === 0}
				<p class="italic text-gray-500">No transcripts yet</p>
			{:else}
				<div class="space-y-2">
					{#each transcripts as transcript}
						<div class="p-3 bg-gray-50 rounded">
							{transcript}
						</div>
					{/each}
				</div>
			{/if}
		</div>
	</div>
</div>
