<!-- Mock Agent Interface -->
<script lang="ts">
	import { onMount } from 'svelte';
	import type { Message } from '$lib/types/agent';
	import { agentService } from '$lib/services/agentService';
	import { CAPABILITIES } from '$lib/types/agent';

	const MOCK_USER_ID = 'user123';
	let agents = [];
	let messages: Message[] = [];
	let inputText = '';
	let isRecording = false;
	let chatContainer: HTMLElement;

	onMount(async () => {
		try {
			// Create agents
			const hominio = await agentService.createAgent('hominio');
			const watts = await agentService.createAgent('watts');
			const bert = await agentService.createAgent('bert');

			// Add default capabilities
			await agentService.addAgentCapability(hominio.id, {
				name: CAPABILITIES.DELEGATION.SHOPPING,
				description: 'Can delegate shopping tasks'
			});
			await agentService.addAgentCapability(hominio.id, {
				name: CAPABILITIES.DELEGATION.AUDIO,
				description: 'Can delegate audio tasks'
			});
			await agentService.addAgentCapability(watts.id, {
				name: CAPABILITIES.AUDIO.TRANSCRIBE,
				description: 'Can transcribe audio'
			});
			await agentService.addAgentCapability(bert.id, {
				name: CAPABILITIES.SHOPPING.MANAGE,
				description: 'Can manage shopping lists'
			});

			agents = [hominio, watts, bert];
			console.log('Initialized agents:', agents);
		} catch (error) {
			console.error('Error initializing agents:', error);
		}
	});

	// Helper function to find agent by role
	function findAgentByRole(role: string) {
		return agents.find(a => a.context?.role === role);
	}

	async function processTextInput(text: string, isTranscribed = false) {
		const hominio = findAgentByRole('delegator');
		if (!hominio) throw new Error('Delegator agent not found');

		updateAgentStatus(hominio.id, 'working');

		try {
			if (!isTranscribed) {
				addMessage({
					id: crypto.randomUUID(),
					from: 'user',
					to: hominio.name,
					content: text,
					timestamp: new Date(),
					type: 'request' as const,
					status: 'pending' as const
				});
			}

			// Check shopping intent first
			const shoppingKeywords = [
				'buy',
				'shop',
				'list',
				'store',
				'grocery',
				'food',
				'item',
				'add',
				'remove',
				'delete'
			];
			const hasShoppingIntent = shoppingKeywords.some((keyword) =>
				text.toLowerCase().includes(keyword)
			);
			console.log('Shopping intent check:', { text, hasShoppingIntent });

			// Check Bert and capabilities
			const bert = findAgentByRole('shopping_manager');
			const hasShoppingCapability = await checkAgentCapability(hominio, CAPABILITIES.DELEGATION.SHOPPING);
			
			console.log('Capability check:', {
				bertFound: !!bert,
				hasShoppingCapability,
				hominioCapabilities: hominio.capabilities
			});

			if (hasShoppingIntent && bert) {
				// Update Bert's context with the shopping task
				await agentService.updateAgentContext(bert.id, {
					shopping_lists: [...(bert.context.shopping_lists || []), {
						task: text,
						timestamp: new Date()
					}]
				});

				await handleDelegation({
					to: bert.name,
					task: text,
					userMessage: `Adding "${text}" to your shopping list! 🛒`
				});
				return;
			}

			// Default response if no intent matched
			await handleDelegation({
				to: 'user',
				task: 'clarify',
				userMessage:
					"I'm not quite sure what you'd like to do. Could you please specify if this is about your shopping list or something else? 🤨"
			});
		} catch (error) {
			console.error('Error processing text:', error);
			addMessage({
				id: crypto.randomUUID(),
				from: hominio.name,
				to: 'user',
				content: error instanceof Error ? error.message : 'An error occurred',
				timestamp: new Date(),
				type: 'response' as const,
				status: 'error' as const
			});
		} finally {
			updateAgentStatus(hominio.id, 'idle');
		}
	}

	async function handleDelegation(delegation: {
		to: string;
		task: string;
		userMessage: string;
		transcribedText?: string;
	}) {
		const hominio = findAgentByRole('delegator');
		const toAgent = delegation.to !== 'user' ? findAgentByRole(getAgentRole(delegation.to)) : null;

		if (!hominio) throw new Error('Delegator agent not found');
		if (delegation.to !== 'user' && !toAgent) throw new Error(`Agent ${delegation.to} not found`);

		// Send delegation message
		if (delegation.to !== 'user') {
			addMessage({
				id: crypto.randomUUID(),
				from: hominio.name,
				to: delegation.to,
				content: delegation.userMessage,
				timestamp: new Date(),
				type: 'request' as const,
				status: 'pending' as const
			});
			updateAgentStatus(toAgent.id, 'working');
		}

		if (delegation.to === 'user') {
			addMessage({
				id: crypto.randomUUID(),
				from: hominio.name,
				to: 'user',
				content: delegation.userMessage,
				timestamp: new Date(),
				type: 'response' as const,
				status: 'completed' as const
			});
			return;
		}

		// Handle audio transcription
		if (toAgent?.context.role === 'audio_processor') {
			await delay(1000); // Simulate processing
			const transcribedText = 'Add tomatoes to my shopping list';

			// Add Watts response
			addMessage({
				id: crypto.randomUUID(),
				from: toAgent.name,
				to: hominio.name,
				content: `I've transcribed the audio: "${transcribedText}"`,
				timestamp: new Date(),
				type: 'response' as const,
				status: 'completed' as const
			});

			updateAgentStatus(toAgent.id, 'idle');

			// Process transcribed text
			await processTextInput(transcribedText, true);
			return;
		}

		// Handle shopping tasks
		if (toAgent?.context.role === 'shopping_manager') {
			await delay(500);

			// Add Bert response
			addMessage({
				id: crypto.randomUUID(),
				from: toAgent.name,
				to: hominio.name,
				content: `Added "${delegation.task}" to the shopping list! 🛒`,
				timestamp: new Date(),
				type: 'response' as const,
				status: 'completed' as const
			});

			// Hominio forwards confirmation to user
			addMessage({
				id: crypto.randomUUID(),
				from: hominio.name,
				to: 'user',
				content: `Great! I've added that to your shopping list! 🛒`,
				timestamp: new Date(),
				type: 'response' as const,
				status: 'completed' as const
			});

			updateAgentStatus(toAgent.id, 'idle');
		}
	}

	// Helper function to get agent role
	function getAgentRole(name: string): string {
		switch (name.toLowerCase()) {
			case 'watts':
				return 'audio_processor';
			case 'bert':
				return 'shopping_manager';
			case 'hominio':
				return 'delegator';
			default:
				return '';
		}
	}

	// Helper function to check if agent has required capability
	async function checkAgentCapability(agent: any, requiredCapability: string): Promise<boolean> {
		if (!agent?.capabilities) return false;
		return agent.capabilities.some((cap) => cap.name === requiredCapability);
	}

	// Helper function for delays
	function delay(ms: number) {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}

	async function processAudioInput() {
		const hominio = findAgentByRole('delegator');
		if (!hominio) throw new Error('Delegator agent not found');
		
		updateAgentStatus(hominio.id, 'working');

		const userMessage = {
			id: crypto.randomUUID(),
			from: 'user',
			to: hominio.name,
			content: '[Audio Message]',
			timestamp: new Date(),
			type: 'audio' as const,
			status: 'pending' as const
		};
		addMessage(userMessage);

		try {
			const watts = findAgentByRole('audio_processor');
			if (!watts) throw new Error('Audio processor agent not found');

			await handleDelegation({
				to: watts.name,
				task: 'transcribe_audio',
				userMessage: 'Please transcribe this audio message 🎤'
			});
		} catch (error) {
			console.error('Audio processing error:', error);
			addMessage({
				id: crypto.randomUUID(),
				from: hominio.name,
				to: 'user',
				content: error instanceof Error ? error.message : 'An error occurred',
				timestamp: new Date(),
				type: 'response' as const,
				status: 'error' as const
			});
		} finally {
			updateAgentStatus(hominio.id, 'idle');
			isRecording = false;
		}
	}

	function addMessage(message: Message) {
		messages = [...messages, message];
	}

	function updateAgentStatus(agentId: string, status: 'idle' | 'working' | 'error') {
		agents = agents.map((agent) =>
			agent.id === agentId ? { ...agent, status, lastActive: new Date() } : agent
		);
	}

	async function handleSubmit() {
		if (!inputText.trim()) return;
		const text = inputText;
		inputText = '';
		await processTextInput(text);
	}

	function toggleRecording() {
		isRecording = !isRecording;
		if (isRecording) {
			inputText = '[Recording in progress...]';
			setTimeout(async () => {
				await processAudioInput();
				inputText = '';
			}, 2000);
		}
	}

	function scrollToBottom() {
		if (chatContainer) {
			chatContainer.scrollTop = chatContainer.scrollHeight;
		}
	}

	onMount(() => {
		chatContainer = document.querySelector('.chat-container');
	});
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
						<h3 class="h3">{agent.name || agent.type}</h3>
						<span
							class="badge {agent.status === 'idle'
								? 'variant-filled-success'
								: agent.status === 'working'
								? 'variant-filled-warning'
								: 'variant-filled-error'}"
						>
							{agent.status || 'idle'}
						</span>
					</header>
					<div class="p-4">
						<p class="opacity-80">Type: {agent.type}</p>
						<div class="mt-2">
							<p class="text-sm opacity-60">Capabilities:</p>
							<div class="flex flex-wrap gap-2 mt-1">
								{#each agent.capabilities || [] as capability}
									<span class="badge variant-soft">{capability.name}</span>
								{/each}
							</div>
						</div>
					</div>
				</div>
			{/each}
		</aside>

		<!-- Main Content - Conversation -->
		<main class="flex overflow-hidden flex-col flex-1">
			<div class="overflow-y-auto flex-1 p-4 space-y-4 chat-container" bind:this={chatContainer}>
				{#each messages as message}
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
						class="btn {isRecording ? 'variant-filled-error' : 'variant-filled-secondary'}"
						on:click={toggleRecording}
					>
						{isRecording ? '🔴 Recording...' : '🎤 Record'}
					</button>
					<input
						type="text"
						class="flex-1 input"
						placeholder="Type your request..."
						bind:value={inputText}
						on:keydown={(e) => e.key === 'Enter' && handleSubmit()}
					/>
					<button class="btn variant-filled-primary" on:click={handleSubmit}>Send</button>
				</div>
			</footer>
		</main>
	</div>
</div>

<style>
	.recording {
		animation: pulse 2s infinite;
	}

	@keyframes pulse {
		0% {
			opacity: 1;
		}
		50% {
			opacity: 0.5;
		}
		100% {
			opacity: 1;
		}
	}
</style>
