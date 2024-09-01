<script lang="ts">
	export let className = '';
</script>

<div class="h-screen w-screen overflow-y-auto">
	<div class="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 pb-20 {className} text-wrap-content">
		<slot />
	</div>
	<div class="fixed bottom-0 left-0 w-full bg-surface-100-800-token z-10 p-2">
		<div class="max-w-4xl mx-auto text-xs">
			<nav class="custom-tabs">
				<ul class="flex justify-center items-center space-x-4">
					<li><a href="/" class="tab-link">Home</a></li>
					<slot name="custom-links" />
				</ul>
			</nav>
		</div>
	</div>
</div>

<style>
	:global(.text-wrap-content) {
		padding-bottom: 5rem;
	}
	:global(.text-wrap-content h1) {
		font-size: 2.5rem;
		font-weight: bold;
		margin-bottom: 2rem;
		line-height: 1.3;
	}
	:global(.text-wrap-content h2) {
		font-size: 1.6rem;
		font-weight: bold;
		margin-top: 2rem;
		margin-bottom: 1rem;
		line-height: 1.3;
	}
	:global(.text-wrap-content h3) {
		font-size: 1.3rem;
		font-weight: bold;
		margin-top: 1.5rem;
		margin-bottom: 0.75rem;
		line-height: 1.3;
	}
	:global(.text-wrap-content h4) {
		font-size: 1.1rem;
		font-weight: bold;
		margin-top: 1.25rem;
		margin-bottom: 0.5rem;
		line-height: 1.3;
	}
	:global(.text-wrap-content p) {
		font-size: 1rem;
		line-height: 1.5;
		margin-bottom: 1rem;
	}
	:global(.custom-tabs ul) {
		display: flex;
		list-style-type: none;
		padding: 0;
		margin: 0;
	}
	:global(.custom-tabs li) {
		display: flex;
	}
	:global(.custom-tabs .tab-link),
	:global(.custom-tabs :global(a)) {
		padding: 0.5rem 1rem;
		color: rgba(255, 255, 255, 0.7);
		text-decoration: none;
		transition: all 0.3s ease;
		white-space: nowrap;
		border-radius: 4px;
	}
	:global(.custom-tabs .tab-link:hover),
	:global(.custom-tabs :global(a:hover)) {
		color: #ffffff;
		background-color: rgba(255, 255, 255, 0.1);
		box-shadow: 0 0 10px rgba(255, 255, 255, 0.2);
	}
	@media (max-width: 640px) {
		:global(.text-wrap-content h1) {
			font-size: 2rem;
		}
		:global(.text-wrap-content h2) {
			font-size: 1.4rem;
		}
		:global(.text-wrap-content h3) {
			font-size: 1.2rem;
		}
		:global(.text-wrap-content h4) {
			font-size: 1rem;
		}
		:global(.text-wrap-content p) {
			font-size: 0.9rem;
		}
	}
</style>
