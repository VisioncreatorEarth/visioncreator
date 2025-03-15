<script>
	import { onMount } from 'svelte';

	let revealed = false;
	let headingRevealed = false;
	let needsRevealed = false;

	onMount(() => {
		setTimeout(() => {
			revealed = true;
			setTimeout(() => {
				headingRevealed = true;
				setTimeout(() => {
					needsRevealed = true;
				}, 400);
			}, 400);
		}, 400);
	});
</script>

<div class="slide-content flex h-full flex-col items-center justify-center p-8">
	<div class="mx-auto w-full max-w-5xl">
		<!-- Main heading -->
		<div
			class="mb-10 transform text-center transition-all duration-700 {revealed
				? 'translate-y-0 opacity-100'
				: 'translate-y-12 opacity-0'}"
		>
			<h2 class="mb-4 text-5xl font-bold tracking-tight md:text-6xl">FROM DREAM TO REALITY</h2>
			<p class="mx-auto max-w-3xl text-xl text-gray-300 md:text-2xl">
				How Visioncreator achieves these core human needs
			</p>
		</div>

		<!-- Needs and how to achieve them -->
		<div class="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
			<!-- Belonging -->
			<div
				class="transform rounded-xl border border-slate-700 bg-gradient-to-br from-slate-800 to-slate-900 p-6 shadow-lg transition-all duration-700 {headingRevealed
					? 'translate-y-0 opacity-100'
					: 'translate-y-12 opacity-0'}"
				style="transition-delay: 100ms;"
			>
				<div class="mb-4 flex items-center">
					<div class="mr-4 flex h-10 w-10 items-center justify-center rounded-full bg-blue-500">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-6 w-6 text-white"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
							/>
						</svg>
					</div>
					<h3 class="text-2xl font-bold text-blue-400">Belonging</h3>
				</div>
				<div class="pl-14">
					<p class="mb-2 font-medium text-gray-300">Being part of a group with shared values</p>
					<p class="text-sm text-gray-400">
						Created through collaborative governance and shared ownership where everyone's voice
						matters. Community identity forms around shared goals and mutual support.
					</p>
				</div>
			</div>

			<!-- Autonomy -->
			<div
				class="transform rounded-xl border border-slate-700 bg-gradient-to-br from-slate-800 to-slate-900 p-6 shadow-lg transition-all duration-700 {headingRevealed
					? 'translate-y-0 opacity-100'
					: 'translate-y-12 opacity-0'}"
				style="transition-delay: 200ms;"
			>
				<div class="mb-4 flex items-center">
					<div class="mr-4 flex h-10 w-10 items-center justify-center rounded-full bg-purple-500">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-6 w-6 text-white"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
							/>
						</svg>
					</div>
					<h3 class="text-2xl font-bold text-purple-400">Autonomy</h3>
				</div>
				<div class="pl-14">
					<p class="mb-2 font-medium text-gray-300">Freedom to follow your impulses</p>
					<p class="text-sm text-gray-400">
						Achieved when contribution levels are self-determined and work schedules are flexible.
						Each person decides how to contribute based on their own priorities.
					</p>
				</div>
			</div>

			<!-- Agency -->
			<div
				class="transform rounded-xl border border-slate-700 bg-gradient-to-br from-slate-800 to-slate-900 p-6 shadow-lg transition-all duration-700 {needsRevealed
					? 'translate-y-0 opacity-100'
					: 'translate-y-12 opacity-0'}"
				style="transition-delay: 300ms;"
			>
				<div class="mb-4 flex items-center">
					<div class="mr-4 flex h-10 w-10 items-center justify-center rounded-full bg-amber-500">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-6 w-6 text-white"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M13 10V3L4 14h7v7l9-11h-7z"
							/>
						</svg>
					</div>
					<h3 class="text-2xl font-bold text-amber-400">Agency</h3>
				</div>
				<div class="pl-14">
					<p class="mb-2 font-medium text-gray-300">Having purpose and self-determination</p>
					<p class="text-sm text-gray-400">
						Secured through our proposal system where anyone can initiate projects and influence the
						organization's direction. Your creative vision becomes reality.
					</p>
				</div>
			</div>

			<!-- Financial Security -->
			<div
				class="transform rounded-xl border border-slate-700 bg-gradient-to-br from-slate-800 to-slate-900 p-6 shadow-lg transition-all duration-700 {needsRevealed
					? 'translate-y-0 opacity-100'
					: 'translate-y-12 opacity-0'}"
				style="transition-delay: 400ms;"
			>
				<div class="mb-4 flex items-center">
					<div class="mr-4 flex h-10 w-10 items-center justify-center rounded-full bg-green-500">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-6 w-6 text-white"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
							/>
						</svg>
					</div>
					<h3 class="text-2xl font-bold text-green-400">Financial Security</h3>
				</div>
				<div class="pl-14">
					<p class="mb-2 font-medium text-gray-300">Building sustainable value</p>
					<p class="text-sm text-gray-400">
						Provided through shared ownership and revenue distribution. As the community builds
						valuable products together, all members benefit from collective success.
					</p>
				</div>
			</div>

			<!-- Inner Expression -->
			<div
				class="transform rounded-xl border border-slate-700 bg-gradient-to-br from-slate-800 to-slate-900 p-6 shadow-lg transition-all duration-700 {needsRevealed
					? 'translate-y-0 opacity-100'
					: 'translate-y-12 opacity-0'} mx-auto max-w-2xl md:col-span-2"
				style="transition-delay: 500ms;"
			>
				<div class="mb-4 flex items-center">
					<div class="mr-4 flex h-10 w-10 items-center justify-center rounded-full bg-rose-500">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-6 w-6 text-white"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
							/>
						</svg>
					</div>
					<h3 class="text-2xl font-bold text-rose-400">Inner Expression</h3>
				</div>
				<div class="pl-14">
					<p class="mb-2 font-medium text-gray-300">Aligning values with external work</p>
					<p class="text-sm text-gray-400">
						Thrives when we can choose projects aligned with our values and strengths. Our flexible
						contribution system encourages each member to bring their authentic self to their work.
					</p>
				</div>
			</div>
		</div>
	</div>
</div>

<style>
	/* Add any slide-specific styles here */
</style>
