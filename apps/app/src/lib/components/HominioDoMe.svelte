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
		{
			id: 1,
			title: 'Implement user authentication',
			description: 'Set up JWT-based authentication system for the web app',
			status: 'todo',
			history: []
		},
		{
			id: 2,
			title: 'Design new landing page',
			description: 'Create a modern and responsive design for the company website',
			status: 'inProgress',
			history: [{ from: 'todo', to: 'inProgress', timestamp: new Date('2023-05-01') }]
		},
		{
			id: 3,
			title: 'Optimize database queries',
			description: 'Improve performance of slow-running queries in the backend',
			status: 'done',
			history: [
				{ from: 'todo', to: 'inProgress', timestamp: new Date('2023-05-02') },
				{ from: 'inProgress', to: 'done', timestamp: new Date('2023-05-03') }
			]
		},
		// ... (other tasks remain the same)
	]);

	let selectedTask: Task | null = null;
	let draggedTask: Task | null = null;

	function moveTask(taskId: number, newStatus: 'todo' | 'inProgress' | 'done') {
		tasks.update((currentTasks) =>
			currentTasks.map((task) => {
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

<div class="w-full h-full flex flex-col bg-surface-100-800-token @container">
	{#if selectedTask}
		<div class="w-full h-full flex flex-col p-4 bg-surface-100-800-token">
			<div class="flex items-center mb-4">
				<button class="btn variant-filled-primary mr-4" on:click={closeTaskHistory}>
					← Back to Kanban Board
				</button>
				<h1 class="h1 text-2xl @sm:text-3xl @lg:text-4xl @xl:text-5xl">{selectedTask.title}</h1>
			</div>
			<div class="card bg-surface-200-700-token p-6 flex-grow overflow-y-auto">
				<h2 class="h2 text-xl @lg:text-2xl @xl:text-3xl mb-4">Task Details</h2>
				<p class="text-sm @lg:text-base @xl:text-lg mb-4">{selectedTask.description}</p>
				<h3 class="h3 text-lg @lg:text-xl @xl:text-2xl mb-2">Current Status</h3>
				<p class="text-sm @lg:text-base @xl:text-lg mb-4 font-semibold">
					{selectedTask.status.charAt(0).toUpperCase() + selectedTask.status.slice(1)}
				</p>
				<h3 class="h3 text-lg @lg:text-xl @xl:text-2xl mb-2">Travel History</h3>
				{#if selectedTask.history.length === 0}
					<p class="text-sm @lg:text-base @xl:text-lg">No travel history available.</p>
				{:else}
					<ul class="space-y-2">
						{#each selectedTask.history as move}
							<li class="text-xs @lg:text-sm @xl:text-base">
								<span class="font-semibold">{move.from}</span> →
								<span class="font-semibold">{move.to}</span> on
								<span class="italic">{move.timestamp.toLocaleString()}</span>
							</li>
						{/each}
					</ul>
				{/if}
			</div>
		</div>
	{:else}
		<h1
			class="p-4 text-center h1 text-2xl @sm:text-3xl @lg:text-4xl @xl:text-5xl sticky top-0 z-10 bg-surface-100-800-token"
		>
			Kanban Board
		</h1>
		<div class="flex-grow grid grid-cols-1 gap-4 @md:grid-cols-3 p-4 overflow-hidden">
			{#each ['todo', 'inProgress', 'done'] as status}
				<div
					class="flex flex-col h-full card bg-surface-200-700-token overflow-hidden"
					on:dragover={handleDragOver}
					on:drop={(event) => handleDrop(event, status)}
				>
					<h2
						class="p-4 text-center h3 text-xl @lg:text-2xl @xl:text-3xl sticky top-0 z-10 bg-surface-200-700-token"
					>
						{status === 'inProgress'
							? 'In Progress'
							: status.charAt(0).toUpperCase() + status.slice(1)}
					</h2>
					<div class="flex-grow overflow-y-auto p-4">
						{#each $tasks.filter((task) => task.status === status) as task (task.id)}
							<div
								class="p-3 mb-3 cursor-move card bg-surface-300-600-token"
								draggable="true"
								on:dragstart={(event) => handleDragStart(event, task)}
							>
								<h3 class="mb-1 font-semibold text-sm @lg:text-base @xl:text-lg">{task.title}</h3>
								<p class="mb-2 text-xs @lg:text-sm @xl:text-base">{task.description}</p>
								<div class="flex justify-end">
									<button
										class="btn btn-sm variant-soft-secondary text-xs @lg:text-sm"
										on:click={() => showTaskHistory(task)}
									>
										View Details
									</button>
								</div>
							</div>
						{/each}
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>