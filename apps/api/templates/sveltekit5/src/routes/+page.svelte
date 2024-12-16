<script lang="ts">
  import { writable } from "svelte/store";

  interface Todo {
    id: number;
    text: string;
    completed: boolean;
  }

  const todos = writable<Todo[]>([]);
  let newTodoText = "";

  function addTodo() {
    if (!newTodoText.trim()) return;

    $todos = [
      ...$todos,
      {
        id: Date.now(),
        text: newTodoText,
        completed: false,
      },
    ];
    newTodoText = "";
  }

  function toggleTodo(id: number) {
    $todos = $todos.map((todo) =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    );
  }

  function deleteTodo(id: number) {
    $todos = $todos.filter((todo) => todo.id !== id);
  }
</script>

<div class="flex flex-col gap-4 p-4 h-full bg-surface-800">
  <h2 class="text-2xl font-bold text-surface-50">Todo List</h2>

  <!-- Add Todo Form -->
  <form class="flex gap-2" on:submit|preventDefault={addTodo}>
    <input
      type="text"
      bind:value={newTodoText}
      placeholder="Add a new todo..."
      class="flex-1 input bg-surface-900 border-surface-700 text-surface-50"
    />
    <button type="submit" class="btn variant-filled">Add</button>
  </form>

  <!-- Todo List -->
  <div class="flex flex-col gap-2">
    {#if $todos.length === 0}
      <p class="py-4 text-center text-surface-400">
        No todos yet. Add one above!
      </p>
    {:else}
      {#each $todos as todo (todo.id)}
        <div
          class="flex gap-2 items-center p-3 rounded-md border transition-colors bg-surface-900 border-surface-700"
        >
          <input
            type="checkbox"
            checked={todo.completed}
            on:change={() => toggleTodo(todo.id)}
            class="checkbox"
          />
          <span
            class="flex-1 {todo.completed
              ? 'line-through text-surface-400'
              : 'text-surface-50'}"
          >
            {todo.text}
          </span>
          <button
            on:click={() => deleteTodo(todo.id)}
            class="btn btn-sm variant-soft-error"
          >
            Delete
          </button>
        </div>
      {/each}
    {/if}
  </div>

  <!-- Stats -->
  {#if $todos.length > 0}
    <div class="flex justify-between mt-4 text-sm text-surface-400">
      <span>Total: {$todos.length}</span>
      <span>Completed: {$todos.filter((t) => t.completed).length}</span>
    </div>
  {/if}
</div>

<style>
  /* Add any custom styles here */
</style>
