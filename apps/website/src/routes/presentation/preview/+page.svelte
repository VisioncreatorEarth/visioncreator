<script lang="ts">
	import { goto } from '$app/navigation';

	// Import slides for Presentation 2.0 - same as main presentation file
	import OutdatedWork from '$lib/slides/OutdatedWork.svelte';
	import RootCauses from '$lib/slides/RootCauses.svelte';
	import WhyThisMatters from '$lib/slides/WhyThisMatters.svelte';
	import CoreHumanNeeds from '$lib/slides/CoreHumanNeeds.svelte';
	import AchievingCoreNeeds from '$lib/slides/AchievingCoreNeeds.svelte';
	import IntegratedOrganization from '$lib/slides/IntegratedOrganization.svelte';
	import IntroducingVisioncreator from '$lib/slides/IntroducingVisioncreator.svelte';
	import OrganizationalPrinciples from '$lib/slides/OrganizationalPrinciples.svelte';
	import DAOConcept from '$lib/slides/DAOConcept.svelte';
	import VisioncreatorImplementation from '$lib/slides/VisioncreatorImplementation.svelte';
	import CallToAction from '$lib/slides/CallToAction.svelte';

	// Define slide type
	type Slide = {
		component: any;
		title: string;
		part?: number; // Optional part indicator (1 or 2)
	};

	// Define slides matching the main presentation
	const slides: Slide[] = [
		{
			component: OutdatedWork,
			title: 'Your Story Begins',
			part: 1
		},
		{
			component: RootCauses,
			title: 'The Dilemma',
			part: 1
		},
		{
			component: WhyThisMatters,
			title: 'Quality of Life',
			part: 1
		},
		{
			component: CoreHumanNeeds,
			title: 'Core Human Needs',
			part: 1
		},
		{
			component: AchievingCoreNeeds,
			title: 'From Dream to Reality',
			part: 1
		},
		{
			component: IntegratedOrganization,
			title: 'A Better Way',
			part: 1
		},
		{
			component: IntroducingVisioncreator,
			title: 'Introducing Visioncreator',
			part: 1
		},
		{
			component: OrganizationalPrinciples,
			title: 'The Structure',
			part: 1
		},
		{
			component: DAOConcept,
			title: 'The DAO Concept',
			part: 1
		},
		{
			component: VisioncreatorImplementation,
			title: 'Real-World Implementation',
			part: 1
		},
		{
			component: CallToAction,
			title: 'Join Us',
			part: 1
		}
	];

	function goToPresentation(index: number) {
		goto(`/presentation?slide=${index}`);
	}

	function startPresentation() {
		goto('/presentation');
	}
</script>

<svelte:head>
	<title>Visioncreator | Presentation Preview</title>
</svelte:head>

<div class="min-h-screen bg-slate-900 p-8 text-white">
	<div class="mx-auto max-w-6xl">
		<h1 class="mb-2 text-3xl font-bold text-yellow-400">Visioncreator Presentation</h1>
		<p class="mb-8 text-gray-300">
			Select a slide to start from that point, or click "Start from Beginning" to view the full
			presentation.
		</p>

		<div class="mb-6 flex justify-end">
			<button
				class="rounded-md bg-yellow-500 px-6 py-2 font-medium text-black transition duration-200 hover:bg-yellow-600"
				on:click={startPresentation}
			>
				Start from Beginning
			</button>
		</div>

		<div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
			{#each slides as slide, index}
				<div
					class="cursor-pointer overflow-hidden rounded-lg border border-gray-700 bg-slate-800 shadow-lg transition-all hover:border-yellow-500 hover:shadow-xl"
					on:click={() => goToPresentation(index)}
					on:keydown={(e) => e.code === 'Enter' && goToPresentation(index)}
					role="button"
					tabindex="0"
					aria-label={`View slide: ${slide.title}`}
				>
					<div class="p-4">
						<span class="mb-2 inline-block rounded bg-yellow-500 px-2 py-1 text-xs text-black"
							>{index + 1}</span
						>
						<h3 class="mb-2 text-xl font-semibold">{slide.title}</h3>
						<div class="flex h-40 items-center justify-center rounded bg-gray-800 p-2">
							<div class="flex h-full w-full items-center justify-center text-sm text-gray-400">
								Click to view this slide
							</div>
						</div>
					</div>
				</div>
			{/each}
		</div>
	</div>
</div>

<style>
	:global(body) {
		margin: 0;
		padding: 0;
	}
</style>
