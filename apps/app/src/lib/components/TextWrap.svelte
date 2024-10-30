<script lang="ts">
	export let className = '';
</script>

<div class="flex flex-col min-h-screen overflow-hidden">
	<main class="flex-grow overflow-y-auto overflow-x-hidden w-full">
		<div class="mx-auto w-full pt-4 px-4 sm:px-6 lg:px-8" style="max-width: 64rem;">
			<div class="w-full pb-20 {className} text-wrap-content">
				<slot />
			</div>
			<div class="min-h-12" />
		</div>
	</main>
</div>

<style>
	:global(body, html) {
		height: 100%;
		margin: 0;
		padding: 0;
		overflow: hidden;
	}

	main {
		height: 100vh;
		padding-bottom: env(safe-area-inset-bottom, 16px);
	}

	:global(.text-wrap-content) {
		width: 100%;
		overflow-wrap: break-word;
		word-wrap: break-word;
		word-break: break-word;
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
