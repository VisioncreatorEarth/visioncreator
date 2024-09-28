<script lang="ts">
	import { superForm } from 'sveltekit-superforms/client';
	import { derived, writable, get } from 'svelte/store';
	import { log } from '$lib/stores';
	import { submitForm } from '$lib/composables/flowOperations';
	import { eventBus } from '$lib/composables/eventBus';
	import type { SuperForm } from 'sveltekit-superforms/client';
	import Stepper from '$lib/components/Stepper.svelte';
	import { eventConfig } from '$lib/composables/eventConfig';

	export let me: any;

	let formData: any;
	let fields: any[] = [];
	let validators: Record<string, any> = {};
	let submitAction = '';
	let form: SuperForm<any>;
	let errors: any;
	let validate: any;
	let constraints: any;
	let componentId: string;

	let isLoading = false;

	$: if (me) {
		me.subscribe((value: any) => {
			formData = value.data?.form || { fields: [], validators: {}, submitAction: '' };
			fields = formData.fields;
			validators = formData.validators;
			submitAction = formData.submitAction;
			componentId = value.id;

			log('info', 'Current me data context', {
				formData,
				fields: fields.length,
				validators: Object.keys(validators).length,
				submitAction,
				componentId
			});
		});
	}

	let currentField = writable(0);
	let stepperState = derived([currentField, writable(fields)], ([$currentField, $fields]) => ({
		current: $currentField,
		total: $fields.length
	}));

	$: initialFormData = fields.reduce((acc, field) => {
		acc[field.name] = field.placeholder || '';
		return acc;
	}, {} as Record<string, string>);

	$: formConfig = {
		validators: validators,
		warnings: { noValidationAndConstraints: false },
		validationMethod: 'oninput' as const,
		clearOnSubmit: 'errors-and-message' as const
	};

	$: if (initialFormData && Object.keys(initialFormData).length > 0) {
		({ form, errors, validate, constraints } = superForm(initialFormData, formConfig));
	}

	let submissionResult = writable({ success: false, message: '' });

	$: isLastStep = $currentField === fields.length - 1;
	$: isOnlyOneField = fields.length === 1;
	$: isFirstField = $currentField === 0;

	async function handleNext() {
		if (!fields[$currentField]) return;

		const currentFieldName = fields[$currentField].name;
		const validationResult = await validate(currentFieldName);

		if (validationResult && !validationResult.valid) {
			log('error', `Validation failed for field: ${currentFieldName}`, {
				errors: $errors?.[currentFieldName]
			});
			return;
		}

		const formData = get(form);
		log('info', 'Current form data', {
			currentField: $currentField,
			totalFields: fields.length,
			currentFieldName: fields[$currentField]?.name,
			allFormData: formData
		});

		if (isLastStep) {
			await handleSubmit();
		} else {
			currentField.update((n) => n + 1);
		}
	}

	function handlePrev() {
		currentField.update((n) => n - 1);
	}

	async function handleSubmit() {
		isLoading = true;
		try {
			const formData = get(form);
			log('info', 'Submitting form', { formData });

			const input = fields.reduce((acc, field) => {
				acc[field.name] = formData[field.name];
				return acc;
			}, {} as Record<string, any>);

			log('info', 'Prepared input for submission', { input, submitAction });

			const result = await submitForm({
				operation: submitAction,
				input: input
			});

			log('info', 'Form submission result', { result });

			if (result.success) {
				submissionResult.set({ success: true, message: result.message });
				log('success', 'Form submitted successfully', result);

				// Emit the toggleModal event for both updateMe and sendMail actions
				eventBus.emit('toggleModal', componentId);

				clearFormData();
			} else {
				throw new Error(result.message);
			}
		} catch (error: any) {
			const errorMessage = error.message || 'An error occurred while submitting the form.';
			submissionResult.set({ success: false, message: errorMessage });
			log('error', 'Form submission failed', { error: errorMessage });
		} finally {
			isLoading = false;
		}
	}

	function clearFormData() {
		// Reset the form to its initial state
		if (form) {
			Object.keys(get(form)).forEach((key) => {
				form.update(($form) => {
					$form[key] = '';
					return $form;
				});
			});
		}
		// Reset the current field to the first one
		currentField.set(0);
	}

	function handleGoAgain() {
		if ($submissionResult.success) {
			// If it was a successful submission, form data is already cleared
			submissionResult.set({ success: false, message: '' });
		} else {
			// If it was an error, just clear the error message
			submissionResult.set({ success: false, message: '' });
		}
	}

	function handleKeyDown(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			event.preventDefault();
			handleNext();
		}
	}

	$: childInput =
		form && errors && validate && constraints
			? {
					form,
					errors,
					validate,
					field: fields[$currentField],
					constraints
			  }
			: null;

	$: isFieldValid =
		$form &&
		fields[$currentField]?.name in $form &&
		$form[fields[$currentField]?.name] !== '' &&
		!$errors?.[fields[$currentField]?.name];

	$: isFormValid =
		$form && Object.keys($form).length > 0 && Object.values($form).every((value) => value !== '');
