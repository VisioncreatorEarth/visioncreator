<!-- Mock Agent Interface -->
<script lang="ts">
	import { onMount } from 'svelte';

	// Mock agent types and interfaces
	interface Message {
		id: string;
		from: string;
		to: string;
		content: string;
		timestamp: Date;
		type: 'request' | 'response' | 'delegation' | 'audio' | 'text';
		status: 'pending' | 'processing' | 'completed' | 'error';
	}

	interface Agent {
		id: string;
		name: string;
		type: string;
		status: 'idle' | 'working' | 'error';
		capabilities: string[];
		lastActive: Date;
	}

	// Mock agents data
	let agents: Agent[] = [
		{
			id: 'hominio',
			name: 'Agent Hominio',
			type: 'Master Delegator',
			status: 'idle',
			capabilities: ['task_delegation', 'intent_analysis'],
			lastActive: new Date()
		},
		{
			id: 'watts',
			name: 'Agent Watts',
			type: 'Speech Processing',
			status: 'idle',
			capabilities: ['speech_to_text'],
			lastActive: new Date()
		},
		{
			id: 'bert',
			name: 'Agent Bert',
			type: 'List Management',
			status: 'idle',
			capabilities: ['shopping_list_management'],
			lastActive: new Date()
		}
	];

	// Mock conversation history
	let conversationHistory: Message[] = [];
	let userInput = '';
	let isRecording = false;

	// Helper function to add message to conversation
	function addMessage(message: Message) {
		conversationHistory = [...conversationHistory, message];
	}

	// Helper function to update agent status
	function updateAgentStatus(agentId: string, status: 'idle' | 'working' | 'error') {
		agents = agents.map((a) => (a.id === agentId ? { ...a, status } : a));
	}

	// Process audio input through Hominio and Watts
	async function processAudioInput(audioBlob: string) {
		// 1. User's audio message
		addMessage({
			id: crypto.randomUUID(),
			from: 'user',
			to: 'hominio',
			content: '[Audio Message: Recording...]',
			timestamp: new Date(),
			type: 'audio',
			status: 'completed'
		});

		// 2. Hominio delegates to Watts
		updateAgentStatus('hominio', 'working');
		addMessage({
			id: crypto.randomUUID(),
			from: 'hominio',
			to: 'watts',
			content: 'Processing audio input, requesting transcription',
			timestamp: new Date(),
			type: 'delegation',
			status: 'completed'
		});

		// 3. Watts processes the audio
		updateAgentStatus('watts', 'working');
		updateAgentStatus('hominio', 'idle');
		await delay(1500);

		// 4. Watts returns transcription to Hominio
		const transcribedText = 'Add tomatoes to my shopping list';
		addMessage({
			id: crypto.randomUUID(),
			from: 'watts',
			to: 'hominio',
			content: `Transcribed audio: "${transcribedText}"`,
			timestamp: new Date(),
			type: 'response',
			status: 'completed'
		});
		updateAgentStatus('watts', 'idle');

		// 5. Hominio delegates to Bert
		updateAgentStatus('hominio', 'working');
		await delay(500);
		addMessage({
			id: crypto.randomUUID(),
			from: 'hominio',
			to: 'bert',
			content: `Delegating shopping list request: "${transcribedText}"`,
			timestamp: new Date(),
			type: 'delegation',
			status: 'completed'
		});

		updateAgentStatus('hominio', 'idle');
		updateAgentStatus('bert', 'working');

		// 6. Bert processes the request
		await delay(1000);
		addMessage({
			id: crypto.randomUUID(),
			from: 'bert',
			to: 'user',
			content: `Added "${transcribedText}" to your shopping list`,
			timestamp: new Date(),
			type: 'response',
			status: 'completed'
		});

		updateAgentStatus('bert', 'idle');
	}

	// Process text input through Hominio
	async function processTextInput(text: string) {
		// 1. Hominio delegates to Bert
		updateAgentStatus('hominio', 'working');
		await delay(800);

		addMessage({
			id: crypto.randomUUID(),
			from: 'hominio',
			to: 'bert',
			content: `Delegating shopping list request: "${text}"`,
			timestamp: new Date(),
			type: 'delegation',
			status: 'completed'
		});

		updateAgentStatus('hominio', 'idle');
		updateAgentStatus('bert', 'working');

		await delay(1500);

		// 2. Bert processes and responds
		addMessage({
			id: crypto.randomUUID(),
			from: 'bert',
			to: 'user',
			content: `Added "${text}" to your shopping list`,
			timestamp: new Date(),
			type: 'response',
			status: 'completed'
		});

		updateAgentStatus('bert', 'idle');
	}

	// Main input processing function
	async function processUserInput() {
		if ((!userInput.trim() && !isRecording) || userInput === '[Recording in progress...]') return;

		if (!isRecording) {
			// Add user message to conversation for text input
			addMessage({
				id: crypto.randomUUID(),
				from: 'user',
				to: 'hominio',
				content: userInput,
				timestamp: new Date(),
				type: 'text',
				status: 'completed'
			});
			await processTextInput(userInput);
		} else {
			await processAudioInput(userInput);
		}

		userInput = '';
	}

	function toggleRecording() {
		isRecording = !isRecording;
		if (isRecording) {
			// Start recording
			userInput = '[Recording in progress...]';
			// Mock recording for 2 seconds
			setTimeout(async () => {
				isRecording = false;
				await processAudioInput('[Audio Data]');
			}, 2000);
		}
	}

	function delay(ms: number) {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}

	// Auto-scroll chat
	let chatContainer: HTMLElement;
	$: if (chatContainer && conversationHistory.length) {
		setTimeout(() => {
			chatContainer.scrollTop = chatContainer.scrollHeight;
		}, 0);
	}
