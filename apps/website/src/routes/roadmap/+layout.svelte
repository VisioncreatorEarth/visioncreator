<script lang="ts">
	import { page } from '$app/stores';
</script>

<div class="roadmap-content">
	<slot />
</div>

<style>
	/* Ensure roadmap page can scroll */
	:global(html),
	:global(body) {
		margin: 0;
		padding: 0;
		width: 100%;
		height: auto !important;
		min-height: 100vh;
		overflow-y: auto !important;
		overflow-x: hidden !important;
		position: relative !important;
	}

	.roadmap-content {
		position: relative;
		width: 100%;
		height: auto;
		min-height: 100vh;
		overflow: visible;
	}
</style>
