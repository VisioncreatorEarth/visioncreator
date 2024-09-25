import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
	plugins: [svelte({ hot: !process.env.VITEST })],
	test: {
		global: true,
		environment: 'jsdom',
		include: ['src/tests/*.{test,spec}.{js,ts,svelte}', 'tests/**/*.{test,spec}.{js,ts,svelte}'],
		coverage: {
			reporter: ['text', 'json', 'html']
		}
	}
});
