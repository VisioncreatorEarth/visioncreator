<script lang="ts">
  import { createQuery } from '$lib/wundergraph';
  
  export let sandboxId: string;
  export let path: string = '/root/app';
  
  const filesQuery = createQuery({
    operationName: 'sandboxFiles',
    input: { sandboxId, path },
    liveQuery: true
  });
  
  $: if (sandboxId && path) {
    $filesQuery.refetch();
  }
</script>

<div class="file-tree p-2 font-mono text-sm">
  {#if $filesQuery.isLoading}
    <div>Loading files...</div>
  {:else if $filesQuery.isSuccess && $filesQuery.data?.success}
    <pre>{JSON.stringify($filesQuery.data.files, null, 2)}</pre>
  {:else if $filesQuery.error}
    <div class="text-error-400">Error: {$filesQuery.error.message}</div>
  {:else}
    <div>No files found or error occurred</div>
  {/if}
</div>

<style>
  .file-tree {
    max-height: 100%;
    overflow-y: auto;
  }
</style>
