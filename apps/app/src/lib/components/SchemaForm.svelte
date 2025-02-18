<script lang="ts">
	import type { Schema, SchemaProperty } from '$lib/types';
	import { createEventDispatcher, onMount } from 'svelte';

	export let schema: Schema;

	const dispatch = createEventDispatcher<{
		submit: { formData: Record<string, any> };
		cancel: void;
	}>();

	let formData: Record<string, any> = {};

	// Initialize form data when schema changes, but preserve existing values
	$: if (schema?.properties) {
		formData = {
			...initializeObjectData(schema.properties),
			...formData
		};
	}

	function initializeObjectData(properties: Record<string, SchemaProperty>) {
		return Object.entries(properties).reduce((acc, [key, prop]) => {
			if (prop.type === 'object' && prop.properties) {
				acc[key] = initializeObjectData(prop.properties);
			} else {
				switch (prop.type) {
					case 'string':
						acc[key] = formData[key] || '';
						break;
					case 'number':
					case 'integer':
						acc[key] = formData[key] || '';
						break;
					case 'boolean':
						acc[key] = formData[key] || false;
						break;
					default:
						acc[key] = formData[key] || '';
				}
			}
			return acc;
		}, {} as Record<string, any>);
	}

	function handleSubmit() {
		const processedData = processFormData(schema.properties, formData);
		dispatch('submit', { formData: processedData });
	}

	function processFormData(properties: Record<string, SchemaProperty>, data: Record<string, any>) {
		return Object.entries(properties).reduce((acc, [key, prop]) => {
			if (prop.type === 'object' && prop.properties) {
				acc[key] = processFormData(prop.properties, data[key]);
			} else if (prop.type === 'number' || prop.type === 'integer') {
				acc[key] = data[key] ? Number(data[key]) : null;
			} else {
				acc[key] = data[key];
			}
			return acc;
		}, {} as Record<string, any>);
	}

	function handleCancel() {
		dispatch('cancel');
	}
</script>

<form on:submit|preventDefault={handleSubmit} class="flex flex-col space-y-4">
	<div class="flex-1">
		{#if schema?.properties}
			{#each Object.entries(schema.properties) as [key, prop] (key)}
				{#if prop.type === 'object' && prop.properties}
					<div class="p-4 space-y-4 border rounded-lg border-surface-300-600-token">
						<h3 class="mb-2 text-sm font-medium">{prop.title || key}</h3>
						{#each Object.entries(prop.properties) as [subKey, subProp] (subKey)}
							<div class="mb-4">
								<label for={`${key}.${subKey}`} class="block mb-1 text-sm font-medium">
									{subProp.title || subKey}
									{#if prop.required?.includes(subKey)}
										<span class="text-error-500">*</span>
									{/if}
								</label>

								{#if subProp.type === 'string'}
									{#if subProp.format === 'email'}
										<input
											type="email"
											id={`${key}.${subKey}`}
											class="input"
											bind:value={formData[key][subKey]}
											required={prop.required?.includes(subKey)}
										/>
									{:else if subProp.format === 'date'}
										<input
											type="date"
											id={`${key}.${subKey}`}
											class="input"
											bind:value={formData[key][subKey]}
											required={prop.required?.includes(subKey)}
										/>
									{:else}
										<input
											type="text"
											id={`${key}.${subKey}`}
											class="input"
											bind:value={formData[key][subKey]}
											required={prop.required?.includes(subKey)}
										/>
									{/if}
								{:else if subProp.type === 'number' || subProp.type === 'integer'}
									<input
										type="number"
										id={`${key}.${subKey}`}
										class="input"
										bind:value={formData[key][subKey]}
										required={prop.required?.includes(subKey)}
									/>
								{:else if subProp.type === 'boolean'}
									<input
										type="checkbox"
										id={`${key}.${subKey}`}
										class="checkbox"
										bind:checked={formData[key][subKey]}
										required={prop.required?.includes(subKey)}
									/>
								{/if}

								{#if subProp.description}
									<p class="mt-1 text-xs text-surface-600 dark:text-surface-400">
										{subProp.description}
									</p>
								{/if}
							</div>
						{/each}
					</div>
				{:else}
					<div class="mb-4">
						<label for={key} class="block mb-1 text-sm font-medium">
							{prop.title || key}
							{#if schema.required?.includes(key)}
								<span class="text-error-500">*</span>
							{/if}
						</label>

						{#if prop.type === 'string'}
							{#if prop.format === 'email'}
								<input
									type="email"
									id={key}
									class="input"
									bind:value={formData[key]}
									required={schema.required?.includes(key)}
								/>
							{:else if prop.format === 'date'}
								<input
									type="date"
									id={key}
									class="input"
									bind:value={formData[key]}
									required={schema.required?.includes(key)}
								/>
							{:else}
								<input
									type="text"
									id={key}
									class="input"
									bind:value={formData[key]}
									required={schema.required?.includes(key)}
								/>
							{/if}
						{:else if prop.type === 'number' || prop.type === 'integer'}
							<input
								type="number"
								id={key}
								class="input"
								bind:value={formData[key]}
								required={schema.required?.includes(key)}
							/>
						{:else if prop.type === 'boolean'}
							<input
								type="checkbox"
								id={key}
								class="checkbox"
								bind:checked={formData[key]}
								required={schema.required?.includes(key)}
							/>
						{/if}

						{#if prop.description}
							<p class="mt-1 text-xs text-surface-600 dark:text-surface-400">
								{prop.description}
							</p>
						{/if}
					</div>
				{/if}
			{/each}
		{/if}
	</div>

	<!-- Footer buttons - Now always visible -->
	<div class="flex justify-end gap-2 mt-6 pt-4 border-t border-surface-300-600-token">
		<button type="button" class="btn variant-filled-surface btn-sm" on:click={handleCancel}>
			Cancel
		</button>
		<button type="submit" class="btn variant-filled-primary btn-sm">Create</button>
	</div>
</form>
