<script lang="ts">
	export let name = '';
	export let description = '';
	export let image = '';
	export let selected = false;
	export let squareImage = false;
</script>

<div
	class={`w-full flex md:hidden bg-gray-100 text-secondary-500 rounded-2xl transition-colors duration-200 ${
		selected ? 'bg-primary-500 text-white' : 'hover:bg-primary-500 hover:text-white'
	}`}
>
	<div class="relative w-1/4">
		<img
			class="absolute top-0 left-0 object-cover w-full h-full rounded-l-2xl"
			src={image}
			alt={name}
		/>
	</div>
	<div class="w-3/4 p-2 pl-4">
		<div class="font-semibold leading-normal text-left text-md">
			{name}
		</div>
		<div
			class="overflow-hidden text-xs font-normal leading-tight text-left"
			style="display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical;"
		>
			{description}<br />
			some more details
		</div>
	</div>
</div>

<div
	class={`w-full hidden md:grid md:grid-rows-card bg-gray-100 p-4 text-secondary-500 rounded-2xl transition-colors duration-200 ${
		selected ? 'bg-primary-500 text-white' : 'hover:bg-primary-500 hover:text-white'
	}`}
>
	<div class="relative row-start-1 row-end-2">
		<div style="padding-bottom: {squareImage ? '100%' : '50%'};" />
		<img
			class="absolute top-0 left-0 object-cover w-full h-full rounded-2xl"
			src={image}
			alt={name}
		/>
	</div>
	<div class="row-start-2 row-end-3 pt-2 text-xl font-semibold leading-normal text-left">
		{name}
	</div>
	<div
		class="row-start-3 row-end-4 overflow-hidden text-sm font-normal leading-tight text-left"
		style="display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical;"
	>
		{description}
	</div>
</div>

<style>
	.grid-rows-card {
		grid-template-rows: auto 1fr auto;
	}
</style>
