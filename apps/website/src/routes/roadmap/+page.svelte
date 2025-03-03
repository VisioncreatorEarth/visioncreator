<script lang="ts">
  import { onMount } from 'svelte';
  import { fade, fly } from 'svelte/transition';
  
  // Define roadmap milestones with quarters and key deliverables
  interface Milestone {
    title: string;
    description: string;
  }
  
  interface Phase {
    id: string;
    title: string;
    status: 'completed' | 'in-progress' | 'planned' | 'future';
    milestones: Milestone[];
  }
  
  interface StatusInfo {
    color: string;
    icon: string;
    text: string;
  }
  
  const roadmapData: Phase[] = [
    {
      id: 'q2-2023',
      title: 'Q2 2023',
      status: 'completed',
      milestones: [
        { title: 'Concept Development', description: 'Initial research and vision definition' },
        { title: 'Community Building', description: 'First community outreach and feedback gathering' },
        { title: 'Technology Stack Selection', description: 'Platform architecture decisions' }
      ]
    },
    {
      id: 'q3-2023',
      title: 'Q3 2023',
      status: 'completed',
      milestones: [
        { title: 'Alpha Platform Development', description: 'Building core functionality' },
        { title: 'Team Expansion', description: 'Recruiting key contributors' },
        { title: 'Community Growth to 100+ members', description: 'Early adoption phase' }
      ]
    },
    {
      id: 'q4-2023',
      title: 'Q4 2023',
      status: 'completed',
      milestones: [
        { title: 'Beta Testing', description: 'Launching with selected early users' },
        { title: 'First DAO Experiments', description: 'Testing governance models' },
        { title: 'Financial Framework Development', description: 'Setting up tokenomics' }
      ]
    },
    {
      id: 'q1-2024',
      title: 'Q1 2024',
      status: 'in-progress',
      milestones: [
        { title: 'Feature Enhancements', description: 'Based on beta testing feedback' },
        { title: 'Public Beta Launch', description: 'Opening platform to wider audience' },
        { title: 'Community Growth to 500+ members', description: 'Expanding user base' }
      ]
    },
    {
      id: 'q2-2024',
      title: 'Q2 2024',
      status: 'planned',
      milestones: [
        { title: 'Full Platform Launch', description: 'All core features fully operational' },
        { title: 'Mobile App Development', description: 'Extending platform accessibility' },
        { title: 'Partnership Announcements', description: 'Strategic collaborations' }
      ]
    },
    {
      id: 'q3-2024',
      title: 'Q3 2024',
      status: 'planned',
      milestones: [
        { title: 'Scaling Infrastructure', description: 'Supporting larger user base' },
        { title: 'Enhanced DAO Tools', description: 'Advanced governance features' },
        { title: 'Ecosystem Integration', description: 'Third-party app connections' }
      ]
    },
    {
      id: 'q4-2024',
      title: 'Q4 2024',
      status: 'planned',
      milestones: [
        { title: 'Global Expansion', description: 'Multi-language support and regional hubs' },
        { title: 'Community Growth to 5,000+ members', description: 'Mainstream adoption phase' },
        { title: 'Advanced Analytics Dashboard', description: 'Project performance tracking' }
      ]
    },
    {
      id: '2025+',
      title: '2025 & Beyond',
      status: 'future',
      milestones: [
        { title: 'Full DAO Ecosystem', description: 'Interconnected projects and self-governance' },
        { title: 'Community Growth to 50,000+ members', description: 'Mass adoption target' },
        { title: 'Real-world Impact Metrics', description: 'Measuring societal contribution' }
      ]
    }
  ];
  
  // Viewport intersection detection for animations
  let sections: HTMLElement[] = [];
  let intersectionObserver: IntersectionObserver;
  let visibleSections = new Set<string>();
  
  onMount(() => {
    // Set up intersection observer for animation triggers
    intersectionObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && entry.target instanceof HTMLElement) {
          const id = entry.target.dataset.id;
          if (id) {
            visibleSections.add(id);
            visibleSections = visibleSections;
          }
        }
      });
    }, { threshold: 0.2 });
    
    // Observe all milestone sections
    sections.forEach(section => {
      if (section) {
        intersectionObserver.observe(section);
      }
    });
    
    return () => {
      if (intersectionObserver) {
        intersectionObserver.disconnect();
      }
    };
  });
  
  // Helper to determine status color and icon
  function getStatusInfo(status: string): StatusInfo {
    switch (status) {
      case 'completed':
        return { color: 'emerald', icon: 'check-circle', text: 'Completed' };
      case 'in-progress':
        return { color: 'blue', icon: 'clock', text: 'In Progress' };
      case 'planned':
        return { color: 'amber', icon: 'calendar', text: 'Planned' };
      case 'future':
        return { color: 'purple', icon: 'star', text: 'Future Vision' };
      default:
        return { color: 'gray', icon: 'circle', text: 'Undefined' };
    }
  }
