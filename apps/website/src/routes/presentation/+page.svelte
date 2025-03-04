<script lang="ts">
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import Presentation from '$lib/components/Presentation.svelte';
  import SlideControls from '$lib/components/SlideControls.svelte';
  
  // Import all slides
  import HelloEarth from '$lib/slides/HelloEarth.svelte';
  import HumanQuestion from '$lib/slides/HumanQuestion.svelte';
  import PersonalStrivings from '$lib/slides/PersonalStrivings.svelte';
  import AutonomyAnswer from '$lib/slides/AutonomyAnswer.svelte';
  import WorkChoices from '$lib/slides/WorkChoices.svelte';
  import EmployeeChoice from '$lib/slides/EmployeeChoice.svelte';
  import FounderChoice from '$lib/slides/FounderChoice.svelte';
  import BetterSolution from '$lib/slides/BetterSolution.svelte';
  import FreedomDimensions from '$lib/slides/FreedomDimensions.svelte';
  import DAOIntro from '$lib/slides/DAOIntro.svelte';
  import DAOExplained from '$lib/slides/DAOExplained.svelte';
  import DAOExamples from '$lib/slides/DAOExamples.svelte';
  import TokenSystem from '$lib/slides/TokenSystem.svelte';
  import VisionCreatorPool from '$lib/slides/VisionCreatorPool.svelte';
  import MoneyFlows from '$lib/slides/MoneyFlows.svelte';
  import ProposalSystem from '$lib/slides/ProposalSystem.svelte';
  import AutonomousLife from '$lib/slides/AutonomousLife.svelte';
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
      component: HumanQuestion,
      title: 'The Human Question'
    },
    {
      component: PersonalStrivings,
      title: 'What Is It For You?'
    },
    {
      component: AutonomyAnswer,
      title: 'Autonomy'
    },
    {
      component: WorkChoices,
      title: 'What Choice Do We Have Today?'
    },
    {
      component: EmployeeChoice,
      title: 'Employee Path'
    },
    {
      component: FounderChoice,
      title: 'Founder Path'
    },
    {
      component: BetterSolution,
      title: 'We Have a Better Solution'
    },
    {
      component: HelloEarth,
      title: 'A Better Solution'
    },
    {
      component: FreedomDimensions,
      title: 'The Five Dimensions of Freedom'
    },
    {
      component: DAOIntro,
      title: 'Own What You Help Build'
    },
    {
      component: DAOExplained,
      title: 'What is a DAO?'
    },
    {
      component: DAOExamples,
      title: 'DAOs in Action'
    },
    {
      component: TokenSystem,
      title: 'VCR Token System'
    },
    {
      component: VisionCreatorPool,
      title: 'The 75% Community Pool'
    },
    {
      component: MoneyFlows,
      title: 'How The Money Flows'
    },
    {
      component: ProposalSystem,
      title: 'Your Voice, Your Vote'
    },
    {
      component: AutonomousLife,
      title: 'What Your Journey Could Look Like'
    },
    {
      component: PathToFreedom,
      title: '5-Step Journey to Freedom'
    },
    {
      component: ReclaimWork,
      title: 'Your Work, Your Life'
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
  <title>VisionCreator | Presentation</title>
</svelte:head>

<div class="h-screen w-screen overflow-hidden bg-slate-900 text-white">
  <Presentation slides={slides} currentSlide={currentSlideIndex} />
  
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