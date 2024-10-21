<script lang="ts">
  import { writable } from 'svelte/store';

  interface TaskMove {
    from: 'todo' | 'inProgress' | 'done';
    to: 'todo' | 'inProgress' | 'done';
    timestamp: Date;
  }

  interface Task {
    id: number;
    title: string;
    description: string;
    status: 'todo' | 'inProgress' | 'done';
    history: TaskMove[];
  }

  const tasks = writable<Task[]>([
    { id: 1, title: 'Implement user authentication', description: 'Set up JWT-based authentication system for the web app', status: 'todo', history: [] },
    { id: 2, title: 'Design new landing page', description: 'Create a modern and responsive design for the company website', status: 'inProgress', history: [{ from: 'todo', to: 'inProgress', timestamp: new Date('2023-05-01') }] },
    { id: 3, title: 'Optimize database queries', description: 'Improve performance of slow-running queries in the backend', status: 'done', history: [{ from: 'todo', to: 'inProgress', timestamp: new Date('2023-05-02') }, { from: 'inProgress', to: 'done', timestamp: new Date('2023-05-03') }] },
    { id: 4, title: 'Write API documentation', description: 'Create comprehensive documentation for the RESTful API endpoints', status: 'todo', history: [] },
    { id: 5, title: 'Implement file upload feature', description: 'Add functionality for users to upload and manage files in the app', status: 'inProgress', history: [{ from: 'todo', to: 'inProgress', timestamp: new Date('2023-05-04') }] },
    { id: 6, title: 'Fix cross-browser compatibility issues', description: 'Address UI inconsistencies across different web browsers', status: 'todo', history: [] },
    { id: 7, title: 'Implement email notification system', description: 'Set up automated email notifications for user actions and updates', status: 'inProgress', history: [{ from: 'todo', to: 'inProgress', timestamp: new Date('2023-05-05') }] },
    { id: 8, title: 'Conduct security audit', description: 'Perform a thorough security review of the application and infrastructure', status: 'todo', history: [] },
    { id: 9, title: 'Refactor legacy code', description: 'Update and modernize outdated codebase to improve maintainability', status: 'inProgress', history: [{ from: 'todo', to: 'inProgress', timestamp: new Date('2023-05-06') }] },
    { id: 10, title: 'Implement data analytics dashboard', description: 'Create a dashboard to visualize key metrics and user behavior', status: 'done', history: [{ from: 'todo', to: 'inProgress', timestamp: new Date('2023-05-07') }, { from: 'inProgress', to: 'done', timestamp: new Date('2023-05-08') }] },
  ]);

  let selectedTask: Task | null = null;
  let draggedTask: Task | null = null;

  function moveTask(taskId: number, newStatus: 'todo' | 'inProgress' | 'done') {
    tasks.update(currentTasks => 
      currentTasks.map(task => {
        if (task.id === taskId && task.status !== newStatus) {
          const move: TaskMove = {
            from: task.status,
            to: newStatus,
            timestamp: new Date()
          };
          return { 
            ...task, 
            status: newStatus, 
            history: [...task.history, move]
          };
        }
        return task;
      })
    );
  }

  function showTaskHistory(task: Task) {
    selectedTask = task;
  }

  function closeTaskHistory() {
    selectedTask = null;
  }

  function handleDragStart(event: DragEvent, task: Task) {
    if (event.dataTransfer) {
      event.dataTransfer.setData('text/plain', task.id.toString());
      event.dataTransfer.effectAllowed = 'move';
    }
    draggedTask = task;
  }

  function handleDragOver(event: DragEvent) {
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
  }

  function handleDrop(event: DragEvent, newStatus: 'todo' | 'inProgress' | 'done') {
    event.preventDefault();
    const taskId = event.dataTransfer?.getData('text/plain');
    if (taskId && draggedTask) {
      moveTask(parseInt(taskId), newStatus);
    }
    draggedTask = null;
  }
</script>

<div class="w-full h-full p-4 bg-surface-100-800-token @container">
  <h1 class="mb-6 text-center h1 text-2xl @sm:text-3xl @lg:text-4xl @xl:text-5xl">Kanban Board</h1>
  <div class="grid grid-cols-1 gap-4 @md:grid-cols-3">
    {#each ['todo', 'inProgress', 'done'] as status}
      <div 
        class="p-4 card bg-surface-200-700-token"
        on:dragover={handleDragOver}
        on:drop={(event) => handleDrop(event, status)}
      >
        <h2 class="mb-4 text-center h3 text-xl @lg:text-2xl @xl:text-3xl">
          {status === 'inProgress' ? 'In Progress' : status.charAt(0).toUpperCase() + status.slice(1)}
        </h2>
        {#each $tasks.filter(task => task.status === status) as task (task.id)}
          <div 
            class="p-3 mb-3 cursor-move card bg-surface-300-600-token"
            draggable="true"
            on:dragstart={(event) => handleDragStart(event, task)}
          >
            <h3 class="mb-1 font-semibold text-sm @lg:text-base @xl:text-lg">{task.title}</h3>
            <p class="mb-2 text-xs @lg:text-sm @xl:text-base">{task.description}</p>
            <div class="flex justify-end">
              <button class="btn btn-sm variant-soft-secondary text-xs @lg:text-sm" on:click={() => showTaskHistory(task)}>
                View History
              </button>
            </div>
          </div>
        {/each}
      </div>
    {/each}
  </div>

  {#if selectedTask}
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-surface-900-800-token bg-opacity-50">
      <div class="p-6 card bg-surface-100-800-token">
        <h2 class="mb-4 h2 text-xl @lg:text-2xl @xl:text-3xl">{selectedTask.title} - Travel History</h2>
        {#if selectedTask.history.length === 0}
          <p class="text-sm @lg:text-base @xl:text-lg">No travel history available.</p>
        {:else}
          <ul class="mb-4 space-y-2">
            {#each selectedTask.history as move}
              <li class="text-xs @lg:text-sm @xl:text-base">
                <span class="font-semibold">{move.from}</span> → 
                <span class="font-semibold">{move.to}</span> on 
                <span class="italic">{move.timestamp.toLocaleString()}</span>
              </li>
            {/each}
          </ul>
        {/if}
        <button class="btn variant-filled-primary" on:click={closeTaskHistory}>Close</button>
      </div>
    </div>
  {/if}
</div>