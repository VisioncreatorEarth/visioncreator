<script lang="ts">
  import { onMount } from 'svelte';
  import Presentation from '$lib/components/Presentation.svelte';
  import SlideControls from '$lib/components/SlideControls.svelte';
  
  // Import all slides
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
  
  // Keyboard navigation
  onMount(() => {
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  });
  
  let currentSlideIndex = 0;
  
  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'ArrowRight' || event.key === ' ' || event.key === 'Enter') {
      nextSlide();
    } else if (event.key === 'ArrowLeft') {
      prevSlide();
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
</script>

<svelte:head>
  <title>VisionCreator | Presentation</title>
</svelte:head>

<div class="h-screen w-screen overflow-hidden bg-slate-900 text-white">
  <Presentation slides={slides} currentSlide={currentSlideIndex} />
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