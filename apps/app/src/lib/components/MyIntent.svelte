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
	import { createMutation } from '$lib/wundergraph';
	import MessageView from './MessageView.svelte';

	// Initialize dayjs relative time plugin
	dayjs.extend(relativeTime);

	export let isOpen = false;
	export let session: any;

	const dispatch = createEventDispatcher();
	let currentAction: { action: string; view: any } | null = null;
	let modalState:
		| 'idle'
		| 'recording'
		| 'processing'
		| 'result'
		| 'need-permissions'
		| 'permissions-denied'
		| 'paywall' = 'idle';
	let currentConversation: any;
	let audioStream: MediaStream | null = null;
	let mediaRecorder: MediaRecorder | null = null;
	let audioChunks: Blob[] = [];
	let messageContainer: HTMLDivElement;

	let hominioAudio: HTMLAudioElement | null = null;
	let visualizerMode: 'user' | 'hominio' = 'user';

	// Add new type for audio context
	let audioContext: AudioContext | null = null;
	let audioInitialized = false;

	// Safe store subscription with proper typing
	conversationStore.subscribe((state) => {
		if (!state) {
			currentConversation = null;
			return;
		}

		const conversations = state.conversations || [];
		const currentConversationId = state.currentConversationId;

		if (currentConversationId && Array.isArray(conversations)) {
			currentConversation = conversations.find((conv) => conv.id === currentConversationId) || null;
		} else {
			currentConversation = null;
		}
	});

	onMount(async () => {
		await checkMicrophonePermission();
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
		isPressed = false;
		modalState = 'idle';
		visualizerMode = 'user';

		// Clean up audio playback
		if (hominioAudio) {
			hominioAudio.pause();
			hominioAudio = null;
		}

		// Clean up recording
		stopAndCleanupRecording();

		// Reset conversation
		resetConversationState();

		dispatch('close');
	}

	type ModalState =
		| 'idle'
		| 'recording'
		| 'processing'
		| 'result'
		| 'need-permissions'
		| 'permissions-denied'
		| 'paywall';

	let hasPermissions = false;
	let permissionRequesting = false;

	async function checkMicrophonePermission() {
		try {
			const permissionStatus = await navigator.permissions.query({
				name: 'microphone' as PermissionName
			});

			console.log('🎤 Microphone permission status:', permissionStatus.state);

			// Immediately update states based on current permission
			if (permissionStatus.state === 'granted') {
				hasPermissions = true;
				modalState = 'idle';
				permissionRequesting = false;
				return true;
			}

			// Set up permission change listener
			permissionStatus.addEventListener('change', () => {
				console.log('🔄 Permission state changed to:', permissionStatus.state);
				switch (permissionStatus.state) {
					case 'granted':
						hasPermissions = true;
						modalState = 'idle';
						permissionRequesting = false;
						break;
					case 'denied':
						hasPermissions = false;
						modalState = 'permissions-denied';
						permissionRequesting = false;
						break;
					case 'prompt':
						hasPermissions = false;
						modalState = 'need-permissions';
						permissionRequesting = false;
						break;
				}
			});

			return permissionStatus.state === 'granted';
		} catch (error) {
			console.error('❌ Permission check failed:', error);
			return false;
		}
	}

	// Create the mutation
	const transcribeAudioMutation = createMutation({
		operationName: 'transcribeAudio'
	});

	// Add state for tracking press
	let isPressed = false;

	async function initializeAudioContext() {
		if (!audioInitialized) {
			try {
				audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
				await audioContext.resume();
				audioInitialized = true;
				console.log('🎵 Audio context initialized');
			} catch (error) {
				console.error('❌ Audio context initialization failed:', error);
			}
		}
	}

	export async function handleLongPressStart() {
		if (isPressed) return;

		try {
			// Initialize audio context on first interaction
			await initializeAudioContext();

			isPressed = true;
			visualizerMode = 'user';

			// Set visualizer mode to user immediately
			visualizerMode = 'user';

			if (!hasPermissions) {
				modalState = 'need-permissions';
				permissionRequesting = true;

				try {
					const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
					stream.getTracks().forEach((track) => track.stop());
					hasPermissions = true;
					modalState = 'idle';
					permissionRequesting = false;
				} catch (error) {
					console.error('❌ Permission request failed:', error);
					modalState = 'permissions-denied';
					permissionRequesting = false;
					isPressed = false;
					return;
				}
			}

			// Add a small delay before starting recording on mobile
			await new Promise((resolve) => setTimeout(resolve, 100));

			audioStream = await navigator.mediaDevices.getUserMedia({
				audio: {
					echoCancellation: true,
					noiseSuppression: true,
					autoGainControl: true
				}
			});

			const options = {
				mimeType: 'audio/mp4',
				audioBitsPerSecond: 128000
			};

			mediaRecorder = new MediaRecorder(audioStream, options);
			audioChunks = [];

			mediaRecorder.ondataavailable = (event) => {
				if (event.data.size > 0) {
					audioChunks.push(event.data);
				}
			};

			mediaRecorder.start(50);
			modalState = 'recording';
		} catch (error) {
			console.error('❌ Recording setup failed:', error);
			modalState = 'error';
			isPressed = false;
			stopAndCleanupRecording();
		}
	}

	// Add helper function for recording cleanup
	function stopAndCleanupRecording() {
		console.log('🧹 Cleaning up recording resources...');

		if (mediaRecorder && mediaRecorder.state !== 'inactive') {
			mediaRecorder.stop();
			console.log('🎤 MediaRecorder stopped');
		}

		if (audioStream) {
			audioStream.getTracks().forEach((track) => {
				track.stop();
				console.log('🎤 Audio track stopped:', track.kind);
			});
			audioStream = null;
		}

		mediaRecorder = null;
		audioChunks = [];
	}

	export async function handleLongPressEnd() {
		if (!mediaRecorder || !isPressed) return;

		isPressed = false;
		console.log('🎤 Long press released, stopping recording...');

		try {
			modalState = 'processing';
			// Set hominio mode before starting audio
			visualizerMode = 'hominio';
			await playHominioWorkingAudio();

			// Add a small delay before stopping to ensure we capture the full audio
			await new Promise((resolve) => setTimeout(resolve, 200));

			// Collect final audio chunks with proper promise handling
			const audioData = await new Promise<Blob[]>((resolve) => {
				const chunks = [...audioChunks];

				mediaRecorder!.addEventListener('dataavailable', (event) => {
					if (event.data.size > 0) {
						chunks.push(event.data);
					}
				});

				mediaRecorder!.addEventListener('stop', () => {
					resolve(chunks);
				});

				mediaRecorder!.requestData();
				mediaRecorder!.stop();
			});

			// Immediately cleanup recording resources
			stopAndCleanupRecording();

			// Process the audio data
			const audioBlob = new Blob(audioData, { type: 'audio/mp4' });
			console.log('📦 Audio blob details:', {
				size: audioBlob.size,
				type: audioBlob.type,
				mimeType: audioBlob.type,
				chunksLength: audioData.length
			});

			if (audioBlob.size < 100) {
				throw new Error('Audio recording too short');
			}

			// Convert to base64
			const base64 = await new Promise<string>((resolve) => {
				const reader = new FileReader();
				reader.onloadend = () => {
					const result = reader.result as string;
					console.log('📝 Base64 conversion details:', {
						resultLength: result.length,
						startWith: result.substring(0, 50) + '...'
					});
					resolve(result);
				};
				reader.readAsDataURL(audioBlob);
			});

			console.log('🚀 Sending to API...');
			const response = await $transcribeAudioMutation.mutateAsync({
				audioBase64: base64
			});

			if (response.data.text) {
				console.log('📝 Transcription successful:', response.data.text);
				handleTranscriptionComplete(response.data.text);
			} else if (response.data.error === 'paywall') {
				console.log('ℹ️ Paywall response received');
				modalState = 'paywall';
			} else {
				throw new Error(response.data.error);
			}
		} catch (error) {
			console.error('❌ Processing failed:', error);
			modalState = 'error';
			// Reset to user mode on error
			visualizerMode = 'user';
		} finally {
			// Ensure cleanup happens
			stopAndCleanupRecording();
		}
	}

	function handleActionComplete() {
		currentAction = null;
	}

	// Add this helper function at the top with other functions
	function getRandomWorkingAudio() {
		const audioNum = Math.floor(Math.random() * 5) + 1;
		return `/audio/workingonit${audioNum}.mp3`;
	}

	async function playHominioResponse() {
		try {
			visualizerMode = 'hominio';

			await initializeAudioContext();

			if (hominioAudio) {
				hominioAudio.pause();
				hominioAudio = null;
			}

			const audioFile = getRandomWorkingAudio();
			hominioAudio = new Audio(audioFile);

			// iOS-specific attributes
			hominioAudio.setAttribute('playsinline', '');
			hominioAudio.setAttribute('webkit-playsinline', '');
			hominioAudio.muted = false;
			hominioAudio.preload = 'auto';

			await new Promise((resolve, reject) => {
				if (!hominioAudio) return reject('No audio instance');

				hominioAudio.addEventListener('canplaythrough', resolve, { once: true });
				hominioAudio.addEventListener('error', reject, { once: true });
				hominioAudio.load();
			});

			const playAttempt = hominioAudio.play();

			if (playAttempt !== undefined) {
				await playAttempt;
			}

			return new Promise((resolve) => {
				hominioAudio!.addEventListener(
					'ended',
					() => {
						hominioAudio = null;
						resolve(true);
					},
					{ once: true }
				);
			});
		} catch (error) {
			console.warn('⚠️ Audio playback not available:', error);
			return Promise.resolve(true);
		}
	}

	// Modify handleTranscriptionComplete to close the modal instead of showing messages
	async function handleTranscriptionComplete(text: string) {
		try {
			// Set hominio mode immediately
			visualizerMode = 'hominio';

			const audioPromise = hominioAudio?.paused ? playHominioResponse() : Promise.resolve(true);

			const [response] = await Promise.all([
				hominioAgent.processRequest(text, conversationManager.getMessageContext() || []),
				audioPromise
			]);

			// Close the modal after processing
			handleClose();

			// Handle different payload types
			if (response?.message?.payload) {
				switch (response.message.payload.type) {
					case 'view':
						handleViewPayload(response.message.payload);
						break;
					case 'form':
						handleFormPayload(response.message.payload);
						break;
					case 'action':
						handleActionPayload(response.message.payload);
						break;
					case 'data':
						handleDataPayload(response.message.payload);
						break;
				}
			}
		} catch (error) {
			console.error('Error processing request:', error);
			modalState = 'error';
			// Reset to user mode on error
			visualizerMode = 'user';
			conversationManager.addMessage(
				'Sorry, I encountered an error processing your request.',
				'system',
				'error'
			);
		} finally {
			if (hominioAudio) {
				hominioAudio.pause();
				hominioAudio = null;
			}
			// Reset to user mode when done
			visualizerMode = 'user';
		}
	}

	async function handleViewPayload(payload: any) {
		if (payload?.data?.view) {
			try {
				// Update the view
				dynamicView.set({ view: payload.data.view });

				// Wait a brief moment to ensure view update is processed
				await new Promise((resolve) => setTimeout(resolve, 100));

				// Close the modal and reset state
				if (payload.data.success) {
					resetConversationState();
					dispatch('close');

					// Navigate if needed
					if (window.location.pathname !== '/me') {
						await goto('/me');
					}
				}
			} catch (error) {
				console.error('Error handling view payload:', error);
			}
		}
	}

	// Update the scrollToBottom function to be more robust
	function scrollToBottom() {
		if (messageContainer) {
			// Use requestAnimationFrame to ensure DOM is updated
			requestAnimationFrame(() => {
				// Smooth scroll to bottom
				messageContainer.scrollTo({
					top: messageContainer.scrollHeight,
					behavior: 'smooth'
				});
			});
		}
	}

	// Add scroll handling when messages update
	$: if (currentConversation?.messages?.length) {
		scrollToBottom();
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
		stopAndCleanupRecording();
		if (hominioAudio) {
			hominioAudio.pause();
			hominioAudio = null;
		}
	});

	// Update playHominioWorkingAudio to handle iOS
	async function playHominioWorkingAudio() {
		try {
			visualizerMode = 'hominio';

			// Initialize audio context if needed
			await initializeAudioContext();

			if (hominioAudio) {
				hominioAudio.pause();
				hominioAudio = null;
			}

			const audioFile = getRandomWorkingAudio();
			hominioAudio = new Audio(audioFile);

			// iOS-specific attributes
			hominioAudio.setAttribute('playsinline', '');
			hominioAudio.setAttribute('webkit-playsinline', '');
			hominioAudio.muted = false;
			hominioAudio.preload = 'auto';

			// Wait for audio to be loaded
			await new Promise((resolve, reject) => {
				if (!hominioAudio) return reject('No audio instance');

				hominioAudio.addEventListener('canplaythrough', resolve, { once: true });
				hominioAudio.addEventListener('error', reject, { once: true });
				hominioAudio.load();
			});

			// Create a user interaction promise
			const playAttempt = hominioAudio.play();

			if (playAttempt !== undefined) {
				await playAttempt;
				console.log('🔊 Audio playback started successfully');
			}

			// Add ended event listener
			hominioAudio.addEventListener('ended', () => {
				console.log('🔊 Audio completed');
				hominioAudio = null;
			});
		} catch (error) {
			console.warn('⚠️ Audio playback not available:', error);
			// Continue without audio but keep hominio mode
			hominioAudio = null;
		}
	}

	let showMessages = false;