</script>

<svelte:head>
  <title>VisionCreator Roadmap</title>
  <meta name="description" content="VisionCreator development roadmap and milestone timeline">
</svelte:head>

<!-- Hero section -->
<section class="py-16 md:py-24 bg-gradient-to-b from-rose-900/20 to-transparent">
  <div class="container mx-auto px-4 md:px-8">
    <div class="max-w-3xl mx-auto text-center" in:fade={{ duration: 800, delay: 200 }}>
      <h1 class="text-4xl md:text-5xl font-bold mb-6 text-white">Our <span class="text-rose-400">Roadmap</span></h1>
      <p class="text-xl text-gray-300 mb-8">
        The journey to revolutionize how we work and create value together.
        This timeline outlines our past achievements and future vision.
      </p>
      
      <div class="flex flex-wrap gap-6 justify-center">
        {#each ['completed', 'in-progress', 'planned', 'future'] as status}
          {@const info = getStatusInfo(status)}
          <div class="flex items-center gap-2">
            <div class={`w-3 h-3 rounded-full bg-${info.color}-500`}></div>
            <span class="text-gray-300 text-sm">{info.text}</span>
          </div>
        {/each}
      </div>
    </div>
  </div>
</section>

<!-- Timeline section -->
<section class="py-12 pb-24">
  <div class="container mx-auto px-4 md:px-8">
    <!-- Interactive timeline -->
    <div class="relative">
      <!-- Center line -->
      <div class="absolute left-1/2 transform -translate-x-1/2 h-full w-1 bg-gray-700"></div>
      
      <!-- Timeline items -->
      <div class="relative">
        {#each roadmapData as phase, index}
          {@const info = getStatusInfo(phase.status)}
          {@const isEven = index % 2 === 0}
          
          <div 
            class="mb-24 relative"
            data-id={phase.id}
            bind:this={sections[index]}
          >
            <!-- Timeline circle indicator -->
            <div 
              class={`absolute left-1/2 transform -translate-x-1/2 -translate-y-4 w-8 h-8 rounded-full border-4 border-gray-800 z-10 bg-${info.color}-500`}
            ></div>
            
            <!-- Timeline card -->
            {#if visibleSections.has(phase.id)}
              <div 
                class={`flex flex-col md:flex-row gap-4 md:items-center ${isEven ? 'md:flex-row-reverse' : ''}`}
                in:fly={{ x: isEven ? 50 : -50, duration: 800, delay: 200 }}
              >
                <!-- Phase title -->
                <div class={`md:w-1/5 text-center ${isEven ? 'md:text-left' : 'md:text-right'}`}>
                  <div class={`text-2xl font-bold text-${info.color}-400`}>{phase.title}</div>
                  <div class={`inline-flex items-center gap-1.5 mt-2 bg-${info.color}-900/30 text-${info.color}-300 px-3 py-1 rounded-full text-sm`}>
                    {#if info.icon === 'check-circle'}
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                      </svg>
                    {:else if info.icon === 'clock'}
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd" />
                      </svg>
                    {:else if info.icon === 'calendar'}
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd" />
                      </svg>
                    {:else}
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    {/if}
                    <span>{info.text}</span>
                  </div>
                </div>
                
                <!-- Milestones card -->
                <div class={`md:w-4/5 ${isEven ? 'md:pr-24' : 'md:pl-24'}`}>
                  <div class="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 shadow-lg">
                    <ul class="space-y-4">
                      {#each phase.milestones as milestone, i}
                        <li class="flex gap-4 items-start" in:fly={{ y: 10, duration: 400, delay: 200 + (i * 100) }}>
                          <div class={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-${info.color}-900/40 text-${info.color}-400`}>
                            {i + 1}
                          </div>
                          <div>
                            <h3 class="text-lg font-medium text-white">{milestone.title}</h3>
                            <p class="text-gray-400">{milestone.description}</p>
                          </div>
                        </li>
                      {/each}
                    </ul>
                  </div>
                </div>
              </div>
            {/if}
          </div>
        {/each}
      </div>
    </div>
  </div>
</section>

<!-- Call to action section -->
<section class="py-16 bg-gradient-to-t from-rose-900/20 to-transparent">
  <div class="container mx-auto px-4 max-w-3xl text-center">
    <h2 class="text-3xl font-bold mb-6">Join Us on This Journey</h2>
    <p class="text-gray-300 mb-8">
      Our roadmap is ambitious but achievable with a strong community. 
      By contributing just €1 per day, you can be part of building this future.
    </p>
    
    <div class="flex justify-center">
      <a 
        href="/" 
        class="bg-rose-600 hover:bg-rose-700 text-white px-6 py-3 rounded-lg font-medium transition transform hover:scale-105"
      >
        Become a Member
      </a>
    </div>
  </div>
</section> 