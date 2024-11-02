<script lang="ts">
  import { onMount } from "svelte";

  interface Todo {
    id: number;
    task: string;
    done: boolean;
  }

  let todos: Todo[] = [];
  let newTodo = "";

  onMount(async () => {
    await loadTodos();
  });

  async function loadTodos() {
    const response = await fetch("/api/todos");
    todos = await response.json();
  }

  async function addTodo() {
    if (newTodo.trim()) {
      await fetch("/api/todos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task: newTodo }),
      });
      newTodo = "";
      await loadTodos();
    }
  }

  async function toggleTodo(id: number, done: boolean) {
    await fetch("/api/todos", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, done: !done }),
    });
    await loadTodos();
  }

  async function deleteTodo(id: number) {
    await fetch("/api/todos", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    await loadTodos();
  }
</script>

<div class="container mx-auto p-4 max-w-2xl">
  <h1 class="text-3xl font-bold mb-6">Todo App</h1>

  <form on:submit|preventDefault={addTodo} class="mb-6">
    <div class="input-group input-group-divider grid-cols-[1fr_auto]">
      <input
        bind:value={newTodo}
        placeholder="Enter a new todo"
        class="input"
      />
      <button type="submit" class="btn variant-filled-primary">Add Todo</button>
    </div>
  </form>

  <ul class="space-y-2">
    {#each todos as todo (todo.id)}
      <li class="card p-4 flex items-center justify-between">
        <div class="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={todo.done}
            on:change={() => toggleTodo(todo.id, todo.done)}
            class="checkbox"
          />
          <span class={todo.done ? "line-through" : ""}>{todo.task}</span>
        </div>
        <button
          on:click={() => deleteTodo(todo.id)}
          class="btn btn-sm variant-filled-error"
        >
          Delete
        </button>
      </li>
    {/each}
  </ul>
</div>
