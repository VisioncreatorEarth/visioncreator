<script lang="ts">
	export let map = {
		name: '$map.name',
		description: '$map.description'
	};

	export let me;
	$: query = $me.query;
	$: name = $query?.data?.name || map.name;
	$: description = $query?.data?.description || map.description;
</script>

<div class="flex flex-col items-center justify-center min-h-[200px] p-8 text-center">
	<h1 class="mb-4 text-4xl font-bold">Hello {name}</h1>
	<p class="text-lg text-muted-foreground">{description}</p>
</div>
