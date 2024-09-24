<script lang="ts">
	import { fade } from 'svelte/transition';
	import Avatar from '$lib/components/Avatar.svelte';
	import type { User } from '$lib/milestone';
	import { formatCurrency } from '$lib/milestone';

	export let recentUsers: User[];
</script>

<div class="flex-grow overflow-auto">
	<h3 class="text-lg font-semibold mb-4">Recent VisionCreators</h3>
	<ul class="space-y-2">
		{#each recentUsers as user (user.identifier)}
			<li
				class="flex items-center justify-between rounded-xl p-2 {user.identifier.startsWith(
					'myself'
				)
					? 'bg-secondary-500/30'
					: 'bg-surface-700'}"
				transition:fade
			>
				<Avatar
					me={{
						data: { seed: user.identifier },
						design: { highlight: user.identifier.startsWith('myself') },
						size: 'sm'
					}}
				/>
				<div class="flex-1 px-2 flex flex-col">
					<span class="text-sm text-tertiary-400">{user.name}</span>
					<span class="text-xs text-tertiary-600">now earns {formatCurrency(user.earnings)}/m</span>
				</div>
			</li>
		{/each}
	</ul>
</div>
