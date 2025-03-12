<script lang="ts">
  import { onMount } from 'svelte';
  import SlideThumbnail from '$lib/components/SlideThumbnail.svelte';
  
  // Import new slides for Presentation 2.0
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
  import HominioAITool from '$lib/slides/HominioAITool.svelte';
  import ProductDetails1 from '$lib/slides/ProductDetails1.svelte';
  import ProductDetails2 from '$lib/slides/ProductDetails2.svelte';
  import ProductDetails3 from '$lib/slides/ProductDetails3.svelte';
  
  // Define slide type
  type Slide = {
    component: any;
    title: string;
    part?: number;  // Optional part indicator (1 or 2)
  };
  
  // Define all slides in the presentation
  const slides: Slide[] = [
    {
      component: OutdatedWork,
      title: 'The Outdated Nature of Work',
      part: 1
    },
    {
      component: RootCauses,
      title: 'Root Causes',
      part: 1
    },
    {
      component: WhyThisMatters,
      title: 'Why This Matters',
      part: 1
    },
    {
      component: CoreHumanNeeds,
      title: 'Core Human Needs',
      part: 1
    },
    {
      component: AchievingCoreNeeds,
      title: 'Achieving Core Needs',
      part: 1
    },
    {
      component: IntegratedOrganization,
      title: 'Integrated Organization',
      part: 1
    },
    {
      component: IntroducingVisioncreator,
      title: 'Introducing Visioncreator',
      part: 1
    },
    {
      component: OrganizationalPrinciples,
      title: 'Organizational Principles',
      part: 1
    },
    {
      component: DAOConcept,
      title: 'The DAO Concept',
      part: 1
    },
    {
      component: VisioncreatorImplementation,
      title: 'Visioncreator Implementation Details',
      part: 1
    },
    {
      component: HominioAITool,
      title: 'Hominio AI Tool Introduction',
      part: 2
    },
    {
      component: ProductDetails1,
      title: 'Product Details 1',
      part: 2
    },
    {
      component: ProductDetails2,
      title: 'Product Details 2',
      part: 2
    },
    {
      component: ProductDetails3,
      title: 'Product Details 3',
      part: 2
    }
  ];
  
  // Group slides by part
  const part1Slides = slides.filter(slide => slide.part === 1);
  const part2Slides = slides.filter(slide => slide.part === 2);
  
  function goToPresentation(index: number) {
    window.location.href = `/presentation?slide=${index}`;
  }
  
  function startPresentation() {
    window.location.href = '/presentation';
  }
</script>

<svelte:head>
  <title>Visioncreator | Presentation 2.0 Preview</title>
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
          Presentation 2.0 Preview
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
    
    <!-- Part 1 -->
    <div class="mb-10">
      <h2 class="text-2xl font-bold text-indigo-400 mb-6">PART I - THE VISION</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {#each part1Slides as slide, i}
          {@const slideIndex = slides.findIndex(s => s === slide)}
          <div 
            class="cursor-pointer transition-all hover:scale-105"
            on:click={() => goToPresentation(slideIndex)}
            on:keypress={(e) => e.key === 'Enter' && goToPresentation(slideIndex)}
            tabindex="0" 
            role="button"
            aria-label={`Go to slide ${slideIndex + 1}: ${slide.title}`}
          >
            <SlideThumbnail title={slide.title} index={slideIndex} />
          </div>
        {/each}
      </div>
    </div>
    
    <!-- Part 2 -->
    <div>
      <h2 class="text-2xl font-bold text-teal-400 mb-6">PART II - OUR FIRST STARTUP/PRODUCT</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {#each part2Slides as slide, i}
          {@const slideIndex = slides.findIndex(s => s === slide)}
          <div 
            class="cursor-pointer transition-all hover:scale-105"
            on:click={() => goToPresentation(slideIndex)}
            on:keypress={(e) => e.key === 'Enter' && goToPresentation(slideIndex)}
            tabindex="0" 
            role="button"
            aria-label={`Go to slide ${slideIndex + 1}: ${slide.title}`}
          >
            <SlideThumbnail title={slide.title} index={slideIndex} />
          </div>
        {/each}
      </div>
    </div>
  </div>
</div>

<style>
  :global(body) {
    margin: 0;
    padding: 0;
  }
</style> 