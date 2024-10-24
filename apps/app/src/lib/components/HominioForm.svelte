<script lang="ts">
	import { z } from 'zod';
	import { derived, writable } from 'svelte/store';

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
				validators: '',
				submitAction: ''
			}
	);

	$: fields = $formStore.fields;
	$: validatorName = $formStore.validators;
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

			await me.services.core.emit('submit', {
				action: submitAction,
				values,
				componentId: me.id
			});
		} catch (error) {
			console.error('Submission error:', error);
		} finally {
			isLoading = false;
		}
	}
</script>

<div class="flex flex-col gap-4 p-4">
	{#each fields as field}
		<div class="flex flex-col gap-2">
			<h3 class="text-lg font-semibold">{field.title}</h3>
			<p class="text-sm text-tertiary-300">{field.description}</p>

			<div class="p-3 rounded-lg bg-surface-800">
				<p class="text-lg">{$fieldStates[field.name]?.value}</p>
			</div>

			{#if $fieldStates[field.name]?.error}
				<p class="text-sm text-error-500">{$fieldStates[field.name].error}</p>
			{/if}

			<div class="flex items-center gap-2">
				<div
					class={`w-2 h-2 rounded-full ${
						$fieldStates[field.name]?.isValid ? 'bg-success-500' : 'bg-error-500'
					}`}
				/>
				<p class="text-sm">{$fieldStates[field.name]?.isValid ? 'Valid' : 'Invalid'}</p>
			</div>
		</div>
	{/each}

	<button
		class="w-full p-4 mt-4 text-center text-white rounded-lg bg-primary-500 disabled:opacity-50"
		disabled={!isFormValid || isLoading}
		on:click={handleSubmit}
	>
		{#if isLoading}
			Submitting...
		{:else}
			Submit
		{/if}
	</button>
</div>
