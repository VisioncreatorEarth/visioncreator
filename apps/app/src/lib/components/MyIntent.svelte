<script lang="ts">
	import { fade, slide } from 'svelte/transition';
	import { createEventDispatcher } from 'svelte';
	import AudioVisualizer from './AudioVisualizer.svelte';
	import { onMount, onDestroy } from 'svelte';
	import { conversationManager, conversationStore } from '$lib/stores/intentStore';
	import AgentAvatar from './AgentAvatar.svelte';
	import dayjs from 'dayjs';
	import relativeTime from 'dayjs/plugin/relativeTime';
	import ComposeView from './ComposeView.svelte';

	// Initialize dayjs relative time plugin
	dayjs.extend(relativeTime);

	export let isOpen = false;
	export let session = null;

	const dispatch = createEventDispatcher();
	let currentAction: { action: string; view: any } | null = null;
	let modalState: 'idle' | 'recording' | 'transcribing' | 'result' = 'idle';
	let currentConversation: any = null;
	let audioStream: MediaStream | null = null;
	let mediaRecorder: MediaRecorder | null = null;
	let audioChunks: Blob[] = [];
	let expandedMessages: Set<string> = new Set();
	let messageContainer: HTMLDivElement;
	let transcribedText = '';

	const debug = (message: string, data?: any) => {
		console.log(`[MyIntent] ${message}`, data || '');
	};

	// Safe store subscription
	$: {
		if ($conversationStore?.conversations) {
			currentConversation = $conversationStore.conversations.find(
				(conv) => conv.id === $conversationStore.currentConversationId
			);
			debug('Current conversation updated:', currentConversation);
		}
	}

	onMount(() => {
		debug('Component mounted, isOpen:', isOpen);
		if (isOpen) {
			conversationManager.startNewConversation();
		}
	});

	onDestroy(() => {
		if (audioStream) {
			audioStream.getTracks().forEach((track) => track.stop());
		}
	});

	function handleClose() {
		if (audioStream) {
			audioStream.getTracks().forEach((track) => track.stop());
		}
		audioStream = null;
		mediaRecorder = null;
		audioChunks = [];
		modalState = 'idle';
		transcribedText = '';

		// Just end the current conversation
		conversationManager.endCurrentConversation();

		dispatch('close');
	}

	export async function handleLongPressStart() {
		console.log('Starting recording...');
		modalState = 'recording';
		try {
			audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
			mediaRecorder = new MediaRecorder(audioStream);
			audioChunks = [];

			mediaRecorder.ondataavailable = (e) => {
				if (e.data.size > 0) {
					audioChunks.push(e.data);
				}
			};

			mediaRecorder.start();
		} catch (error) {
			console.error('Failed to start recording:', error);
			modalState = 'idle';
		}
	}

	export async function handleLongPressEnd() {
		debug('Stopping recording...');
		if (!mediaRecorder || !audioStream) return;

		modalState = 'transcribing';

		return new Promise((resolve) => {
			mediaRecorder!.onstop = async () => {
				try {
					const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
					const formData = new FormData();
					formData.append('audio', audioBlob, 'recording.webm');

					const response = await fetch('/local/api/speech-to-text', {
						method: 'POST',
						body: formData
					});

					const data = await response.json();
					debug('Received transcription:', data.text);

					if (data.text) {
						modalState = 'result';
						// Add user message and trigger agent responses
						conversationManager.addMessage(data.text, 'user', 'complete');
					}

					resolve(true);
				} catch (error) {
					console.error('Error processing audio:', error);
					modalState = 'idle';
					resolve(false);
				} finally {
					if (audioStream) {
						audioStream.getTracks().forEach((track) => track.stop());
					}
					audioStream = null;
					mediaRecorder = null;
					audioChunks = [];
				}
			};

			mediaRecorder!.stop();
		});
	}

	function togglePayloads(messageId: string) {
		if (expandedMessages.has(messageId)) {
			expandedMessages.delete(messageId);
		} else {
			expandedMessages.add(messageId);
		}
		expandedMessages = expandedMessages; // trigger reactivity
	}

	// Helper function to format timestamp
	function formatTime(timestamp: string) {
		return dayjs(timestamp).fromNow();
	}

	// Add the hardcoded action view for testing
	const actionUpdateNameView = {
		id: 'ActionContainer',
		layout: {
			rows: '1fr auto',
			areas: `"main"`
		},
		children: [
			{
				id: 'HominioAction',
				component: 'HominioAction',
				slot: 'main',
				data: {
					form: {
						fields: [
							{
								name: 'name',
								type: 'text',
								title: 'What is your name?',
								description: 'Please enter your first name',
								value: 'Samuel' // Hardcoded for testing
							}
						],
						validators: 'updateName',
						submitAction: 'updateMe'
					}
				}
			}
		]
	};

	// Add function to handle action completion
	function handleActionComplete(event: CustomEvent) {
		debug('Action completed:', event.detail);
		currentAction = null;
		// Additional handling as needed
	}

	// Add debug for action views
	$: if (currentAction) {
		debug('Current action view:', currentAction);
	}

	// Update the message container when new messages arrive
	$: if (currentConversation?.messages?.length) {
		setTimeout(() => {
			if (messageContainer) {
				messageContainer.scrollTop = messageContainer.scrollHeight;
			}
		}, 100);
	}
