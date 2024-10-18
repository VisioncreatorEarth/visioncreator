<script lang="ts">
  import { onMount } from 'svelte';
  import { writable } from 'svelte/store';

  interface Task {
    id: string;
    text: string;
  }

  interface Column {
    id: string;
    title: string;
    tasks: Task[];
  }

  const columns = writable<Column[]>([
    { id: 'todo', title: 'To Do', tasks: [{ id: '1', text: 'Erste Aufgabe' }] },
    { id: 'inprogress', title: 'In Progress', tasks: [] },
    { id: 'done', title: 'Erledigt', tasks: [] },
    // Die "Immer"-Spalte wurde entfernt
  ]);

  let draggedTask: Task | null = null;
  let draggedColumn: string | null = null;

  function handleDragStart(task: Task, columnId: string) {
    draggedTask = task;
    draggedColumn = columnId;
  }

  function handleDragOver(event: DragEvent) {
    event.preventDefault();
  }

  function handleDrop(targetColumnId: string) {
    if (draggedTask && draggedColumn) {
      columns.update(cols => {
        const sourceColumn = cols.find(col => col.id === draggedColumn);
        const targetColumn = cols.find(col => col.id === targetColumnId);

        if (sourceColumn && targetColumn) {
          sourceColumn.tasks = sourceColumn.tasks.filter(task => task.id !== draggedTask!.id);
          targetColumn.tasks = [...targetColumn.tasks, draggedTask!];
        }

        return cols;
      });

      draggedTask = null;
      draggedColumn = null;
    }
  }

  function addTask(columnId: string) {
    const taskText = prompt('Neue Aufgabe eingeben:');
    if (taskText) {
      columns.update(cols => {
        const column = cols.find(col => col.id === columnId);
        if (column) {
          column.tasks = [...column.tasks, { id: Date.now().toString(), text: taskText }];
        }
        return cols;
      });
    }
  }
</script>

<div class="w-full h-full bg-surface-900 text-white p-6 overflow-auto">
  <h1 class="text-3xl font-bold mb-6">Kanban Board</h1>
  
  <div class="flex space-x-4 overflow-x-auto pb-4">
    {#each $columns as column (column.id)}
      <div class="flex-1 bg-surface-800 rounded-lg p-4 min-w-[250px]">
        <h2 class="text-xl font-bold mb-4">{column.title}</h2>
        <div 
          class="min-h-[200px] bg-surface-700 rounded p-2"
          on:dragover={handleDragOver}
          on:drop={() => handleDrop(column.id)}
        >
          {#each column.tasks as task (task.id)}
            <div 
              class="bg-surface-600 rounded p-2 mb-2 cursor-move"
              draggable="true"
              on:dragstart={() => handleDragStart(task, column.id)}
            >
              {task.text}
            </div>
          {/each}
        </div>
        <button 
          class="mt-4 bg-primary-500 hover:bg-primary-600 text-white font-bold py-2 px-4 rounded"
          on:click={() => addTask(column.id)}
        >
          Aufgabe hinzufügen
        </button>
      </div>
    {/each}
  </div>
</div>