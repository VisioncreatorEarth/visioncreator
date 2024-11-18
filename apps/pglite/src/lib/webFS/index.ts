import { packageJson } from './packageJson';
import { svelteConfig } from './svelteConfig';
import { viteConfig } from './viteConfig';
import { appHtml } from './appHtml';
import { routes } from './routes';
import { packageLock } from './packageLock';
import { postcssConfig } from './postcssConfig';
import { tailwindConfig } from './tailwindConfig';
import { appCss } from './appCss';
import { nodeModules } from './nodeModules';

// Ensure all file paths use forward slashes and are properly structured
export const files = {
    'package.json': packageJson,
    'package-lock.json': packageLock,
    'svelte.config.js': svelteConfig,
    'vite.config.js': viteConfig,
    'postcss.config.js': postcssConfig,
    'tailwind.config.js': tailwindConfig,
    'node_modules': nodeModules,
    'src': {
        directory: {
            'app.html': appHtml,
            'app.css': appCss,
            'routes': {
                directory: {
                    '+page.svelte': routes
                }
            }
        }
    }
};
