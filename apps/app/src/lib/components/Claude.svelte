<script lang="ts">
  import { writable } from 'svelte/store';
  import { Icon } from '@iconify/svelte';

  interface Todo {
    id: number;
    text: string;
    status: 'todo' | 'inProgress' | 'done';
  }

  const todos = writable<Todo[]>([]);
  let newTodo = '';

  function addTodo() {
    if (newTodo.trim()) {
      todos.update(currentTodos => [
        ...currentTodos,
        { id: Date.now(), text: newTodo.trim(), status: 'todo' }
      ]);
      newTodo = '';
    }
  }

  function moveTodo(id: number, newStatus: 'todo' | 'inProgress' | 'done') {
    todos.update(currentTodos =>
      currentTodos.map(todo =>
        todo.id === id ? { ...todo, status: newStatus } : todo
      )
    );
  }

  function removeTodo(id: number) {
    todos.update(currentTodos => currentTodos.filter(todo => todo.id !== id));
  }

  $: todoList = $todos.filter(todo => todo.status === 'todo');
  $: inProgressList = $todos.filter(todo => todo.status === 'inProgress');
  $: doneList = $todos.filter(todo => todo.status === 'done');
</script>

<div class="w-full h-full bg-surface-900 text-white p-4">
  <h1 class="text-2xl font-bold mb-4">Kanban Board Todo App</h1>
  
  <div class="mb-4">
    <input
      type="text"
      bind:value={newTodo}
      placeholder="Enter a new task"
      class="w-full p-2 rounded bg-surface-700 text-white"
      on:keypress={(e) => e.key === 'Enter' && addTodo()}
    />
    <button
      on:click={addTodo}
      class="mt-2 px-4 py-2 bg-primary-500 text-white rounded hover:bg-primary-600"
    >
      Add Task
    </button>
  </div>
  
  <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
    {#each [
      { title: 'To Do', list: todoList, color: 'bg-red-600' },
      { title: 'In Progress', list: inProgressList, color: 'bg-yellow-600' },
      { title: 'Done', list: doneList, color: 'bg-green-600' }
    ] as column}
      <div class="bg-surface-800 p-4 rounded">
        <h2 class="text-xl font-bold mb-2 {column.color} p-2 rounded">{column.title}</h2>
        <ul class="space-y-2">
          {#each column.list as todo (todo.id)}
            <li class="bg-surface-700 p-2 rounded flex items-center justify-between">
              <span>{todo.text}</span>
              <div>
                {#if todo.status !== 'todo'}
                  <button
                    on:click={() => moveTodo(todo.id, 'todo')}
                    class="text-blue-400 hover:text-blue-300 mr-2"
                    title="Move to To Do"
                  >
                    <Icon icon="mdi:arrow-left" />
                  </button>
                {/if}
                {#if todo.status !== 'inProgress'}
                  <button
                    on:click={() => moveTodo(todo.id, 'inProgress')}
                    class="text-yellow-400 hover:text-yellow-300 mr-2"
                    title="Move to In Progress"
                  >
                    <Icon icon="mdi:arrow-right" />
                  </button>
                {/if}
                {#if todo.status !== 'done'}
                  <button
                    on:click={() => moveTodo(todo.id, 'done')}
                    class="text-green-400 hover:text-green-300 mr-2"
                    title="Move to Done"
                  >
                    <Icon icon="mdi:check" />
                  </button>
                {/if}
                <button
                  on:click={() => removeTodo(todo.id)}
                  class="text-red-400 hover:text-red-300"
                  title="Remove Task"
                >
                  <Icon icon="mdi:close" />
                </button>
              </div>
            </li>
          {/each}
        </ul>
      </div>
    {/each}
  </div>
</div>