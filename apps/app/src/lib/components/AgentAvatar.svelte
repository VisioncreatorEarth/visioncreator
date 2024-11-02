<script lang="ts">
	import { createAvatar } from '@dicebear/core';
	import { lorelei } from '@dicebear/collection';

	export let agentType: 'hominio' | 'ali' | 'walter' | 'user';
	export let seed: string = '';
	export let size: 'sm' | 'md' | 'lg' = 'md';

	const agentSeeds = {
		ali: 'ali-action-agent-2024',
		walter: 'walter-wunder-agent-2024',
		user: seed || 'default-user'
	};

	function generateAvatar(seed: string): string {
		return createAvatar(lorelei, {
			size: 128,
			seed: seed,
			// Customize avatar styles for different agents
			mouth:
				agentType === 'walter'
					? ['happy01', 'happy02']
					: agentType === 'ali'
					? ['happy03', 'happy04']
					: ['happy01', 'happy02', 'happy03', 'happy04'],
			// Add more customizations for different agents if needed
			backgroundColor:
				agentType === 'walter' ? ['b6e3f4'] : agentType === 'ali' ? ['c0aede'] : undefined
		}).toDataUriSync();
	}

	$: sizeClass = size === 'lg' ? 'w-12 h-12' : 'w-8 h-8';

	$: avatar = agentType === 'hominio' ? '/logo.png' : generateAvatar(agentSeeds[agentType] || seed);
</script>

<div class="flex-shrink-0">
	<img
		src={avatar}
		alt={agentType}
		class="{sizeClass} rounded-full bg-surface-600 border border-surface-500"
	/>
</div>
