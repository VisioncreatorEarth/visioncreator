import { defineConfig } from "vite";
import { sveltekit } from "@sveltejs/kit/vite";

export default defineConfig({
  plugins: [sveltekit()],
  optimizeDeps: {
    exclude: ["@electric-sql/pglite"],
  },
  ssr: {
    noExternal: ["@electric-sql/pglite"],
  },
});
