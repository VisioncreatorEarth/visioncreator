<script lang="ts">
	import Avatar from './Avatar.svelte';
	import { onMount, onDestroy } from 'svelte';
	import { eventBus } from '$lib/composables/eventBus';

	export let me;
	const query = $me.query;

	let selfEntry = null;
	let otherEntries = [];
	let peopleAhead = 0;

	$: if ($query.data && $query.data.list) {
		selfEntry = $query.data.list.find((entry) => entry.identifier === $query.data.highlightedItem);
		otherEntries = $query.data.list.filter(
			(entry) => entry.identifier !== $query.data.highlightedItem
		);
		peopleAhead = selfEntry
			? otherEntries.filter((entry) => entry.numericValue > selfEntry.numericValue).length
			: 0;
	}

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

{#if $query.isLoading}
	<p class="flex justify-center items-center p-10 w-full h-72">Loading leaderboard...</p>
{:else if $query.error}
	<p class="flex justify-center items-center p-10 w-full h-72 text-error-500">
		Error: {$query.error?.message}
	</p>
{:else if $query.data && $query.data.list}
	<div class="space-y-6">
		<ul class="space-y-2 @3xl:space-y-4">
			{#each $query.data.list as { primaryText, identifier, numericValue }, index}
				<li
					class={`flex items-center justify-between rounded-4xl ${
						identifier === $query.data.highlightedItem ? 'bg-surface-700' : 'bg-surface-800'
					}`}
				>
					<Avatar
						me={{
							data: { seed: identifier },
							design: { highlight: identifier === $query.data.highlightedItem },
							size: 'sm'
						}}
					/>

					<div
						class="flex-1 px-4 text-xl @3xl:text-2xl text-tertiary-400 overflow-hidden whitespace-nowrap text-ellipsis"
					>
						{primaryText}
					</div>

					<div class="flex justify-between px-4 @3xl:px-4 space-x-2 max-h-12 flex-shrink-0">
						<div class="flex flex-col items-center text-right">
							<p class="text-tertiary-400 text-lg @3xl:text-2xl font-semibold leading-tight">
								{numericValue}
							</p>
							<p class="text-2xs @3xl:text-xs leading-none text-tertiary-700">Inspirations</p>
						</div>
						<div class="flex flex-col items-center text-right">
							<p class="text-tertiary-400 text-lg @3xl:text-2xl font-semibold leading-tight">
								{index + 1}
							</p>
							<p class="text-2xs @3xl:text-xs leading-none text-tertiary-700">Rank</p>
						</div>
					</div>
				</li>
			{/each}
		</ul>
	</div>
{:else}
	<p class="flex justify-center items-center p-10 w-full h-72">No leaderboard data available</p>
{/if}