</script>

{#if fields.length > 0 && childInput}
	<form on:submit|preventDefault={handleNext} on:keydown={handleKeyDown} class="w-full">
		<div class="mb-4">
			<div class="p-4">
				<h2 class="mb-2 text-lg font-semibold text-center md:text-4xl text-tertiary-500">
					{fields[$currentField].title}
				</h2>
				<p class="text-sm text-center lg:text-2xl text-tertiary-700">
					{fields[$currentField].description}
				</p>
			</div>

			{#if isLoading}
				<div class="flex flex-col items-center justify-center p-8">
					<Icon icon="eos-icons:loading" class="w-12 h-12 text-tertiary-500 animate-spin" />
				</div>
			{:else if $submissionResult.success || $submissionResult.message}
				<div
					class="w-full px-6 py-4 my-4 text-base font-medium text-center rounded-lg card variant-ghost-{$submissionResult.success
						? 'success'
						: 'error'}"
				>
					{$submissionResult.message}
				</div>
			{:else}
				{#if !isOnlyOneField}
					<div class="py-2">
						<Stepper {stepperState} stepStateName={fields[$currentField]?.name || ''} />
					</div>
				{/if}

				{#key $currentField}
					{#if fields[$currentField].type === 'text'}
						<TextInput {childInput} />
					{:else if fields[$currentField].type === 'email'}
						<TextInput {childInput} />
					{:else if fields[$currentField].type === 'textarea'}
						<TextAreaInput {childInput} />
					{:else if fields[$currentField].type === 'select'}
						<SelectInput {childInput} />
					{:else if fields[$currentField].type === 'slider'}
						<SliderInput {childInput} />
					{:else if fields[$currentField].type === 'toggle'}
						<ToggleInput {childInput} />
					{:else if fields[$currentField].type === 'number'}
						<NumberInput {childInput} />
					{:else if fields[$currentField].type === 'cardSelect'}
						<CardSelectInput {childInput} />
					{:else if fields[$currentField].type === 'dateRange'}
						<DateRangeInput {childInput} />
					{/if}
				{/key}
			{/if}

			<div class="flex justify-center mt-4">
				{#if $submissionResult.success || $submissionResult.message}
					<button
						type="button"
						on:click={handleGoAgain}
						class="font-semibold btn variant-ghost-secondary btn-sm md:btn-base"
					>
						Go Again
					</button>
				{:else}
					<div class="flex justify-between w-full">
						<div>
							{#if !isOnlyOneField && !isFirstField}
								<button
									type="button"
									on:click={handlePrev}
									class="font-semibold btn btn-sm md:btn-base variant-ghost-secondary"
									disabled={isLoading}
								>
									<span>
										<Icon icon="solar:alt-arrow-left-bold" class="h-5 text-white" />
									</span>
								</button>
							{/if}
						</div>
						<div>
							<button
								type="button"
								on:click={handleNext}
								class="font-semibold btn variant-ghost-secondary btn-sm md:btn-base"
								disabled={!isFieldValid || (isLastStep && !isFormValid) || isLoading}
							>
								{isLastStep ? 'Submit' : 'Next'}
							</button>
						</div>
					</div>
				{/if}
			</div>
		</div>
	</form>
{/if}
