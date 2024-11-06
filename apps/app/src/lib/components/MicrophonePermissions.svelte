<script lang="ts" context="module">
	// Export stores at module level so they can be imported
	import { writable } from 'svelte/store';
	export const permissionState = writable<'granted' | 'denied' | 'prompt' | null>('prompt');
	export const permissionRequesting = writable<boolean>(false);
</script>

<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte';

	const dispatch = createEventDispatcher<{
		permissionChange: {
			granted: boolean;
			state: 'granted' | 'denied' | 'prompt';
		};
	}>();

	export let onPermissionGranted: () => void = () => {};

	async function requestMicrophonePermission() {
		try {
			permissionRequesting.set(true);
			const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
			stream.getTracks().forEach((track) => track.stop());

			updatePermissionState('granted');
			return true;
		} catch (error) {
			console.error('❌ Permission request failed:', error);
			updatePermissionState('denied');
			return false;
		} finally {
			permissionRequesting.set(false);
		}
	}

	function updatePermissionState(state: PermissionState) {
		permissionState.set(state);
		dispatch('permissionChange', {
			granted: state === 'granted',
			state: state
		});

		if (state === 'granted') {
			onPermissionGranted();
		}
	}

	// Automatically check and request permissions on mount
	onMount(async () => {
		const permissionStatus = await navigator.permissions.query({
			name: 'microphone' as PermissionName
		});

		console.log('🎤 Initial microphone permission status:', permissionStatus.state);

		if (permissionStatus.state === 'prompt') {
			// Automatically request permission
			await requestMicrophonePermission();
		} else {
			updatePermissionState(permissionStatus.state);
		}

		// Set up permission change listener
		permissionStatus.addEventListener('change', () => {
			console.log('🔄 Permission state changed to:', permissionStatus.state);
			updatePermissionState(permissionStatus.state);
		});
	});
</script>

{#if $permissionRequesting}
	<div class="flex flex-col items-center justify-center flex-1 space-y-4 text-center">
		<div class="text-4xl">🎤</div>
		<h3 class="text-xl font-semibold text-tertiary-200">Requesting Microphone Access</h3>
		<p class="text-surface-200">Please allow microphone access when prompted.</p>
	</div>
{:else if $permissionState === 'denied'}
	<div class="flex flex-col items-center justify-center flex-1 space-y-4 text-center">
		<div class="text-4xl">🚫</div>
		<h3 class="text-xl font-semibold text-tertiary-200">Microphone Access Denied</h3>
		<p class="text-surface-200">Please enable microphone access in your browser settings.</p>
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
{:else}
	<div class="flex flex-col items-center justify-center flex-1 space-y-4 text-center">
		<div class="text-4xl">🎤</div>
		<h3 class="text-xl font-semibold text-tertiary-200">Ready to Start</h3>
		<p class="text-surface-200">Press and hold to start your first request!</p>
	</div>
{/if}