</script>

{#if isOpen}
	<div
		class="fixed inset-0 z-40 bg-surface-800/50 backdrop-blur-sm"
		class:hidden={!isOpen}
		on:click|self={() => dispatch('close')}
		transition:fade={{ duration: 200 }}
	>
		<div class="container h-full max-w-2xl mx-auto" on:click|stopPropagation>
			<div class="fixed inset-x-0 bottom-0 z-50 flex justify-center p-4 mb-16">
				<div
					class="w-full max-w-6xl overflow-hidden border shadow-xl rounded-xl bg-surface-700 border-surface-600"
				>
					<!-- Header -->
					<div class="flex items-center justify-between p-4 border-b border-surface-600">
						<h2 class="text-lg font-semibold text-tertiary-200">
							{#if modalState === 'recording'}
								Recording...
							{:else if modalState === 'transcribing'}
								Transcribing...
							{:else}
								Your Message
							{/if}
						</h2>
						<button
							class="flex items-center justify-center w-8 h-8 transition-colors rounded-full hover:bg-surface-600/50"
							on:click={handleClose}
						>
							<svg
								class="w-6 h-6 text-tertiary-200"
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M6 18L18 6M6 6l12 12"
								/>
							</svg>
						</button>
					</div>

					<!-- Content -->
					<div class="flex flex-col min-h-[200px] max-h-[60vh] overflow-y-auto p-6">
						{#if modalState === 'recording'}
							<div class="flex items-center justify-center flex-1">
								<AudioVisualizer isRecording={true} {audioStream} />
							</div>
						{:else if modalState === 'transcribing'}
							<div class="flex items-center justify-center flex-1">
								<div
									class="w-12 h-12 border-4 rounded-full border-primary-500 border-t-transparent animate-spin"
								/>
							</div>
						{:else if modalState === 'result'}
							<!-- Message history with action views -->
							<div class="flex-1 space-y-4" bind:this={messageContainer}>
								{#if currentConversation?.messages?.length}
									{#each currentConversation.messages as message (message.id)}
										<div
											class="flex justify-{message.type === 'user'
												? 'end'
												: 'start'} items-start space-x-3"
											transition:slide
										>
											{#if message.type === 'agent'}
												<AgentAvatar agentType={message.agentType} seed={message.agentType} />
											{/if}

											<div class="flex flex-col space-y-1 max-w-[80%]">
												<!-- Agent header -->
												{#if message.type === 'agent'}
													<div class="flex items-center space-x-2">
														<span class="text-xs font-medium text-tertiary-300">
															{message.agentType === 'hominio' ? 'Hominio' : 'Ali (Action Agent)'}
														</span>
														<span class="text-xs text-tertiary-600">
															{formatTime(message.timestamp)}
														</span>
													</div>
												{/if}

												<!-- Message content -->
												<div
													class="relative {message.type === 'user'
														? 'bg-primary-500 text-white'
														: 'bg-surface-600 text-tertiary-200'} 
													px-4 py-2 rounded-2xl {message.type === 'user' ? 'rounded-tr-sm' : 'rounded-tl-sm'}"
												>
													<p class="text-sm whitespace-pre-wrap">{message.content}</p>
												</div>

												<!-- Action view if present -->
												{#if message.payloads?.length > 0}
													{#each message.payloads as payload}
														{#if payload.type === 'action'}
															<div
																class="w-full mt-4 overflow-hidden border rounded-xl bg-surface-800 border-surface-600"
																transition:slide
															>
																<ComposeView
																	view={payload.content.view}
																	{session}
																	showSpacer={false}
																	on:actionComplete={handleActionComplete}
																/>
															</div>
														{/if}
													{/each}
												{/if}
											</div>

											{#if message.type === 'user'}
												<AgentAvatar agentType="user" seed={session?.user?.id || 'default'} />
											{/if}
										</div>
									{/each}
								{:else}
									<div class="flex items-center justify-center flex-1">
										<p class="text-lg text-tertiary-200">Press and hold to record your message</p>
									</div>
								{/if}
							</div>
						{:else}
							<div class="flex items-center justify-center flex-1">
								<p class="text-lg text-tertiary-200">Press and hold to record your message</p>
							</div>
						{/if}
					</div>
				</div>
			</div>
		</div>
	</div>
{/if}
