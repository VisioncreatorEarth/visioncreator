<script lang="ts">
	import { z } from 'zod';
	import { derived, writable } from 'svelte/store';
	import { createEventDispatcher } from 'svelte';
	import { conversationManager } from '$lib/stores/intentStore';
	import { AgentWalter } from '$lib/agents/agentWalter';

	const dispatch = createEventDispatcher<{
		close: void;
		message: { role: string; content: string; timestamp: number; toolResult?: any };
	}>();

	export let me: {
		data: {
			formId?: string;
			form: {
				fields: Array<{
					name: string;
					type: string;
					title: string;
					value: string;
				}>;
				validators: string;
				submitAction: string;
			};
		};
	};

	// Create derived store from me.data.form
	$: formStore = derived(me, ($me) => ({
		formId: $me.data.formId,
		fields: $me.data.form?.fields || [],
		validators: $me.data.form?.validators || '',
		submitAction: $me.data.form?.submitAction || ''
	}));

	$: fields = $formStore.fields;
	$: validatorName = $formStore.validators;
	$: submitAction = $formStore.submitAction;
	$: formId = $formStore.formId;

	// Define schemas
	const FORM_SCHEMAS = {
		updateName: z.object({
			name: z
				.string()
				.min(2, 'Name must be at least 2 characters')
				.max(50, 'Name must not exceed 50 characters')
		}),
		sendMail: z.object({
			subject: z
				.string()
				.min(3, 'Please share a topic for your message')
				.max(75, "Let's keep the subject concise"),
			body: z
				.string()
				.min(10, 'Your message is important to us')
				.max(2000, "Let's keep it a bit shorter")
		})
	};

	// Get actual validator schema
	$: activeSchema = FORM_SCHEMAS[validatorName] || FORM_SCHEMAS.updateName;

	// Store for field values and validation states
	const fieldStates = writable({});
	let isLoading = false;
	let isSubmitted = false;
	let formError: string | null = null;

	// Initialize field states with pre-filled data
	$: {
		if (fields?.length > 0) {
			const states = fields.reduce((acc, field) => {
				acc[field.name] = {
					value: field.value || '',
					isValid: false,
					error: null
				};
				return acc;
			}, {});
			fieldStates.set(states);
		}
	}

	// Validate fields against Zod schema
	$: {
		if ($fieldStates) {
			try {
				// Parse entire form data with Zod schema
				const formData = Object.entries($fieldStates).reduce((acc, [key, state]) => {
					acc[key] = state.value;
					return acc;
				}, {});

				activeSchema.parse(formData);

				// If validation passes, update all fields as valid
				fieldStates.update((states) => {
					const newStates = { ...states };
					Object.keys(newStates).forEach((key) => {
						newStates[key] = {
							...newStates[key],
							isValid: true,
							error: null
						};
					});
					return newStates;
				});
			} catch (error) {
				if (error instanceof z.ZodError) {
					// Update field states with validation errors
					fieldStates.update((states) => {
						const newStates = { ...states };
						Object.keys(newStates).forEach((key) => {
							const fieldError = error.errors.find((err) => err.path[0] === key);
							newStates[key] = {
								...newStates[key],
								isValid: !fieldError,
								error: fieldError?.message || null
							};
						});
						return newStates;
					});
				}
			}
		}
	}

	// Check if all fields are valid
	$: isFormValid = Object.values($fieldStates).every((state) => state.isValid);

	// Add function to check for existing form state
	function getExistingFormState(formId: string) {
		const conversation = conversationManager.getCurrentConversation();
		if (!conversation) return null;

		// Look through messages in reverse order to get the latest state
		for (const message of [...conversation.messages].reverse()) {
			if (message.agent === 'walter' && message.payload?.type === 'response') {
				// Access the formState from the correct path in the payload
				const matchingFormId = message.payload.view?.formId === formId;
				const formState =
					message.payload.content?.view?.formState || message.payload.view?.formState;

				if (formState && matchingFormId) {
					console.log('Found existing form state:', { formId, formState });
					return {
						isSubmitted: formState.isSubmitted,
						success: formState.success,
						error: formState.error,
						timestamp: formState.timestamp
					};
				}
			}
		}
		return null;
	}

	// Initialize form state from conversation history
	$: {
		if (formId) {
			const existingState = getExistingFormState(formId);
			if (existingState) {
				isSubmitted = existingState.isSubmitted && existingState.success;
				formError = existingState.error || null;

				if (formError) {
					console.error('Previous form error:', formError);
				}
			}
		}
	}

	// Submit handler
	async function handleSubmit() {
		if (!isFormValid || isLoading || isSubmitted) return;

		isLoading = true;
		formError = null;

		try {
			const formValues = Object.entries($fieldStates).reduce((acc, [key, state]: [string, any]) => {
				acc[key] = state.value;
				return acc;
			}, {} as Record<string, any>);

			// Let Walter handle the form submission
			const walter = new AgentWalter();
			const result = await walter.processRequest('form_submission', {
				operation: submitAction,
				input: formValues
			});

			if (result.success && result.message) {
				isSubmitted = true;

				// Add the message to conversation
				conversationManager.addMessage({
					id: crypto.randomUUID(),
					agent: result.message.agent,
					content: result.message.content,
					status: 'complete',
					payload: result.message.payload
				});

				dispatch('close');
			} else {
				throw new Error(result.error || 'Form submission failed');
			}
		} catch (error) {
			formError = error instanceof Error ? error.message : 'Unknown error';
			console.error('Form submission error:', formError);

			// Add error message to conversation
			conversationManager.addMessage({
				id: crypto.randomUUID(),
				agent: 'walter',
				content: formError,
				status: 'error',
				payload: {
					type: 'error',
					data: { error: formError }
				}
			});
		} finally {
			isLoading = false;
		}
	}

	// Improved autoResize function
	function autoResize(event: Event) {
		const textarea = event.target as HTMLTextAreaElement;
		// Reset height temporarily to get the correct scrollHeight
		textarea.style.height = '0px';
		// Set to scrollHeight to get the full content height
		textarea.style.height = `${textarea.scrollHeight}px`;
	}

	// Add reactive statement to handle initial content and updates
	$: {
		if (fields?.length > 0) {
			// Wait for DOM update
			setTimeout(() => {
				const textareas = document.querySelectorAll('textarea');
				textareas.forEach((textarea) => {
					textarea.style.height = '0px';
					textarea.style.height = `${textarea.scrollHeight}px`;
				});
			}, 0);
		}
	}
