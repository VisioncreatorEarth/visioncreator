<script lang="ts">
	import { createAvatar } from '@dicebear/core';
	import { lorelei } from '@dicebear/collection';

	export let agentType: 'hominio' | 'vroni' | 'charly' | 'ali' | 'user';
	export let seed: string;
	export let size: 'sm' | 'md' | 'lg' = 'md';

	const agentSeeds = {
		vroni: 'vroni-agent-2024',
		charly: 'charly-agent-2024',
		ali: 'ali-agent-2024'
	};

	function generateAvatar(seed: string): string {
		return createAvatar(lorelei, {
			size: 128,
			seed: seed,
			mouth: ['happy01', 'happy02', 'happy03', 'happy04']
		}).toDataUriSync();
	}

	$: sizeClass = size === 'lg' ? 'w-12 h-12' : 'w-8 h-8';

	$: avatar =
		agentType === 'hominio'
			? '/logo.png'
			: agentType === 'user'
			? generateAvatar(seed)
			: generateAvatar(agentSeeds[agentType]);
</script>

<div class="flex-shrink-0">
	<img
		src={avatar}
		alt={agentType}
		class="{sizeClass} rounded-full bg-surface-600 border border-surface-500"
	/>
</div>
