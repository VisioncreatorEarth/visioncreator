<script lang="ts">
  import { onMount, afterUpdate } from "svelte";
  import { browser } from "$app/environment";
  import { files } from "$lib/webFS";

  // Singleton instance
  let webcontainerInstance: any = null;
  let iframeEl: HTMLIFrameElement;
  let logs: string[] = [];
  let isBooting = false;
  let logsContainer: HTMLDivElement;

  function addLog(
    message: string,
    type: "info" | "error" | "success" = "info"
  ) {
    const timestamp = new Date().toLocaleTimeString();
    logs = [...logs, `[${timestamp}] [${type}] ${message}`];
    console.log(`${type.toUpperCase()}: ${message}`);
  }

  async function bootWebContainer() {
    if (isBooting) {
      addLog("WebContainer is already booting...", "info");
      return;
    }

    if (webcontainerInstance) {
      addLog("WebContainer is already running", "info");
      return;
    }

    isBooting = true;

    try {
      addLog("Loading WebContainer API...");
      const { WebContainer } = await import("@webcontainer/api");

      addLog("Booting WebContainer...");
      webcontainerInstance = await WebContainer.boot();
      addLog("WebContainer booted successfully", "success");

      addLog("Mounting virtual filesystem...");
      addLog("Files to mount:", "info");
      Object.keys(files).forEach((path) => {
        addLog(`  - ${path}`, "info");
      });

      try {
        await webcontainerInstance.mount(files);
        addLog("Virtual filesystem mounted", "success");
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        addLog(`Mount error: ${errorMessage}`, "error");
        throw error;
      }

      await startDevServer();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      addLog(`Failed to boot WebContainer: ${errorMessage}`, "error");
      console.error("Failed to boot WebContainer:", error);
    } finally {
      isBooting = false;
    }
  }

  async function startDevServer() {
    if (!webcontainerInstance) {
      addLog("WebContainer instance not found", "error");
      return;
    }

    try {
      // Set up server-ready listener before starting the server
      webcontainerInstance.on("server-ready", (port, url) => {
        addLog(`Dev server ready at ${url}`, "success");
        if (iframeEl) {
          iframeEl.src = url;
        }
      });

      // Install dependencies first
      addLog("Installing dependencies...");
      const installProcess = await webcontainerInstance.spawn("npm", [
        "install",
      ]);
      const installExitCode = await installProcess.exit;

      if (installExitCode !== 0) {
        throw new Error("Installation failed");
      }

      // Start the dev server using npm run dev instead of npx
      addLog("Starting dev server...");
      const devProcess = await webcontainerInstance.spawn("npm", [
        "run",
        "dev",
      ]);

      const devReader = devProcess.output.getReader();

      (async () => {
        try {
          while (true) {
            const { done, value } = await devReader.read();
            if (done) break;
            addLog(`dev server: ${value}`, "info");
          }
        } finally {
          devReader.releaseLock();
        }
      })();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      addLog(`Failed to start dev server: ${errorMessage}`, "error");
      throw error;
    }
  }

  onMount(async () => {
    if (!browser) return;

    try {
      await bootWebContainer();
    } catch (error) {
      addLog(`Failed to boot WebContainer: ${error}`, "error");
      console.error("Failed to boot WebContainer:", error);
    }
  });

  afterUpdate(() => {
    if (logsContainer) {
      logsContainer.scrollTop = logsContainer.scrollHeight;
    }
  });
</script>

<div class="container p-4 mx-auto">
  <div class="p-4 mb-4 rounded-lg bg-surface-800 dark:bg-tertiary-100">
    <h2 class="mb-2 text-xl font-bold">WebContainer SvelteKit Demo</h2>
    <p class="text-sm opacity-80">
      Running a virtual SvelteKit environment in your browser!
    </p>
  </div>

  <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
    <div
      class="overflow-hidden border rounded-lg border-surface-800/20 dark:border-tertiary-100/20"
    >
      <iframe
        bind:this={iframeEl}
        title="WebContainer Preview"
        class="w-full h-[600px] bg-white"
        sandbox="allow-same-origin allow-scripts allow-popups"
      />
    </div>

    <div
      class="border rounded-lg border-surface-800/20 dark:border-tertiary-100/20 bg-surface-800/5 dark:bg-tertiary-100/5"
    >
      <div
        class="p-4 border-b border-surface-800/20 dark:border-tertiary-100/20"
      >
        <h3 class="font-semibold">Environment Logs</h3>
      </div>
      <div
        bind:this={logsContainer}
        class="p-4 h-[600px] overflow-y-auto font-mono text-sm scroll-smooth"
      >
        {#each logs as log}
          <div class="mb-1">
            {#if log.includes("[error]")}
              <span class="text-red-500">{log}</span>
            {:else if log.includes("[success]")}
              <span class="text-green-500">{log}</span>
            {:else}
              <span class="opacity-80">{log}</span>
            {/if}
          </div>
        {/each}
      </div>
    </div>
  </div>
</div>
