<!--
  JsonEditor Component Documentation
  
  Architecture Overview:
  ---------------------
  This component provides a dedicated JSON editing interface with validation and error handling.
  
  Core Features:
  1. JSON Text Editing:
     - Direct text editing of JSON content
     - Real-time validation
     - Error highlighting and messages
  
  2. Change Management:
     - Tracks changes to JSON content
     - Emits events for parent components
     - Provides save/cancel functionality
  
  3. Validation:
     - Real-time JSON syntax validation
     - Optional schema validation
     - Clear error messaging
  
  Events:
  - save: Emitted when valid changes should be saved
  - cancel: Emitted when editing should be cancelled
  - change: Emitted when content changes (with validation status)
-->
<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	// Props
	export let json: any;
	export let readOnly = false;

	// Event dispatcher
	const dispatch = createEventDispatcher<{
		save: { json: any };
		cancel: void;
		change: { isValid: boolean; json: any };
	}>();

	// State
	let editedJsonText = '';
	let jsonEditError = '';
	let hasChanges = false;

	// Initialize text when json prop changes
	$: if (json) {
		editedJsonText = JSON.stringify(json, null, 2);
	}

	// Handle text changes
	function handleJsonEdit(event: Event) {
		const textarea = event.target as HTMLTextAreaElement;
		editedJsonText = textarea.value;

		try {
			const parsed = JSON.parse(editedJsonText);
			jsonEditError = '';
			hasChanges = JSON.stringify(parsed) !== JSON.stringify(json);
			dispatch('change', { isValid: true, json: parsed });
		} catch (error) {
			jsonEditError = 'Invalid JSON format';
			dispatch('change', { isValid: false, json: null });
		}
	}

	// Save changes
	function handleSave() {
		try {
			const parsed = JSON.parse(editedJsonText);
			dispatch('save', { json: parsed });
			hasChanges = false;
		} catch (error) {
			jsonEditError = 'Cannot save invalid JSON';
		}
	}

	// Cancel editing
	function handleCancel() {
		editedJsonText = JSON.stringify(json, null, 2);
		jsonEditError = '';
		hasChanges = false;
		dispatch('cancel');
	}
</script>

<div class="flex flex-col h-full">
	<!-- Editor Area -->
	<div class="flex-1 p-4 font-mono text-sm rounded-lg bg-surface-100 dark:bg-surface-800">
		<textarea
			class="w-full h-full p-0 font-mono text-sm bg-transparent border-none resize-none focus:ring-0"
			value={editedJsonText}
			on:input={handleJsonEdit}
			spellcheck="false"
			disabled={readOnly}
		/>
	</div>

	<!-- Error Display -->
	{#if jsonEditError}
		<div class="p-2 mt-2 text-sm rounded-lg text-error-500 bg-error-100 dark:bg-error-900">
			{jsonEditError}
		</div>
	{/if}

	<!-- Action Buttons -->
	{#if hasChanges && !readOnly}
		<div class="flex justify-end gap-2 mt-4">
			<button
				class="px-4 py-2 text-sm rounded-lg bg-surface-200 hover:bg-surface-300 dark:bg-surface-700 dark:hover:bg-surface-600"
				on:click={handleCancel}
			>
				Cancel
			</button>
			<button
				class="px-4 py-2 text-sm text-white rounded-lg bg-success-500 hover:bg-success-600"
				on:click={handleSave}
				disabled={!!jsonEditError}
			>
				Save Changes
			</button>
		</div>
	{/if}
</div>

<style>
	textarea {
		min-height: 200px;
	}
</style>
