<script lang="ts">
	import '../app.css';
	import Navigation from '$lib/components/Navigation.svelte';
	import { page } from '$app/stores';
</script>

<div class="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
	<Navigation />
	
	<!-- Page content with padding for fixed header -->
	<div class="pt-16">
		<slot />
	</div>
</div>

<style>
	:global(html) {
		scroll-behavior: smooth;
	}
	
	:global(body) {
		margin: 0;
		padding: 0;
		overflow-x: hidden;
	}
</style>
