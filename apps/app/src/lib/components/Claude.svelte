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
		assignee: string;
		priority: 'low' | 'medium' | 'high';
		createdAt: Date;
	}

	const tasks = writable<Task[]>([
		{
			id: 1,
			title: 'Implement user authentication',
			description: 'Create a secure user authentication system with login and registration functionality',
			status: 'todo',
			history: [],
			assignee: 'Unassigned',
			priority: 'high',
			createdAt: new Date('2023-05-01T10:00:00')
		},
		{
			id: 2,
			title: 'Create a responsive navigation menu',
			description: 'Design and implement a responsive navigation menu that works well on all device sizes',
			status: 'todo',
			history: [],
			assignee: 'Unassigned',
			priority: 'medium',
			createdAt: new Date('2023-05-02T14:30:00')
		},
		{
			id: 3,
			title: 'Set up a basic database connection',
			description: 'Establish a connection to the database and create initial schemas',
			status: 'todo',
			history: [],
			assignee: 'Unassigned',
			priority: 'high',
			createdAt: new Date('2023-05-03T09:15:00')
		},
		{
			id: 4,
			title: 'Design and implement a search function',
			description: 'Create a search feature that allows users to find content quickly and efficiently',
			status: 'todo',
			history: [],
			assignee: 'Unassigned',
			priority: 'medium',
			createdAt: new Date('2023-05-04T11:45:00')
		},
		{
			id: 5,
			title: 'Add error handling and logging',
			description: 'Implement comprehensive error handling and set up a logging system for debugging',
			status: 'todo',
			history: [],
			assignee: 'Unassigned',
			priority: 'low',
			createdAt: new Date('2023-05-05T16:20:00')
		}
	]);

	let selectedTaskId: number | null = null;
	let draggedTask: Task | null = null;
	let newTaskTitle = '';
	let newTaskDescription = '';
	let addingTaskTo: 'todo' | 'inProgress' | 'done' | null = null;

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

	function toggleTaskDetails(taskId: number) {
		selectedTaskId = selectedTaskId === taskId ? null : taskId;
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

	function showAddTaskForm(status: 'todo' | 'inProgress' | 'done') {
		addingTaskTo = status;
		newTaskTitle = '';
		newTaskDescription = '';
	}

	function addNewTask() {
		if (newTaskTitle.trim() && addingTaskTo) {
			tasks.update((currentTasks) => [
				...currentTasks,
				{
					id: Math.max(0, ...currentTasks.map((t) => t.id)) + 1,
					title: newTaskTitle.trim(),
					description: newTaskDescription.trim(),
					status: addingTaskTo,
					history: [],
					assignee: 'Unassigned',
					priority: 'medium',
					createdAt: new Date()
				}
			]);
			addingTaskTo = null;
		}
	}

	function cancelAddTask() {
		addingTaskTo = null;
	}

	function getPriorityColor(priority: 'low' | 'medium' | 'high') {
		switch (priority) {
			case 'low':
				return 'bg-success-500';
			case 'medium':
				return 'bg-warning-500';
			case 'high':
				return 'bg-error-500';
		}
	}

	function formatDate(date: Date): string {
		return date.toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}
</script>

<div class="w-full h-full flex flex-col bg-surface-100-800-token @container">
	<h1
		class="p-4 text-center h1 text-2xl @sm:text-3xl @lg:text-4xl @xl:text-5xl sticky top-0 z-10 bg-surface-100-800-token"
	>
		Programming Tasks Kanban Board
	</h1>
	<div class="flex-grow grid grid-cols-1 gap-4 @md:grid-cols-3 p-4 overflow-hidden">
		{#each ['todo', 'inProgress', 'done'] as status}
			<div
				class="flex flex-col h-full overflow-hidden card bg-surface-200-700-token"
				on:dragover={handleDragOver}
				on:drop={(event) => handleDrop(event, status)}
			>
				<div class="p-4 sticky top-0 z-10 bg-surface-200-700-token flex justify-between items-center">
					<h2 class="h3 text-xl @lg:text-2xl @xl:text-3xl">
						{status === 'inProgress'
							? 'In Progress'
							: status.charAt(0).toUpperCase() + status.slice(1)}
					</h2>
					<button
						class="btn btn-sm variant-soft-primary"
						on:click={() => showAddTaskForm(status)}
					>
						+
					</button>
				</div>
				<div class="flex-grow p-4 overflow-y-auto">
					{#each $tasks.filter((task) => task.status === status) as task (task.id)}
						<div
							class="mb-3 cursor-move card bg-surface-300-600-token hover:bg-surface-400-500-token transition-colors duration-200"
							draggable="true"
							on:dragstart={(event) => handleDragStart(event, task)}
						>
							<div class="p-3">
								<h3 class="mb-2 font-semibold text-sm @lg:text-base @xl:text-lg">{task.title}</h3>
								<p class="mb-3 text-xs @lg:text-sm @xl:text-base">{task.description}</p>
								<div class="flex flex-wrap gap-2 mb-3">
									<span
										class="badge variant-filled {getPriorityColor(task.priority)} text-xs @lg:text-sm"
									>
										{task.priority}
									</span>
									<span class="badge variant-soft text-xs @lg:text-sm">{task.assignee}</span>
								</div>
								<div class="flex justify-between items-center text-xs @lg:text-sm">
									<span class="text-surface-600-300-token">{formatDate(task.createdAt)}</span>
									<button
										class="btn btn-sm variant-soft-secondary"
										on:click={() => toggleTaskDetails(task.id)}
									>
										{selectedTaskId === task.id ? 'Hide Details' : 'Show Details'}
									</button>
								</div>
							</div>
							{#if selectedTaskId === task.id}
								<div class="p-3 border-t border-surface-500-400-token">
									<h4 class="mb-2 font-semibold text-sm @lg:text-base">Task Details</h4>
									<p class="mb-2 text-xs @lg:text-sm">
										<strong>Assignee:</strong>
										{task.assignee}
									</p>
									<p class="mb-2 text-xs @lg:text-sm">
										<strong>Priority:</strong>
										{task.priority}
									</p>
									<h5 class="mt-4 mb-2 font-semibold text-sm @lg:text-base">Travel History</h5>
									{#if task.history.length === 0}
										<p class="text-xs @lg:text-sm">No travel history available.</p>
									{:else}
										<ul class="space-y-1">
											{#each task.history as move}
												<li class="text-xs @lg:text-sm">
													<span class="font-semibold">{move.from}</span> →
													<span class="font-semibold">{move.to}</span> on
													<span class="italic">{formatDate(move.timestamp)}</span>
												</li>
											{/each}
										</ul>
									{/if}
								</div>
							{/if}
						</div>
					{/each}
				</div>
			</div>
		{/each}
	</div>
</div>