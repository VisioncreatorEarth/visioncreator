<script>
	import { onMount } from 'svelte';
	let mounted = false;

	onMount(() => {
		mounted = true;
	});
</script>

<div class="overflow-hidden fixed inset-0 -z-10">
	<div class="absolute inset-0">
		<div class="relative w-full h-full gradient" />
	</div>
</div>

<style>
	.gradient {
		background-image: radial-gradient(
				circle at 29% 55%,
				rgba(160, 160, 145, 0.05) 0%,
				rgba(160, 160, 145, 0.05) 4%,
				transparent 4%,
				transparent 44%,
				transparent 44%,
				transparent 100%
			),
			radial-gradient(
				circle at 85% 89%,
				rgba(160, 160, 145, 0.05) 0%,
				rgba(160, 160, 145, 0.05) 51%,
				transparent 51%,
				transparent 52%,
				transparent 52%,
				transparent 100%
			),
			radial-gradient(
				circle at 6% 90%,
				rgba(160, 160, 145, 0.05) 0%,
				rgba(160, 160, 145, 0.05) 53%,
				transparent 53%,
				transparent 64%,
				transparent 64%,
				transparent 100%
			),
			radial-gradient(
				circle at 35% 75%,
				rgba(160, 160, 145, 0.05) 0%,
				rgba(160, 160, 145, 0.05) 6%,
				transparent 6%,
				transparent 98%,
				transparent 98%,
				transparent 100%
			),
			radial-gradient(
				circle at 56% 75%,
				rgba(160, 160, 145, 0.05) 0%,
				rgba(160, 160, 145, 0.05) 16%,
				transparent 16%,
				transparent 23%,
				transparent 23%,
				transparent 100%
			),
			radial-gradient(
				circle at 42% 0%,
				rgba(160, 160, 145, 0.05) 0%,
				rgba(160, 160, 145, 0.05) 3%,
				transparent 3%,
				transparent 26%,
				transparent 26%,
				transparent 100%
			),
			radial-gradient(
				circle at 29% 28%,
				rgba(160, 160, 145, 0.05) 0%,
				rgba(160, 160, 145, 0.05) 51%,
				transparent 51%,
				transparent 75%,
				transparent 75%,
				transparent 100%
			),
			radial-gradient(
				circle at 77% 21%,
				rgba(160, 160, 145, 0.05) 0%,
				rgba(160, 160, 145, 0.05) 35%,
				transparent 35%,
				transparent 55%,
				transparent 55%,
				transparent 100%
			),
			radial-gradient(
				circle at 65% 91%,
				rgba(160, 160, 145, 0.05) 0%,
				rgba(160, 160, 145, 0.05) 46%,
				transparent 46%,
				transparent 76%,
				transparent 76%,
				transparent 100%
			),
			linear-gradient(45deg, rgb(9, 30, 57), rgb(6, 23, 65));
	}
</style>
