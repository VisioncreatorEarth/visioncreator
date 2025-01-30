<script lang="ts">
	import { createAvatar } from '@dicebear/core';
	import { lorelei } from '@dicebear/collection';

	export let me: {
		data: { seed: string };
		design: { highlight: boolean };
		size: '2xs' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
		votes?: number;
	};

	function generateAvatar(seed: string): string {
		return createAvatar(lorelei, {
			size: 128,
			seed: seed,
			mouth: [
				'happy01',
				'happy02',
				'happy03',
				'happy04',
				'happy05',
				'happy06',
				'happy07',
				'happy08',
				'happy09',
				'happy10',
				'happy11',
				'happy12',
				'happy13',
				'happy14',
				'happy15',
				'happy16',
				'happy17',
				'happy18'
			]
		}).toDataUriSync();
	}

	$: avatar = generateAvatar(me.data.seed);
	$: bgColorClass = me.design.highlight ? 'bg-tertiary-500' : 'bg-surface-600';
	$: sizeClass =
		me.size === 'xl'
			? 'w-40 h-40 border-4 rounded-full'
			: me.size === 'lg'
			? 'w-24 h-24 mb-2 border-4 rounded-full'
			: me.size === 'md'
			? 'w-16 h-16 rounded-full'
			: me.size === 'sm'
			? 'w-12 h-12 rounded-full'
			: me.size === 'xs'
			? 'w-10 h-10 rounded-full'
			: me.size === '2xs'
			? 'w-8 h-8 rounded-full'
			: 'w-12 h-12 rounded-full';
</script>

<div class="relative">
	<img src={avatar} alt="Profile" class={`${sizeClass} ${bgColorClass} border-tertiary-200`} />
	{#if me.votes !== undefined}
		<div class="absolute inset-0 flex items-center justify-center rounded-full bg-surface-900/50">
			<span class="text-xs font-bold text-tertiary-100">{me.votes}</span>
		</div>
	{/if}
</div>
