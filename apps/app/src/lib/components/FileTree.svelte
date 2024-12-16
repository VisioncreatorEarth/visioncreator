<script lang="ts">
  import { createQuery } from '$lib/wundergraph';
  import { createEventDispatcher } from 'svelte';
  
  export let sandboxId: string;
  export let path: string = '/root/app';
  
  const dispatch = createEventDispatcher();
  
  interface FileNode {
    name: string;
    type: 'dir' | 'file';
    path: string;
  }

  const filesQuery = createQuery({
    operationName: 'sandboxFiles',
    input: { sandboxId, path }
  });

  const readFileQuery = createQuery({
    operationName: 'sandboxFsRead',
    enabled: false,
    input: { 
      sandboxId, 
      path: '/root/app'  // Default path
    }
  });

  let expandedPaths = new Set<string>();

  function toggleDirectory(node: FileNode) {
    console.log('Toggle directory:', node);
    if (expandedPaths.has(node.path)) {
      expandedPaths.delete(node.path);
    } else {
      expandedPaths.add(node.path);
      // Refetch files for this directory
      $filesQuery.refetch({ input: { sandboxId, path: node.path } });
    }
    expandedPaths = expandedPaths; // Trigger reactivity
  }

  async function handleFileClick(node: FileNode) {
    console.log('🎯 FileTree: handleFileClick called with node:', node);
    
    // Skip if node is a directory
    if (node.type === 'dir') {
      console.log('⚠️ FileTree: Skipping directory:', node.path);
      return;
    }
    
    console.log('📤 FileTree: Dispatching file select with path:', node.path);
    dispatch('fileSelect', { path: node.path });
  }

  // Only fetch on mount and when path changes due to directory expansion
  $: if (sandboxId && path && !$filesQuery.data) {
    console.log('Fetching files for:', { sandboxId, path });
    $filesQuery.refetch();
  }
</script>

<div class="file-tree p-2 font-mono text-sm">
  {#if $filesQuery.isLoading}
    <div>Loading files...</div>
  {:else if $filesQuery.isSuccess && $filesQuery.data?.success}
    {#each $filesQuery.data.files as file}
      <div class="pl-2">
        {#if file.type === 'dir'}
          <div 
            class="flex items-center cursor-pointer hover:bg-surface-700 p-1 rounded"
            on:click={() => toggleDirectory(file)}
          >
            <span class="mr-2">{expandedPaths.has(file.path) ? '▼' : '▶'}</span>
            <span>{file.name}/</span>
          </div>
          {#if expandedPaths.has(file.path)}
            <FileTree 
              sandboxId={sandboxId} 
              path={file.path}
              on:fileSelect
            />
          {/if}
        {:else}
          <div 
            class="cursor-pointer hover:bg-surface-700 p-1 rounded"
            on:click={() => handleFileClick(file)}
          >
            {file.name}
          </div>
        {/if}
      </div>
    {/each}
  {:else if $filesQuery.error}
    <div class="text-error-400">Error: {$filesQuery.error.message}</div>
  {/if}
</div>

<style>
  .file-tree {
    height: 100%;
    overflow-y: auto;
  }
</style>
