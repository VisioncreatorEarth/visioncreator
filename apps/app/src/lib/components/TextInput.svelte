<script lang="ts">
	import { onMount } from 'svelte';

	let inputElement;

	onMount(() => {
		inputElement.focus();
	});

	export let childInput;

	const { form, errors, field, constraints } = childInput;

	$: console.log({ field });
</script>

<input
	name={field.name}
	bind:this={inputElement}
	type="text"
	class="input w-full h-10 md:h-20 px-3 py-2 text-secondary-500 text-xl md:text-4xl border-primary-500 bg-gray-100 rounded-md border-1 ring-0 ring-white focus:outline-none focus:ring-2 focus:ring-primary-500 {$errors[
		field.name
	]
		? 'input-warning'
		: ''}"
	bind:value={$form[field.name]}
	aria-invalid={$errors[field.name] ? 'true' : undefined}
	{...constraints[field.name]}
/>
