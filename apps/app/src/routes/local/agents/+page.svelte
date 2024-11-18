<script lang="ts">
	import { onDestroy } from 'svelte';
	import { UltravoxSession } from 'ultravox-client';
	import { switchViewTool } from '$lib/clientTools';
	import type { ViewUpdateData } from '$lib/clientTools';
	import { createMutation } from '$lib/wundergraph';

	// Create the askHominio mutation
	const askHominioMutation = createMutation({
		operationName: 'askHominio'
	});

	let session: UltravoxSession | null = null;
	let status = 'idle';
	let error: string | null = null;
	let transcripts: string[] = [];
	let isCallActive = false;
	let currentView = 'none'; // 'banking', 'todos', 'profile', or 'none'

	async function startCall() {
		try {
			status = 'connecting';
			error = null;

			const result = await $askHominioMutation.mutateAsync({
				chat_message_prompts: ['Hello! How can I help you today?']
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
			session.registerToolImplementation('switchView', switchViewTool);

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
				currentView = event.detail.view;
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
			currentView = 'none';
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

		<!-- <div class="p-4 mb-8 bg-white rounded-lg shadow-lg">
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
		</div> -->

		<!-- UI Views -->
		{#if currentView !== 'none'}
			<div class="p-6 mt-8 bg-white rounded-lg shadow-lg transition-all duration-300">
				{#if currentView === 'banking'}
					<div class="space-y-6">
						<h2 class="text-2xl font-bold text-gray-800">Banking Dashboard</h2>
						<div class="grid grid-cols-2 gap-4">
							<div class="p-4 bg-blue-50 rounded-lg">
								<h3 class="font-semibold text-blue-800">Checking Account</h3>
								<p class="text-2xl font-bold text-blue-600">$2,450.00</p>
							</div>
							<div class="p-4 bg-green-50 rounded-lg">
								<h3 class="font-semibold text-green-800">Savings Account</h3>
								<p class="text-2xl font-bold text-green-600">$12,380.00</p>
							</div>
						</div>
						<div class="pt-4 border-t">
							<h3 class="mb-2 font-semibold">Recent Transactions</h3>
							<div class="space-y-2">
								<div class="flex justify-between">
									<span>Grocery Store</span>
									<span class="text-red-600">-$82.45</span>
								</div>
								<div class="flex justify-between">
									<span>Salary Deposit</span>
									<span class="text-green-600">+$2,800.00</span>
								</div>
							</div>
						</div>
					</div>
				{:else if currentView === 'todos'}
					<div class="space-y-6">
						<h2 class="text-2xl font-bold text-gray-800">Todo List</h2>
						<div class="space-y-3">
							<div class="flex gap-2 items-center">
								<input type="checkbox" checked class="w-5 h-5" />
								<span class="line-through">Complete project presentation</span>
							</div>
							<div class="flex gap-2 items-center">
								<input type="checkbox" class="w-5 h-5" />
								<span>Schedule team meeting</span>
							</div>
							<div class="flex gap-2 items-center">
								<input type="checkbox" class="w-5 h-5" />
								<span>Review quarterly reports</span>
							</div>
						</div>
					</div>
				{:else if currentView === 'profile'}
					<div class="space-y-6">
						<h2 class="text-2xl font-bold text-gray-800">Profile Dashboard</h2>
						<div class="flex gap-4 items-center">
							<div class="w-20 h-20 bg-gray-200 rounded-full" />
							<div>
								<h3 class="text-xl font-semibold">John Doe</h3>
								<p class="text-gray-600">john.doe@example.com</p>
							</div>
						</div>
						<div class="grid grid-cols-2 gap-4">
							<div class="p-4 bg-gray-50 rounded-lg">
								<h4 class="font-semibold">Account Type</h4>
								<p>Premium</p>
							</div>
							<div class="p-4 bg-gray-50 rounded-lg">
								<h4 class="font-semibold">Member Since</h4>
								<p>Jan 2023</p>
							</div>
						</div>
					</div>
				{/if}
			</div>
		{/if}
	</div>
</div>
