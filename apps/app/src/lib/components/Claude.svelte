<script lang="ts">
	import { writable } from 'svelte/store';

	interface Todo {
		id: number;
		text: string;
		completed: boolean;
	}

	const defaultTodos: Todo[] = [
		{ id: 1, text: "Buy groceries", completed: false },
		{ id: 2, text: "Finish work project", completed: false },
		{ id: 3, text: "Go for a run", completed: false },
		{ id: 4, text: "Call mom", completed: false },
		{ id: 5, text: "Read a chapter of a book", completed: false }
	];

	const todos = writable<Todo[]>(defaultTodos);
	let newTodoText = '';

	function addTodo() {
		if (newTodoText.trim()) {
			todos.update((currentTodos) => [
				...currentTodos,
				{
					id: Math.max(0, ...currentTodos.map(todo => todo.id)) + 1,
					text: newTodoText.trim(),
					completed: false
				}
			]);
			newTodoText = '';
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			addTodo();
		}
	}

	function toggleTodo(id: number) {
		todos.update((currentTodos) =>
			currentTodos.map((todo) =>
				todo.id === id ? { ...todo, completed: !todo.completed } : todo
			)
		);
	}

	function removeTodo(id: number) {
		todos.update((currentTodos) => currentTodos.filter((todo) => todo.id !== id));
	}
</script>

<div class="w-full h-full p-4 bg-surface-100-800-token @container">
	<h1 class="mb-4 h1 text-2xl @sm:text-3xl @lg:text-4xl">Simple To-Do List</h1>
	
	<div class="mb-4 flex gap-2">
		<input
			type="text"
			bind:value={newTodoText}
			placeholder="Enter a new task"
			class="input grow"
			on:keydown={handleKeydown}
		/>
		<button on:click={addTodo} class="btn variant-filled-primary">Add Task</button>
	</div>
	
	<ul class="space-y-2">
		{#each $todos as todo (todo.id)}
			<li class="flex items-center gap-2 p-2 card bg-surface-200-700-token">
				<input
					type="checkbox"
					checked={todo.completed}
					on:change={() => toggleTodo(todo.id)}
					class="checkbox"
				/>
				<span class="grow text-sm @lg:text-base" class:line-through={todo.completed}>
					{todo.text}
				</span>
				<button
					on:click={() => removeTodo(todo.id)}
					class="btn btn-sm variant-soft-error"
					aria-label="Remove task"
				>
					×
				</button>
			</li>
		{/each}
	</ul>
</div>