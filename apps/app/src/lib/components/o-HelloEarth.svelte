<div class="hello-earth">
	<h1>Hello, Earth!</h1>
	<p>Welcome to the default component.</p>
</div>

<style lang="postcss">
	.hello-earth {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		height: 100%;
		@apply bg-surface-800 text-surface-50;
		font-family: 'Inter', sans-serif;
	}

	h1 {
		font-size: 2.5rem;
		margin-bottom: 1rem;
		@apply font-bold text-primary-400;
	}

	p {
		font-size: 1.2rem;
		@apply text-surface-200;
	}
</style>