</script>

<div class="flex flex-col w-full gap-3 p-4">
	{#each fields as field}
		<div class="flex flex-col w-full gap-2">
			<div
				class="flex items-center justify-between w-full p-3 rounded-lg bg-surface-800/50 backdrop-blur-sm"
			>
				<div class="flex-1">
					<label for={field.name} class="block text-sm font-medium text-tertiary-200">
						{field.title}
					</label>

					{#if field.type === 'textarea'}
						<textarea
							id={field.name}
							bind:value={$fieldStates[field.name].value}
							on:input={autoResize}
							class="w-full px-0 py-1 text-lg bg-transparent border-none text-tertiary-100 focus:ring-0 min-h-[2.5rem] overflow-hidden"
							rows="1"
						/>
					{:else}
						<input
							type="text"
							id={field.name}
							bind:value={$fieldStates[field.name].value}
							class="w-full px-0 py-1 text-lg bg-transparent border-none text-tertiary-100 focus:ring-0"
						/>
					{/if}
				</div>
			</div>

			{#if $fieldStates[field.name]?.error}
				<p class="text-sm text-error-400">{$fieldStates[field.name].error}</p>
			{/if}
		</div>
	{/each}

	<div class="flex justify-center w-full mt-4">
		<button
			on:click={handleSubmit}
			class="btn btn-md {isSubmitted
				? 'variant-filled-success'
				: 'bg-gradient-to-br variant-gradient-secondary-primary'}"
			disabled={!isFormValid || isLoading || isSubmitted}
		>
			{#if isLoading}
				<div class="flex items-center justify-center gap-2">
					<svg
						class="w-4 h-4 animate-spin"
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
					>
						<circle
							class="opacity-25"
							cx="12"
							cy="12"
							r="10"
							stroke="currentColor"
							stroke-width="4"
						/>
						<path
							class="opacity-75"
							fill="currentColor"
							d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
						/>
					</svg>
					<span>Processing...</span>
				</div>
			{:else if isSubmitted}
				<div class="flex items-center justify-center gap-2">
					<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
						<path
							fill-rule="evenodd"
							d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
							clip-rule="evenodd"
						/>
					</svg>
					<span>Submitted</span>
				</div>
			{:else}
				Sign to confirm
			{/if}
		</button>
	</div>
</div>

<style>
	textarea {
		display: block;
		box-sizing: border-box;
		max-height: 400px;
		resize: none;
		line-height: 1.5;
		transition: height 0.1s ease-out;
	}

	/* Hide scrollbar but keep functionality */
	textarea::-webkit-scrollbar {
		display: none;
	}

	textarea {
		-ms-overflow-style: none;
		scrollbar-width: none;
	}
</style>
