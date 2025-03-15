<script lang="ts">
	import { createAvatar } from '@dicebear/core';
	import { lorelei } from '@dicebear/collection';

	export let seed = 'default';
	export let size = '48';

	$: avatar = createAvatar(lorelei, {
		seed,
		size: Number(size)
	});

	$: svgString = avatar.toString();
</script>

<div
	class="h-12 w-12 overflow-hidden rounded-full border-2 border-slate-800 bg-gradient-to-br from-cyan-400/20 to-yellow-400/20 backdrop-blur-xl"
>
	{@html svgString}
</div>
