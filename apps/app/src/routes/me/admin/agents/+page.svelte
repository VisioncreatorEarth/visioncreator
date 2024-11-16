<!-- Mock Agent Interface -->
<script lang="ts">
	import { onMount } from 'svelte';

	interface Message {
		id: string;
		from: string;
		to: string;
		content: string;
		timestamp: Date;
		type: 'request' | 'response' | 'delegation' | 'audio' | 'text' | 'speech';
		status: 'pending' | 'processing' | 'completed' | 'error';
		context?: AgentContext;
	}

	interface Agent {
		id: string;
		name: string;
		type: string;
		status: 'idle' | 'working' | 'error';
		capabilities: string[];
		systemPrompt: string;
		lastActive: Date;
	}

	interface AgentContext {
		messages: Message[];
		systemPrompt: string;
		currentData?: any;
	}

	// Mock shopping list data
	let shoppingList = {
		id: '1',
		items: [
			{ id: 1, name: 'milk', quantity: 1 },
			{ id: 2, name: 'bread', quantity: 2 }
		]
	};

	// Mock agents data with system prompts
	let agents: Agent[] = [
		{
			id: 'hominio',
			name: 'Agent Hominio',
			type: 'Master Delegator',
			status: 'idle',
			capabilities: ['task_delegation', 'intent_analysis'],
			systemPrompt:
				'You are Hominio, the master delegator. Your role is to analyze user requests and delegate tasks to appropriate specialized agents.',
			lastActive: new Date()
		},
		{
			id: 'watts',
			name: 'Agent Watts',
			type: 'Speech Processing',
			status: 'idle',
			capabilities: ['speech_to_text'],
			systemPrompt:
				'You are Watts, the speech processing specialist. Your role is to accurately transcribe audio input to text.',
			lastActive: new Date()
		},
		{
			id: 'bert',
			name: 'Agent Bert',
			type: 'List Management',
			status: 'idle',
			capabilities: ['shopping_list_management'],
			systemPrompt:
				'You are Bert, the shopping list manager. Your role is to maintain and modify shopping lists based on user requests.',
			lastActive: new Date()
		},
		{
			id: 'sophie',
			name: 'Agent Sophie',
			type: 'Speech Synthesis',
			status: 'idle',
			capabilities: ['text_to_speech'],
			systemPrompt:
				'You are Sophie, the speech synthesis specialist. Your role is to convert text responses into natural-sounding speech.',
			lastActive: new Date()
		}
	];

	// Helper function to get agent's context
	function getAgentContext(agentId: string, relevantMessages: Message[]): AgentContext {
		const agent = agents.find((a) => a.id === agentId);
		return {
			messages: relevantMessages,
			systemPrompt: agent?.systemPrompt || '',
			currentData: agentId === 'bert' ? shoppingList : undefined
		};
	}

	// Helper function to add message with context
	function addMessage(message: Message, relevantMessages: Message[] = []) {
		const context = getAgentContext(message.to, relevantMessages);
		message.context = context;
		conversationHistory = [...conversationHistory, message];
	}

	// Mock conversation history
	let conversationHistory: Message[] = [];
	let userInput = '';
	let isRecording = false;

	// Helper function to update agent status
	function updateAgentStatus(agentId: string, status: 'idle' | 'working' | 'error') {
		agents = agents.map((a) => (a.id === agentId ? { ...a, status } : a));
	}

	// Process text input through Hominio
	async function processTextInput(text: string) {
		// 1. Hominio receives and analyzes the request
		updateAgentStatus('hominio', 'working');
		await delay(800);

		const initialAnalysis = {
			id: crypto.randomUUID(),
			from: 'hominio',
			to: 'bert',
			content: `Delegating shopping list request: "${text}"`,
			timestamp: new Date(),
			type: 'delegation',
			status: 'completed'
		};
		addMessage(initialAnalysis);

		// 2. Hominio delegates to Bert
		updateAgentStatus('bert', 'working');
		updateAgentStatus('hominio', 'idle');
		await delay(1500);

		const bertResponse = {
			id: crypto.randomUUID(),
			from: 'bert',
			to: 'hominio',
			content: `Added "${text}" to your shopping list`,
			timestamp: new Date(),
			type: 'response',
			status: 'completed'
		};
		addMessage(bertResponse);
		updateAgentStatus('bert', 'idle');

		// 3. Hominio delegates to Sophie for speech synthesis
		updateAgentStatus('hominio', 'working');
		const sophieDelegation = {
			id: crypto.randomUUID(),
			from: 'hominio',
			to: 'sophie',
			content: bertResponse.content,
			timestamp: new Date(),
			type: 'delegation',
			status: 'completed'
		};
		addMessage(sophieDelegation);

		// 4. Sophie processes the text
		updateAgentStatus('sophie', 'working');
		updateAgentStatus('hominio', 'idle');
		await delay(1000);

		const sophieResponse = {
			id: crypto.randomUUID(),
			from: 'sophie',
			to: 'hominio',
			content: bertResponse.content,
			timestamp: new Date(),
			type: 'speech',
			status: 'completed'
		};
		addMessage(sophieResponse);
		updateAgentStatus('sophie', 'idle');

		// 5. Hominio delivers the final response to the user
		updateAgentStatus('hominio', 'working');
		await delay(500);
		const finalResponse = {
			id: crypto.randomUUID(),
			from: 'hominio',
			to: 'user',
			content: sophieResponse.content,
			timestamp: new Date(),
			type: 'speech',
			status: 'completed'
		};
		addMessage(finalResponse);
		updateAgentStatus('hominio', 'idle');
	}

	// Process audio input through Hominio and Watts
	async function processAudioInput(audioBlob: string) {
		// 1. Initial audio message
		const audioMessage = {
			id: crypto.randomUUID(),
			from: 'user',
			to: 'hominio',
			content: '[Audio Message: Recording...]',
			timestamp: new Date(),
			type: 'audio',
			status: 'completed'
		};
		addMessage(audioMessage);

		// 2. Hominio delegates to Watts
		updateAgentStatus('hominio', 'working');
		const wattsDelegate = {
			id: crypto.randomUUID(),
			from: 'hominio',
			to: 'watts',
			content: 'Processing audio input, requesting transcription',
			timestamp: new Date(),
			type: 'delegation',
			status: 'completed'
		};
		addMessage(wattsDelegate);

		// 3. Watts processes audio
		updateAgentStatus('watts', 'working');
		updateAgentStatus('hominio', 'idle');
		await delay(1500);

		const transcribedText = 'Add tomatoes to my shopping list';
		const transcriptionMessage = {
			id: crypto.randomUUID(),
			from: 'watts',
			to: 'hominio',
			content: `Transcribed audio: "${transcribedText}"`,
			timestamp: new Date(),
			type: 'response',
			status: 'completed'
		};
		addMessage(transcriptionMessage);
		updateAgentStatus('watts', 'idle');

		// 4. Hominio delegates to Bert
		updateAgentStatus('hominio', 'working');
		const bertDelegation = {
			id: crypto.randomUUID(),
			from: 'hominio',
			to: 'bert',
			content: `Delegating shopping list request: "${transcribedText}"`,
			timestamp: new Date(),
			type: 'delegation',
			status: 'completed'
		};
		addMessage(bertDelegation);

		// 5. Bert processes request
		updateAgentStatus('bert', 'working');
		updateAgentStatus('hominio', 'idle');
		await delay(1000);

		const bertResponse = {
			id: crypto.randomUUID(),
			from: 'bert',
			to: 'hominio',
			content: `Added "${transcribedText}" to your shopping list`,
			timestamp: new Date(),
			type: 'response',
			status: 'completed'
		};
		addMessage(bertResponse);
		updateAgentStatus('bert', 'idle');

		// 6. Hominio delegates to Sophie
		updateAgentStatus('hominio', 'working');
		const sophieDelegation = {
			id: crypto.randomUUID(),
			from: 'hominio',
			to: 'sophie',
			content: bertResponse.content,
			timestamp: new Date(),
			type: 'delegation',
			status: 'completed'
		};
		addMessage(sophieDelegation);

		// 7. Sophie processes speech synthesis
		updateAgentStatus('sophie', 'working');
		updateAgentStatus('hominio', 'idle');
		await delay(1000);

		const sophieResponse = {
			id: crypto.randomUUID(),
			from: 'sophie',
			to: 'hominio',
			content: bertResponse.content,
			timestamp: new Date(),
			type: 'speech',
			status: 'completed'
		};
		addMessage(sophieResponse);
		updateAgentStatus('sophie', 'idle');

		// 8. Hominio delivers final response
		updateAgentStatus('hominio', 'working');
		await delay(500);
		const finalResponse = {
			id: crypto.randomUUID(),
			from: 'hominio',
			to: 'user',
			content: sophieResponse.content,
			timestamp: new Date(),
			type: 'speech',
			status: 'completed'
		};
		addMessage(finalResponse);
		updateAgentStatus('hominio', 'idle');
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

	let chatContainer: HTMLElement;

	// Optional manual scroll to bottom function
	function scrollToBottom() {
		if (chatContainer) {
			chatContainer.scrollTop = chatContainer.scrollHeight;
		}
	}
</script>

<div class="flex flex-col h-screen">
	<!-- Header -->
	<div class="p-4 w-full variant-filled-surface">
		<h1 class="h1">Agent Control Center</h1>
		<p class="opacity-80">Monitor and interact with your AI agents</p>
	</div>

	<!-- Main Content -->
	<div class="flex overflow-hidden flex-1">
		<!-- Left Sidebar - Agents -->
		<aside
			class="overflow-y-auto p-4 space-y-4 w-80 border-r variant-filled-surface border-surface-500"
		>
			{#each agents as agent}
				<div class="p-4 card variant-filled-surface">
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
		<main class="flex overflow-hidden flex-col flex-1">
			<div class="overflow-y-auto flex-1 p-4 space-y-4" bind:this={chatContainer}>
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
						{#if message.context}
							<div class="pt-2 mt-2 text-xs border-t opacity-60 border-surface-500">
								<div class="font-semibold">Context:</div>
								<div>System: {message.context.systemPrompt.slice(0, 50)}...</div>
								<div class="mt-1">
									<div class="font-semibold">Relevant Message History:</div>
									{#if message.context.messages.length === 0}
										<div class="italic">No previous messages</div>
									{:else}
										<div class="pl-2 border-l-2 border-surface-500">
											{#each message.context.messages as contextMsg}
												<div class="mb-1">
													<span class="font-semibold">{contextMsg.from} → {contextMsg.to}:</span>
													<span class="opacity-80">{contextMsg.content}</span>
												</div>
											{/each}
										</div>
									{/if}
								</div>
								{#if message.context.currentData}
									<div class="mt-1">
										<div class="font-semibold">Current Data:</div>
										<pre class="p-1 text-xs rounded bg-surface-500/20">{JSON.stringify(
												message.context.currentData,
												null,
												2
											)}</pre>
									</div>
								{/if}
							</div>
						{/if}
						<footer class="flex justify-between mt-2 text-xs opacity-60">
							<span>{new Date(message.timestamp).toLocaleTimeString()}</span>
							<button class="hover:underline" on:click={scrollToBottom}>Scroll to Bottom</button>
						</footer>
					</div>
				{/each}
			</div>

			<!-- Input Area -->
			<footer class="p-4 border-t variant-filled-surface border-surface-500">
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
						class="flex-1 input"
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
