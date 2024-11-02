export const routes = {
    file: {
        contents: `<script lang="ts">
import '../app.css';

let greeting = "WebContainer Demo";
let features = [
  { title: "Virtual Environment", description: "Running SvelteKit in your browser" },
  { title: "Real-time Logs", description: "Monitor installation and server status" },
  { title: "Tailwind CSS", description: "Styled with modern utility classes" },
  { title: "Cross-Browser", description: "Works in modern browsers" }
];

let stats = [
  { value: "100%", label: "Browser Based" },
  { value: "0", label: "Servers Required" },
  { value: "<2s", label: "Boot Time" },
  { value: "∞", label: "Scalability" }
];
</script>

<div class="min-h-screen bg-surface-800/5 dark:bg-tertiary-100/5">
  <!-- Header -->
  <header class="bg-surface-800 dark:bg-tertiary-100 shadow-lg">
    <div class="container mx-auto px-4 py-6">
      <h1 class="text-4xl font-bold text-white dark:text-surface-800">{greeting}</h1>
      <p class="mt-2 text-surface-200 dark:text-surface-600">Experience the future of web development</p>
    </div>
  </header>

  <!-- Stats Section -->
  <div class="container mx-auto px-4 py-12">
    <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
      {#each stats as { value, label }}
        <div class="p-6 rounded-lg bg-surface-800/10 dark:bg-tertiary-100/10 backdrop-blur-sm">
          <div class="text-3xl font-bold text-primary-500">{value}</div>
          <div class="text-sm text-surface-600 dark:text-surface-400">{label}</div>
        </div>
      {/each}
    </div>
  </div>

  <!-- Features Grid -->
  <div class="container mx-auto px-4 py-12">
    <h2 class="text-2xl font-bold mb-8 text-center">Key Features</h2>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      {#each features as { title, description }}
        <div class="p-6 rounded-lg border border-surface-800/20 dark:border-tertiary-100/20 
                    bg-surface-800/5 dark:bg-tertiary-100/5 backdrop-blur-sm
                    hover:bg-surface-800/10 dark:hover:bg-tertiary-100/10 
                    transition-all duration-300">
          <h3 class="text-xl font-semibold mb-2">{title}</h3>
          <p class="text-surface-600 dark:text-surface-400">{description}</p>
        </div>
      {/each}
    </div>
  </div>

  <!-- Footer -->
  <footer class="bg-surface-900 dark:bg-tertiary-200 mt-12">
    <div class="container mx-auto px-4 py-8">
      <p class="text-center text-surface-400 dark:text-surface-600">
        Powered by WebContainers + SvelteKit + Tailwind CSS
      </p>
    </div>
  </footer>
</div>`
    }
};
