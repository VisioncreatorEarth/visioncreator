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
    part?: number;  // Optional part indicator (1 or 2)
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

<div class="min-h-screen bg-slate-900 text-white p-8">
  <div class="max-w-6xl mx-auto">
    <h1 class="text-3xl font-bold mb-2 text-yellow-400">Visioncreator Presentation</h1>
    <p class="mb-8 text-gray-300">Select a slide to start from that point, or click "Start from Beginning" to view the full presentation.</p>
    
    <div class="flex justify-end mb-6">
      <button 
        class="bg-yellow-500 hover:bg-yellow-600 text-black font-medium py-2 px-6 rounded-md transition duration-200"
        on:click={startPresentation}
      >
        Start from Beginning
      </button>
    </div>
    
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {#each slides as slide, index}
        <div 
          class="bg-slate-800 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-all cursor-pointer border border-gray-700 hover:border-yellow-500"
          on:click={() => goToPresentation(index)}
          on:keydown={(e) => e.code === 'Enter' && goToPresentation(index)}
          role="button"
          tabindex="0"
          aria-label={`View slide: ${slide.title}`}
        >
          <div class="p-4">
            <span class="inline-block bg-yellow-500 text-black text-xs px-2 py-1 rounded mb-2">{index + 1}</span>
            <h3 class="text-xl font-semibold mb-2">{slide.title}</h3>
            <div class="h-40 flex items-center justify-center bg-gray-800 rounded p-2">
              <div class="w-full h-full flex items-center justify-center text-sm text-gray-400">
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