</script>

{#if isOpen}
	<div
		class="fixed inset-0 z-40 bg-surface-800/50 backdrop-blur-sm"
		on:click|self={handleClose}
		transition:fade={{ duration: 200 }}
	>
		<div class="container h-full max-w-2xl mx-auto" on:click|stopPropagation>
			<!-- Single modal structure -->
			<div class="fixed inset-x-0 bottom-0 z-50 flex justify-center p-4 mb-16">
				<div
					class="w-full max-w-6xl overflow-hidden border shadow-xl rounded-xl bg-surface-700 border-surface-600"
				>
					<!-- Header -->
					<div class="flex items-center justify-between p-4 border-b border-surface-600">
						<h2 class="text-lg font-semibold text-tertiary-200">
							{#if modalState === 'recording'}
								Recording...
							{:else if modalState === 'processing'}
								Processing...
							{:else if modalState === 'need-permissions'}
								Microphone Access
							{:else if modalState === 'permissions-denied'}
								Access Denied
							{:else if modalState === 'paywall'}
								Subscription Required
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
								{#if permissionRequesting}
									<h3 class="text-xl font-semibold text-tertiary-200">
										Requesting Microphone Access
									</h3>
									<p class="text-surface-200">Please allow microphone access in your browser.</p>
								{:else}
									<h3 class="text-xl font-semibold text-tertiary-200">Ready to Start</h3>
									<p class="text-surface-200">Press and hold to start your first request!</p>
								{/if}
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
								<AudioVisualizer
									isRecording={true}
									{audioStream}
									mode={visualizerMode}
									audioElement={null}
								/>
							</div>
						{:else if modalState === 'processing'}
							<div class="flex items-center justify-center flex-1">
								<AudioVisualizer
									isRecording={false}
									audioStream={null}
									mode={visualizerMode}
									audioElement={hominioAudio}
								/>
							</div>
						{:else if modalState === 'result'}
							<div
								class="flex-1 space-y-4 overflow-y-auto scroll-smooth"
								bind:this={messageContainer}
								style="scroll-behavior: smooth;"
							>
								{#if currentConversation?.messages?.length}
									{#each currentConversation.messages as message (message.id)}
										<MessageItem {message} {session} on:actionComplete={handleActionComplete} />
									{/each}
								{:else}
									<div class="flex items-center justify-center flex-1">
										<p class="text-lg text-tertiary-200">Press and hold to record your message</p>
									</div>
								{/if}
							</div>
						{:else if modalState === 'paywall'}
							<div class="flex flex-col items-center justify-center flex-1 space-y-4 text-center">
								<div class="text-4xl">🚀</div>
								<h3 class="text-xl font-semibold text-tertiary-200">Coming Soon!</h3>
								<p class="text-surface-200">Voice commands are currently in beta testing.</p>
								<p class="text-surface-300">
									Get early access by moving up the Visioncreator list! The higher your rank, the
									sooner you'll be invited.
								</p>
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

<!-- Messages Toggle Button -->
<button
	class="fixed z-30 p-3 transition-colors rounded-full shadow-lg bottom-4 right-4 text-tertiary-200 bg-surface-700 hover:bg-surface-600"
	on:click={() => (showMessages = !showMessages)}
>
	<svg
		class="w-6 h-6"
		xmlns="http://www.w3.org/2000/svg"
		fill="none"
		viewBox="0 0 24 24"
		stroke="currentColor"
	>
		<path
			stroke-linecap="round"
			stroke-linejoin="round"
			stroke-width="2"
			d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
		/>
	</svg>
</button>

<!-- Messages Modal -->
<MessageView isOpen={showMessages} {session} on:close={() => (showMessages = false)} />

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
