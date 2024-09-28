<script lang="ts">
	import { onMount } from 'svelte';

	let inputElement: HTMLTextAreaElement;

	export let childInput: {
		form: any;
		errors: any;
		field: any;
		constraints: any;
	};

	const { form, errors, field, constraints } = childInput;

	function autoGrow(element: HTMLTextAreaElement) {
		element.style.height = 'auto';
		element.style.height = element.scrollHeight + 'px';
	}

	onMount(() => {
		if (inputElement) {
			inputElement.focus();
			autoGrow(inputElement);
		}
	});

	function handleInput(event: Event) {
		autoGrow(event.target as HTMLTextAreaElement);
	}
</script>

<textarea
	name={field.name}
	bind:this={inputElement}
	class="w-full text-xl bg-transparent border-gray-100 rounded-md textarea border-1 ring-0 ring-white focus:outline-none focus:ring-2 focus:ring-blue-500 overflow-hidden {$errors[
		field.name
	]
		? 'input-warning'
		: ''}"
	bind:value={$form[field.name]}
	on:input={handleInput}
	aria-invalid={$errors[field.name] ? 'true' : undefined}
	{...constraints[field.name]}
/>

<style>
	textarea {
		resize: none;
		min-height: 100px;
		transition: height 0.1s ease-out;
		max-height: 300px;
	}
</style>
