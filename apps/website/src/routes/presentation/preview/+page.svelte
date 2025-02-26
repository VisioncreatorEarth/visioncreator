<script lang="ts">
  import { onMount } from 'svelte';
  import SlideThumbnail from '$lib/components/SlideThumbnail.svelte';
  
  // Import all slides - same as in presentation
  import HelloEarth from '$lib/slides/HelloEarth.svelte';
  import HumanQuestion from '$lib/slides/HumanQuestion.svelte';
  import AutonomyAnswer from '$lib/slides/AutonomyAnswer.svelte';
  import AutonomyCrisis from '$lib/slides/AutonomyCrisis.svelte';
  import TrueAutonomy from '$lib/slides/TrueAutonomy.svelte';
  import FalseBinary from '$lib/slides/FalseBinary.svelte';
  import FreedomDimensions from '$lib/slides/FreedomDimensions.svelte';
  import NewParadigm from '$lib/slides/NewParadigm.svelte';
  import AutonomousLife from '$lib/slides/AutonomousLife.svelte';
  import Interdependence from '$lib/slides/Interdependence.svelte';
  import PathToFreedom from '$lib/slides/PathToFreedom.svelte';
  import ReclaimWork from '$lib/slides/ReclaimWork.svelte';
  
  // Define slide type
  type Slide = {
    component: any;
    title: string;
  };
  
  // Define all slides in the presentation
  const slides: Slide[] = [
    {
      component: HelloEarth,
      title: 'Freedom to Create, Right to Own'
    },
    {
      component: HumanQuestion,
      title: 'The Human Question'
    },
    {
      component: AutonomyAnswer,
      title: 'Autonomy'
    },
    {
      component: AutonomyCrisis,
      title: 'The Autonomy Crisis'
    },
    {
      component: TrueAutonomy,
      title: 'True Autonomy Unleashed'
    },
    {
      component: FalseBinary,
      title: 'Beyond the False Binary'
    },
    {
      component: FreedomDimensions,
      title: 'Freedom in Multiple Dimensions'
    },
    {
      component: NewParadigm,
      title: 'The New Work Paradigm'
    },
    {
      component: AutonomousLife,
      title: 'Living the Autonomous Life'
    },
    {
      component: Interdependence,
      title: 'From Dependence to Interdependence'
    },
    {
      component: PathToFreedom,
      title: 'Your Path to Freedom'
    },
    {
      component: ReclaimWork,
      title: 'Reclaim Your Work, Reclaim Your Life'
    }
  ];
  
  function goToPresentation(index: number) {
    window.location.href = `/presentation?slide=${index}`;
  }
  
  function startPresentation() {
    window.location.href = '/presentation';
  }
</script>

<svelte:head>
  <title>VisionCreator | Presentation Preview</title>
</svelte:head>

<div class="min-h-screen bg-slate-900 text-white">
  <div class="absolute inset-0 -z-10">
    <div class="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-l from-purple-900/10 to-transparent rounded-full blur-3xl opacity-30"></div>
    <div class="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-r from-cyan-900/10 to-transparent rounded-full blur-3xl opacity-20"></div>
  </div>
  
  <div class="container mx-auto py-8 px-4">
    <div class="flex items-center justify-between mb-10">
      <div>
        <h1 class="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
          Presentation Preview
        </h1>
        <p class="text-slate-400 mt-2">Click on any slide to start the presentation from that point</p>
      </div>
      
      <button 
        class="px-5 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-md text-white font-medium shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 transition-all hover:scale-105"
        on:click={startPresentation}
      >
        Start Presentation
      </button>
    </div>
    
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {#each slides as slide, index}
        <div 
          class="cursor-pointer"
          on:click={() => goToPresentation(index)}
          on:keypress={(e) => e.key === 'Enter' && goToPresentation(index)}
          tabindex="0" 
          role="button"
          aria-label={`Go to slide ${index + 1}: ${slide.title}`}
        >
          <SlideThumbnail title={slide.title} index={index} />
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