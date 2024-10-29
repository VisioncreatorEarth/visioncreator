<script lang="ts">
	import { fade } from 'svelte/transition';
	import { createEventDispatcher } from 'svelte';
	import AudioVisualizer from './AudioVisualizer.svelte';
	import { onMount, onDestroy } from 'svelte';
	import { conversationManager, conversationStore } from '$lib/stores/intentStore';
	import dayjs from 'dayjs';
	import relativeTime from 'dayjs/plugin/relativeTime';
	import MessageItem from './MessageItem.svelte';
	import { hominioAgent } from '$lib/agents/hominioAgent';
	import { goto } from '$app/navigation';
	import { dynamicView } from '$lib/stores';

	// Initialize dayjs relative time plugin
	dayjs.extend(relativeTime);

	export let isOpen = false;
	export let session: any;

	const dispatch = createEventDispatcher();
	let currentAction: { action: string; view: any } | null = null;
	let modalState:
		| 'idle'
		| 'recording'
		| 'transcribing'
		| 'result'
		| 'need-permissions'
		| 'permissions-denied' = 'idle';
	let currentConversation: any = null;
	let audioStream: MediaStream | null = null;
	let mediaRecorder: MediaRecorder | null = null;
	let audioChunks: Blob[] = [];
	let messageContainer: HTMLDivElement;

	// Simplified store subscription
	$: currentConversation = $conversationStore?.conversations?.find(
		(conv) => conv.id === $conversationStore.currentConversationId
	);

	onMount(() => {
		if (isOpen) {
			conversationManager.startNewConversation();
		}
	});

	onDestroy(() => {
		if (audioStream) {
			audioStream.getTracks().forEach((track) => track.stop());
			audioStream = null;
		}
	});

	function handleClose() {
		resetConversationState();
		dispatch('close');
	}

	type ModalState =
		| 'idle'
		| 'recording'
		| 'transcribing'
		| 'result'
		| 'need-permissions'
		| 'permissions-denied';

	let hasPermissions = false;
	let permissionRequesting = false;

	onMount(async () => {
		try {
			const result = await navigator.permissions.query({ name: 'microphone' as PermissionName });
			if (result.state === 'granted') {
				hasPermissions = true;
				modalState = 'idle'; // Set to idle to show default message view
			} else if (result.state === 'denied') {
				modalState = 'permissions-denied';
			} else {
				modalState = 'need-permissions';
			}
		} catch (error) {
			console.error('[Error] Permission check failed:', error);
			modalState = 'need-permissions';
		}
	});

	async function requestMicrophonePermissions() {
		if (hasPermissions) return true;
		if (permissionRequesting) return false;

		try {
			permissionRequesting = true;
			const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
			stream.getTracks().forEach((track) => track.stop());
			hasPermissions = true;
			modalState = 'idle'; // Set to idle first
			return true;
		} catch (error) {
			console.error('[Error] Microphone permission denied:', error);
			modalState = 'permissions-denied';
			return false;
		} finally {
			permissionRequesting = false;
		}
	}

	export async function handleLongPressStart() {
		// First check/request permissions
		if (!hasPermissions) {
			const granted = await requestMicrophonePermissions();
			if (!granted) {
				return; // Exit early if permissions weren't granted
			}
			// Don't automatically start recording after getting permissions
			return;
		}

		// Only start recording if we already had permissions
		modalState = 'recording';
		try {
			// Clean up any existing stream
			if (audioStream) {
				audioStream.getTracks().forEach((track) => track.stop());
			}

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
			console.error('[Error] Recording failed:', error);
			modalState = 'idle';
			if (audioStream) {
				audioStream.getTracks().forEach((track) => track.stop());
				audioStream = null;
			}
		}
	}

	export async function handleLongPressEnd() {
		if (!mediaRecorder || !audioStream || mediaRecorder.state === 'inactive') return;

		modalState = 'transcribing';

		try {
			// Stop the media recorder
			mediaRecorder.stop();

			// Wait for the data to be available
			await new Promise<void>((resolve) => {
				mediaRecorder!.onstop = () => resolve();
			});

			// Create blob from recorded chunks
			const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
			const formData = new FormData();
			formData.append('audio', audioBlob, 'recording.webm');

			// Send to transcription API
			const response = await fetch('/local/api/speech-to-text', {
				method: 'POST',
				body: formData
			});

			const data = await response.json();
			if (data.text) {
				modalState = 'result';
				await handleTranscriptionComplete(data.text);
			}
		} catch (error) {
			console.error('[Error] Audio processing failed:', error);
			modalState = 'idle';
		} finally {
			// Cleanup
			if (audioStream) {
				audioStream.getTracks().forEach((track) => track.stop());
			}
			audioStream = null;
			mediaRecorder = null;
			audioChunks = [];
		}
	}

	function handleActionComplete() {
		currentAction = null;
	}

	// Auto-scroll messages
	$: if (currentConversation?.messages?.length && messageContainer) {
		// Wait for DOM update
		setTimeout(() => {
			if (messageContainer) {
				messageContainer.scrollTop = messageContainer.scrollHeight;
			}
		}, 100);
	}

	// Add this function to handle voice transcription completion
	async function handleTranscriptionComplete(text: string) {
		try {
			const response = await hominioAgent.processRequest(text);

			// Handle view updates
			if (response?.message?.payload?.type === 'view') {
				const viewData = response.message.payload.view;

				// Update the dynamicView store directly
				dynamicView.update((store) => ({
					...store,
					view: viewData
				}));

				// Add a small delay to ensure the view update is processed
				setTimeout(() => {
					// Then reset state and close modal
					resetConversationState();
					dispatch('close');
					isOpen = false;

					// Navigate to /me if not already there
					if (window.location.pathname !== '/me') {
						goto('/me');
					}
				}, 300);
			}

			// Scroll to bottom after new messages
			if (messageContainer) {
				setTimeout(() => {
					messageContainer.scrollTop = messageContainer.scrollHeight;
				}, 100);
			}

			if (response?.message?.toolResult) {
				const { type, content } = response.message.toolResult;
				if (type === 'action' && content.action) {
					currentAction = content;
				}
			}
		} catch (error) {
			console.error('Error processing request:', error);
			conversationManager.addMessage(
				'Sorry, I encountered an error processing your request.',
				'agent',
				'error'
			);
		}
	}

	// Add function to reset conversation state
	function resetConversationState() {
		// Reset audio state
		if (audioStream) {
			audioStream.getTracks().forEach((track) => track.stop());
		}
		audioStream = null;
		mediaRecorder = null;
		audioChunks = [];

		// Reset modal state
		modalState = 'idle';

		// Reset conversation
		conversationManager.endCurrentConversation();
	}

	// Clean up on component destroy
	onDestroy(() => {
		resetConversationState();
	});
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
							{:else if modalState === 'need-permissions'}
								Microphone Access
							{:else if modalState === 'permissions-denied'}
								Access Denied
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
						{#if modalState === 'need-permissions'}
							<div class="flex flex-col items-center justify-center flex-1 space-y-4 text-center">
								<div class="text-4xl">🎤</div>
								<h3 class="text-xl font-semibold text-tertiary-200">Microphone Access Needed</h3>
								<p class="text-surface-200">
									Please allow microphone access to start making voice requests.
								</p>
							</div>
						{:else if modalState === 'permissions-denied'}
							<div class="flex flex-col items-center justify-center flex-1 space-y-4 text-center">
								<div class="text-4xl">🚫</div>
								<h3 class="text-xl font-semibold text-tertiary-200">Microphone Access Denied</h3>
								<p class="text-surface-200">
									Please enable microphone access in your browser settings.
								</p>
								<div class="text-sm text-surface-300">
									<p>How to enable:</p>
									<ol class="mt-2 text-left list-decimal list-inside">
										<li>Click the lock icon in your browser's address bar</li>
										<li>Find "Microphone" in the permissions list</li>
										<li>Change the setting to "Allow"</li>
										<li>Refresh the page</li>
									</ol>
								</div>
							</div>
						{:else if modalState === 'recording'}
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
							<div class="flex-1 space-y-4" bind:this={messageContainer}>
								{#if currentConversation?.messages?.length}
									{#each currentConversation.messages as message, index (message.timestamp + '-' + index)}
										<MessageItem {message} {session} on:actionComplete={handleActionComplete} />
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

<style>
	/* Add some styles for better interaction feedback */
	[role='button']:focus-visible {
		outline: 2px solid rgb(var(--color-tertiary-400));
		outline-offset: -2px;
	}

	.modal-container {
		@apply bg-surface-800 dark:bg-surface-900 rounded-lg shadow-xl;
	}
</style>