</script>

<div class="h-screen flex flex-col">
	<!-- Header -->
	<div class="w-full p-4 variant-filled-surface">
		<h1 class="h1">Agent Control Center</h1>
		<p class="opacity-80">Monitor and interact with your AI agents</p>
	</div>

	<!-- Main Content -->
	<div class="flex-1 flex overflow-hidden">
		<!-- Left Sidebar - Agents -->
		<aside class="w-80 variant-filled-surface overflow-y-auto p-4 space-y-4 border-r border-surface-500">
			{#each agents as agent}
				<div class="card p-4 variant-filled-surface">
					<header class="flex justify-between items-center">
						<h3 class="h3">{agent.name}</h3>
						<span
							class="badge {agent.status === 'idle'
								? 'variant-filled-success'
								: agent.status === 'working'
								? 'variant-filled-warning'
								: 'variant-filled-error'}"
						>
							{agent.status}
						</span>
					</header>
					<div class="p-4">
						<p class="opacity-80">Type: {agent.type}</p>
						<div class="mt-2">
							<p class="text-sm opacity-60">Capabilities:</p>
							<div class="flex flex-wrap gap-2 mt-1">
								{#each agent.capabilities as capability}
									<span class="badge variant-soft">{capability}</span>
								{/each}
							</div>
						</div>
					</div>
				</div>
			{/each}
		</aside>

		<!-- Main Content - Conversation -->
		<main class="flex-1 flex flex-col overflow-hidden">
			<div class="flex-1 overflow-y-auto p-4 space-y-4" bind:this={chatContainer}>
				{#each conversationHistory as message}
					<div
						class="card p-3 {message.from === 'user'
							? 'variant-soft-primary ml-auto'
							: 'variant-soft'} max-w-[80%] {message.from === 'user' ? 'ml-auto' : 'mr-auto'}"
					>
						<header class="flex justify-between text-sm opacity-80">
							<span>{message.from} → {message.to}</span>
							<span>{message.type}</span>
						</header>
						<p class="mt-2">{message.content}</p>
						<footer class="flex justify-end mt-2">
							<span class="text-xs opacity-60"
								>{new Date(message.timestamp).toLocaleTimeString()}</span
							>
						</footer>
					</div>
				{/each}
			</div>

			<!-- Input Area -->
			<footer class="p-4 variant-filled-surface border-t border-surface-500">
				<div class="flex gap-2">
					<button
						class="btn variant-filled-secondary"
						class:variant-filled-error={isRecording}
						on:click={toggleRecording}
					>
						{isRecording ? 'Recording...' : 'Record'}
					</button>
					<input
						type="text"
						class="input flex-1"
						placeholder="Type your request..."
						bind:value={userInput}
						on:keydown={(e) => e.key === 'Enter' && processUserInput()}
					/>
					<button class="btn variant-filled-primary" on:click={processUserInput}>Send</button>
				</div>
			</footer>
		</main>
	</div>
</div>
