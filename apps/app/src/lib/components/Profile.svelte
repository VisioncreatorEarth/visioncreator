<script lang="ts">
	import Avatar from './Avatar.svelte';
	import { onMount, onDestroy } from 'svelte';
	import { eventBus } from '$lib/composables/eventBus';

	export let me;
	const query = $me.query;

	function getLevel(invites) {
		invites = Number(invites) || 0;
		if (invites >= 3) return 3;
		if (invites >= 2) return 2;
		if (invites >= 1) return 1;
		return 0;
	}

	async function handleUpdateMe() {
		await $query.refetch();
	}

	onMount(() => {
		eventBus.on('updateMe', handleUpdateMe);
	});

	onDestroy(() => {
		eventBus.off('updateMe', handleUpdateMe);
	});
</script>

<div class="w-full max-w-6xl rounded-3xl bg-surface-800">
	<div
		class="relative text-center bg-center bg-cover rounded-t-3xl"
		style="background-image: url('/profile-bg.jpg');"
	>
		<div class="absolute inset-0 bg-opacity-40 bg-surface-900" />

		<div class="flex relative z-10 flex-col items-center text-tertiary-300">
			<div class="flex flex-col items-center p-8 pt-16">
				<Avatar
					me={{
						data: { seed: $query.data.avatar },
						design: { highlight: true },
						size: 'lg'
					}}
				/>
				<h1 class="text-2xl @3xl:text-5xl font-bold h1">
					Hey {$query.data.title ?? 'You'}
				</h1>
				<p class="text-md @3xl:text-2xl">{$query.data.description}</p>
			</div>
		</div>
	</div>

	<div class="flex items-center justify-evenly p-4 @3xl:p-8 space-x-4">
		<div class="text-center">
			<p class="text-xl @3xl:text-4xl font-semibold text-tertiary-400">
				{$query.data.stat1}
			</p>
			<p class="text-tertiary-600 text-sm @3xl:text-lg">{$query.data.stat1desc}</p>
		</div>
		<div class="text-center">
			<p class="text-xl @3xl:text-4xl font-semibold text-tertiary-400">
				{$query.data.stat2}
			</p>
			<p class="text-tertiary-600 text-sm @3xl:text-lg">{$query.data.stat2desc}</p>
		</div>
		<div class="text-center">
			<p class="text-xl @3xl:text-4xl font-semibold text-tertiary-400">
				${$query.data.stat2 * 3.33}/m
			</p>
			<p class="text-tertiary-600 text-sm @3xl:text-lg">Income Potential</p>
		</div>
	</div>
</div>
