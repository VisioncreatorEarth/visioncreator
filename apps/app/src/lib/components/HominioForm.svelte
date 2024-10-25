<script lang="ts">
	import { z } from 'zod';
	import { derived, writable } from 'svelte/store';
	import { submitForm } from '$lib/composables/flowOperations';
	import { createEventDispatcher } from 'svelte';
	const dispatch = createEventDispatcher<{
		close: void;
		message: { role: string; content: string; timestamp: number; toolResult?: any };
	}>();

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
				.max(40, "Let's keep the subject concise"),
			body: z
				.string()
				.min(10, 'Your message is important to us')
				.max(2000, "Let's keep it a bit shorter")
		})
	};

	export let me: any;

	// Create derived store from me.data.form
	$: formStore = derived(
		me,
		($me) =>
			$me.data.form || {
				fields: [],
				validators: '', // Now expects a string
				submitAction: ''
			}
	);

	$: fields = $formStore.fields;
	$: validatorName = $formStore.validators; // String reference to schema
	$: submitAction = $formStore.submitAction;

	// Get actual validator schema
	$: activeSchema = FORM_SCHEMAS[validatorName] || FORM_SCHEMAS.updateName;

	// Store for field values and validation states
	const fieldStates = writable({});
	let isLoading = false;

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

	// Submit handler
	async function handleSubmit() {
		if (!isFormValid) return;

		isLoading = true;
		try {
			const values = Object.entries($fieldStates).reduce((acc, [key, state]) => {
				acc[key] = state.value;
				return acc;
			}, {});

			const result = await submitForm({
				operation: submitAction,
				input: values
			});

			if (!result.error) {
				// Dispatch success message
				dispatch('message', {
					role: 'form',
					content: `Form submitted successfully: ${submitAction}`,
					timestamp: Date.now(),
					toolResult: {
						type: 'form',
						data: values
					}
				});
				dispatch('close');
			}
		} catch (error) {
			console.error('Submission error:', error);
		} finally {
			isLoading = false;
		}
	}
</script>

<div class="flex flex-col gap-3 p-4">
	{#each fields as field}
		<div class="flex flex-col gap-2">
			<!-- Field Container with Inline Layout -->
			<div
				class="flex items-center justify-between p-3 rounded-lg bg-surface-800/50 backdrop-blur-sm"
			>
				<div class="flex-1">
					<label for={field.name} class="block text-sm font-medium capitalize text-tertiary-200">
						{field.name}
					</label>
					<p class="text-lg text-tertiary-100">{$fieldStates[field.name]?.value}</p>
				</div>

				<!-- Validation Status -->
				<div class="flex items-center gap-2 px-3">
					<div
						class={`w-1.5 h-1.5 rounded-full transition-colors ${
							$fieldStates[field.name]?.isValid ? 'bg-success-400' : 'bg-error-400'
						}`}
					/>
					<p class="text-xs text-tertiary-300">
						{$fieldStates[field.name]?.isValid ? 'Valid' : 'Invalid'}
					</p>
				</div>
			</div>

			{#if $fieldStates[field.name]?.error}
				<p class="text-sm text-error-400">{$fieldStates[field.name].error}</p>
			{/if}
		</div>
	{/each}

	<div class="flex justify-center mt-2">
		<button
			class="relative px-8 py-2 font-medium text-white transition-all duration-200 btn rounded-xl bg-primary-500 hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
			disabled={!isFormValid || isLoading}
			on:click={handleSubmit}
		>
			{#if isLoading}
				<div class="flex items-center gap-2">
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
			{:else}
				Submit
			{/if}
		</button>
	</div>
</div>
