import { purgeCss } from 'vite-plugin-tailwind-purgecss';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import autoImport from 'composer';

export default defineConfig({
	plugins: [
		autoImport({
			include: ['**/*.(svelte)'],
			components: ['./src/lib/components'],
			mapping: {
				UserSchema: `import { UserSchema } from '$lib/composables/UserSchema'`,
				Icon: `import Icon from '@iconify/svelte';`
			},
			module: {
				svelte: ['onMount']
			}
		}),
		sveltekit(),
		purgeCss()
	],
	server: {
		host: true, // This will listen on all network interfaces (0.0.0.0)
		port: 3000,
		// https: {
		// 	key: fs.readFileSync('./localhost+1-key.pem'),
		// 	cert: fs.readFileSync('./localhost+1.pem'),
		// },
	},
	assetsInclude: ['**/*.txt'],
	define: {
		'import.meta.env.BASE_PATH': JSON.stringify('/src/')
	},
	build: {
		rollupOptions: {
			preserveEntrySignatures: 'strict'
		}
	}
});
