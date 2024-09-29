<script lang="ts">
	import { superForm } from 'sveltekit-superforms/client';
	import { derived, writable, get } from 'svelte/store';
	import { submitForm } from '$lib/composables/flowOperations';
	import { eventBus } from '$lib/composables/eventBus';
	import type { SuperForm } from 'sveltekit-superforms/client';
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
	let isSubmitted = false;

	$: if (me) {
		me.subscribe((value: any) => {
			formData = value.data?.form || { fields: [], validators: {}, submitAction: '' };
			fields = formData.fields;
			validators = formData.validators;
			submitAction = formData.submitAction;
			componentId = value.id;
			fieldsStore.set(fields);
		});
	}

	let currentField = writable(0);
	let fieldsStore = writable(fields);

	let stepperState = derived([currentField, fieldsStore], ([$currentField, $fields]) => ({
		current: $currentField + 1,
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

	$: isLastStep = $currentField === $stepperState.total - 1;
	$: isOnlyOneField = fields.length <= 1;
	$: isFirstField = $currentField === 0;

	async function handleNext() {
		if (!fields[$currentField]) return;

		const currentFieldName = fields[$currentField].name;
		const validationResult = await validate(currentFieldName);

		if (validationResult && !validationResult.valid) {
			return;
		}

		const formData = get(form);

		if (isLastStep) {
			await handleSubmit();
		} else {
			currentField.update((n) => n + 1);
		}
	}

	function handlePrev() {
		currentField.update((n) => Math.max(0, n - 1));
	}

	async function handleSubmit() {
		isLoading = true;
		try {
			const formData = get(form);

			const input = fields.reduce((acc, field) => {
				acc[field.name] = formData[field.name];
				return acc;
			}, {} as Record<string, any>);

			const result = await submitForm({
				operation: submitAction,
				input: input
			});

			if (result.success) {
				submissionResult.set({ success: true, message: result.message });
				eventBus.emit(submitAction, componentId);
				// Add this line to emit the toggleModal event
				eventBus.emit('toggleModal', componentId);
				isSubmitted = true;
			} else {
				throw new Error(result.message);
			}
		} catch (error: any) {
			const errorMessage = error.message || 'An error occurred while submitting the form.';
			submissionResult.set({ success: false, message: errorMessage });
		} finally {
			isLoading = false;
		}
	}

	function handleGoAgain() {
		isSubmitted = false;
		submissionResult.set({ success: false, message: '' });
		clearFormData();
	}

	function clearFormData() {
		if (form) {
			Object.keys(get(form)).forEach((key) => {
				form.update(($form) => {
					$form[key] = '';
					return $form;
				});
			});
		}
		currentField.set(0);
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
		{#if isSubmitted}
			<div
				class="w-full px-6 py-4 my-4 text-base font-medium text-center rounded-lg card variant-ghost-success"
			>
				{$submissionResult.message}
			</div>
			<div class="flex justify-center mt-4">
				<button
					type="button"
					on:click={handleGoAgain}
					class="font-semibold btn variant-ghost-secondary btn-sm md:btn-base"
				>
					Go Again
				</button>
			</div>
		{:else}
			<div class="mb-4">
				<div class="p-4">
					<h2 class="mb-2 text-lg font-semibold text-center md:text-4xl text-tertiary-500">
						{fields[$currentField].title}
					</h2>
					{#if $errors[fields[$currentField].name]}
						<p class="text-sm text-center lg:text-2xl text-warning-500">
							{$errors[fields[$currentField].name]}
						</p>
					{:else}
						<p class="text-sm text-center lg:text-2xl text-tertiary-700">
							{fields[$currentField].description}
						</p>
					{/if}
				</div>
				{#if !isOnlyOneField}
					<div class="py-2">
						<Stepper
							{stepperState}
							{currentField}
							stepStateName={fields[$currentField]?.name || ''}
						/>
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
			</div>

			<div class="flex justify-center mt-4">
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
			</div>
		{/if}
	</form>
{/if}
