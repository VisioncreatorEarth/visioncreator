export const packageJson = {
    file: {
        contents: JSON.stringify({
            name: "sveltekit-hello-earth",
            version: "0.0.1",
            private: true,
            type: "module",
            scripts: {
                dev: "vite dev --host --port 5173",
                build: "vite build",
                preview: "vite preview"
            },
            devDependencies: {
                "@sveltejs/adapter-auto": "^3.0.0",
                "@sveltejs/kit": "^2.0.0",
                "@sveltejs/vite-plugin-svelte": "^3.0.0",
                "svelte": "^4.2.7",
                "vite": "^5.0.3",
                "typescript": "^5.0.0",
                "autoprefixer": "^10.4.16",
                "postcss": "^8.4.32",
                "tailwindcss": "^3.3.6",
                "@tailwindcss/forms": "^0.5.7"
            }
        }, null, 2)
    }
};
