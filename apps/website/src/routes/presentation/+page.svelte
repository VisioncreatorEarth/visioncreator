<script lang="ts">
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import Presentation from '$lib/components/Presentation.svelte';
  import SlideControls from '$lib/components/SlideControls.svelte';
  
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
  
  let currentSlideIndex = 0;
  
  // Check for URL parameters
  onMount(() => {
    if (browser) {
      const urlParams = new URLSearchParams(window.location.search);
      const slideParam = urlParams.get('slide');
      
      if (slideParam !== null) {
        const slideIndex = parseInt(slideParam, 10);
        if (!isNaN(slideIndex) && slideIndex >= 0 && slideIndex < slides.length) {
          currentSlideIndex = slideIndex;
        }
      }
    }
    
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  });
  
  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'ArrowRight' || event.key === ' ' || event.key === 'Enter') {
      nextSlide();
    } else if (event.key === 'ArrowLeft') {
      prevSlide();
    } else if (event.key === 'Escape') {
      goToPreview();
    }
  }
  
  function nextSlide() {
    if (currentSlideIndex < slides.length - 1) {
      currentSlideIndex++;
    }
  }
  
  function prevSlide() {
    if (currentSlideIndex > 0) {
      currentSlideIndex--;
    }
  }
  
  function goToSlide(index: number) {
    currentSlideIndex = index;
  }
  
  function goToPreview() {
    window.location.href = '/presentation/preview';
  }
</script>

<svelte:head>
  <title>Visioncreator | Presentation 2.0</title>
</svelte:head>

<div class="h-screen w-screen overflow-hidden bg-slate-900 text-white">
  <Presentation slides={slides} currentSlide={currentSlideIndex} />
  
  <!-- Part indicator -->
  <div class="absolute top-4 left-4 z-50 px-3 py-1 rounded-full bg-slate-800/50 backdrop-blur-sm text-sm font-medium">
    {#if slides[currentSlideIndex]?.part === 1}
      <span class="text-indigo-400">PART I: THE VISION</span>
    {:else if slides[currentSlideIndex]?.part === 2}
      <span class="text-teal-400">PART II: OUR FIRST STARTUP/PRODUCT</span>
    {/if}
  </div>
  
  <div class="absolute top-4 right-4 z-50">
    <button 
      class="px-4 py-2 bg-slate-800/50 backdrop-blur-sm hover:bg-slate-800 text-slate-300 hover:text-white rounded-md transition-colors"
      on:click={goToPreview}
    >
      Exit to Preview
    </button>
  </div>
  
  <SlideControls 
    currentSlide={currentSlideIndex + 1} 
    totalSlides={slides.length} 
    onNext={nextSlide} 
    onPrev={prevSlide}
    onGoToSlide={goToSlide}
  />
</div>

<style>
  :global(body) {
    margin: 0;
    padding: 0;
    overflow: hidden;
  }
</style> 