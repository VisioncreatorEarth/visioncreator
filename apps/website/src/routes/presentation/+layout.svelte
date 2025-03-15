<script lang="ts">
	// Common layout for presentation routes
	import { page } from '$app/stores';
</script>

<div class="presentation-container">
	<slot />
</div>

<style>
	/* Styles only apply to presentation routes */
	:global(body) {
		margin: 0;
		padding: 0;
		overflow: hidden !important; /* Prevent scrolling for presentation */
		font-family:
			system-ui,
			-apple-system,
			BlinkMacSystemFont,
			'Segoe UI',
			Roboto,
			Oxygen,
			Ubuntu,
			Cantarell,
			'Open Sans',
			'Helvetica Neue',
			sans-serif;
	}

	.presentation-container {
		height: 100vh;
		width: 100vw;
		overflow: hidden;
	}
</style>
