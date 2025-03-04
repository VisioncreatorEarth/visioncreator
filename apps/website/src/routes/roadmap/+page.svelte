<script lang="ts">
  import { onMount } from 'svelte';
  import { fade, fly, scale } from 'svelte/transition';
  import { elasticOut } from 'svelte/easing';
  
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
    members?: number; // For Fibonacci sequence
    communityPool?: number; // Accumulated pool funds
    projects?: number; // Number of projects possible
  }
  
  interface StatusInfo {
    color: string;
    icon: string;
    text: string;
  }
  
  // Calculate Fibonacci milestones and funding projections
  const CONTRIBUTION_PER_YEAR = 356; // In euros
  const TOKEN_PRICE = 365; // In euros 
  const POOL_PERCENTAGE = 0.75; // 75% goes to community pool
  const PROJECT_FUNDING_PERCENTAGE = 0.60; // 60% of pool for project funding
  const CONTRIBUTION_REWARDS_PERCENTAGE = 0.40; // 40% of pool for contribution rewards
  const AVG_PROJECT_INITIAL_FUNDING = 5000; // Average initial funding per project
  
  // Fibonacci sequence: 1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, ...
  // Starting from 21 members as first milestone
  const fibonacciMilestones = [21, 34, 55, 89, 144];
  
  // Calculate community pool size at each milestone
  function calculatePoolSize(members: number, years: number = 1): number {
    return members * CONTRIBUTION_PER_YEAR * POOL_PERCENTAGE * years;
  }
  
  // Calculate number of possible projects for a given pool size
  function calculatePossibleProjects(poolSize: number): number {
    const fundingAvailable = poolSize * PROJECT_FUNDING_PERCENTAGE;
    return Math.floor(fundingAvailable / AVG_PROJECT_INITIAL_FUNDING);
  }
  
  // Define roadmap data with 2025 onwards focus and calculated metrics
  const roadmapData: Phase[] = [
    {
      id: 'q1-2025',
      title: 'Q1 2025',
      status: 'in-progress',
      members: fibonacciMilestones[0], // 21 members
      communityPool: calculatePoolSize(fibonacciMilestones[0]),
      projects: calculatePossibleProjects(calculatePoolSize(fibonacciMilestones[0])),
      milestones: [
        { title: 'Vision Refinement', description: 'Fine-tuning our collective mission and values' },
        { title: 'First 21 Members', description: 'Onboarding founding members and pioneers' },
        { title: 'Initial Pool Formation', description: `€${Math.round(calculatePoolSize(fibonacciMilestones[0]))} community pool established` }
      ]
    },
    {
      id: 'q2-2025',
      title: 'Q2 2025',
      status: 'planned',
      members: fibonacciMilestones[1], // 34 members
      communityPool: calculatePoolSize(fibonacciMilestones[1]),
      projects: calculatePossibleProjects(calculatePoolSize(fibonacciMilestones[1])),
      milestones: [
        { title: 'Governance Structure', description: 'Implementing decision-making framework' },
        { title: 'Growth to 34 Members', description: 'Expanding our founding community' },
        { title: 'First Project Funding', description: `First ${calculatePossibleProjects(calculatePoolSize(fibonacciMilestones[1]))} community-selected projects funded` }
      ]
    },
    {
      id: 'q3-2025',
      title: 'Q3 2025',
      status: 'planned',
      members: fibonacciMilestones[2], // 55 members
      communityPool: calculatePoolSize(fibonacciMilestones[2]),
      projects: calculatePossibleProjects(calculatePoolSize(fibonacciMilestones[2])),
      milestones: [
        { title: 'Token System Launch', description: 'Implementing our ownership and governance token' },
        { title: 'Growth to 55 Members', description: 'Continued community expansion' },
        { title: 'Project Acceleration', description: `Supporting ${calculatePossibleProjects(calculatePoolSize(fibonacciMilestones[2]))} community projects` }
      ]
    },
    {
      id: 'q4-2025',
      title: 'Q4 2025',
      status: 'planned',
      members: fibonacciMilestones[3], // 89 members
      communityPool: calculatePoolSize(fibonacciMilestones[3]),
      projects: calculatePossibleProjects(calculatePoolSize(fibonacciMilestones[3])),
      milestones: [
        { title: 'Contribution Framework', description: 'Standardizing how value is measured and rewarded' },
        { title: 'Growth to 89 Members', description: 'Approaching our first major membership milestone' },
        { title: 'Project Portfolio Expansion', description: `${calculatePossibleProjects(calculatePoolSize(fibonacciMilestones[3]))} diverse projects in the ecosystem` }
      ]
    },
    {
      id: 'h1-2026',
      title: 'H1 2026',
      status: 'future',
      members: fibonacciMilestones[4], // 144 members
      communityPool: calculatePoolSize(fibonacciMilestones[4], 1.5), // 1.5 years of accumulation
      projects: calculatePossibleProjects(calculatePoolSize(fibonacciMilestones[4], 1.5)),
      milestones: [
        { title: 'First Major Milestone: 144 Members', description: 'Completing our initial growth phase' },
        { title: 'Revenue Sharing Implementation', description: 'First profit distributions from successful projects' },
        { title: 'Sustainable Ecosystem', description: `${calculatePossibleProjects(calculatePoolSize(fibonacciMilestones[4], 1.5))} projects generating value and reinvesting` }
      ]
    },
    {
      id: 'h2-2026',
      title: 'H2 2026',
      status: 'future',
      members: 233, // Next Fibonacci number
      communityPool: calculatePoolSize(233, 2), // 2 years of accumulation
      projects: calculatePossibleProjects(calculatePoolSize(233, 2)),
      milestones: [
        { title: 'Growth to 233 Members', description: 'Expanding beyond our core community' },
        { title: 'Self-Sustaining Projects', description: 'First projects becoming fully independent' },
        { title: 'Community Space Acquisition', description: 'Physical location for collaboration and innovation' }
      ]
    },
    {
      id: '2027',
      title: '2027',
      status: 'future',
      members: 377, // Next Fibonacci number
      communityPool: calculatePoolSize(377, 2.5), // 2.5 years of accumulation
      projects: calculatePossibleProjects(calculatePoolSize(377, 2.5)),
      milestones: [
        { title: 'Growth to 377 Members', description: 'Community scaling and diversification' },
        { title: 'Regional Expansion', description: 'Establishing hubs in multiple locations' },
        { title: 'Educational Program Launch', description: 'Training new members in autonomous work principles' }
      ]
    },
    {
      id: '2028+',
      title: '2028 & Beyond',
      status: 'future',
      members: 610, // Next Fibonacci number
      communityPool: calculatePoolSize(610, 3), // 3 years of accumulation
      projects: calculatePossibleProjects(calculatePoolSize(610, 3)),
      milestones: [
        { title: 'Vision 2030 Planning', description: 'Setting bold goals for the next decade' },
        { title: 'Social Impact Measurement', description: 'Quantifying our contribution to societal change' },
        { title: 'New Work Paradigm Showcase', description: 'Demonstrating our alternative to traditional employment' }
      ]
    }
  ];
  
  // Viewport intersection detection for animations
  let sections: HTMLElement[] = [];
  let fundingSection: HTMLElement;
  let intersectionObserver: IntersectionObserver;
  let visibleSections = new Set<string>();
  let showFundingModel = false;
  
  onMount(() => {
    // Set up intersection observer for animation triggers
    intersectionObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && entry.target instanceof HTMLElement) {
          if (entry.target === fundingSection) {
            showFundingModel = true;
            return;
          }
          
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
    
    // Observe funding model section
    if (fundingSection) {
      intersectionObserver.observe(fundingSection);
    }
    
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
  
  // Format numbers for better readability
  function formatNumber(num: number): string {
    return new Intl.NumberFormat('en-US').format(Math.round(num));
  }
</script>

<svelte:head>
  <title>VisionCreator Roadmap</title>
  <meta name="description" content="VisionCreator development roadmap and milestone timeline from 2025 onwards">
</svelte:head>

<!-- Hero section -->
<section class="py-16 md:py-24 bg-gradient-to-b from-rose-900/20 to-transparent">
  <div class="container mx-auto px-4 md:px-8">
    <div class="max-w-3xl mx-auto text-center" in:fade={{ duration: 800, delay: 200 }}>
      <h1 class="text-4xl md:text-5xl font-bold mb-6 text-white">Our <span class="text-rose-400">Vision Path</span></h1>
      <p class="text-xl text-gray-300 mb-8">
        From 2025 onwards, we're building a revolutionary system for work and financial autonomy. 
        Join us as €1/day contributes to our collective future.
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

<!-- Funding Model Explanation -->
<section class="py-16 bg-gradient-to-b from-gray-900 to-gray-900/30" bind:this={fundingSection}>
  <div class="container mx-auto px-4 md:px-8">
    <div class="max-w-4xl mx-auto">
      <h2 class="text-3xl font-bold text-center mb-10 text-rose-400" in:fade={{ duration: 800 }}>
        How Our Funding Works
      </h2>
      
      {#if showFundingModel}
        <div class="grid gap-8 md:grid-cols-2 mb-16">
          <!-- Contribution Model -->
          <div 
            class="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 shadow-lg"
            in:fly={{ x: -50, duration: 800 }}
          >
            <h3 class="text-xl font-bold text-white mb-4 flex items-center">
              <div class="w-8 h-8 rounded-full bg-rose-500 flex items-center justify-center mr-3 text-white">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clip-rule="evenodd" />
                </svg>
              </div>
              Member Contributions
            </h3>
            
            <div class="space-y-4 text-gray-300">
              <div class="flex items-center justify-between">
                <span>Daily:</span>
                <span class="font-mono bg-rose-900/30 px-2 py-1 rounded">€1 / day</span>
              </div>
              <div class="flex items-center justify-between">
                <span>Monthly:</span>
                <span class="font-mono bg-rose-900/30 px-2 py-1 rounded">€30 / month</span>
              </div>
              <div class="flex items-center justify-between">
                <span>Yearly:</span>
                <span class="font-mono bg-rose-900/30 px-2 py-1 rounded">€356 / year</span>
              </div>
              <div class="flex items-center justify-between">
                <span>5-Year Total:</span>
                <span class="font-mono bg-rose-900/30 px-2 py-1 rounded">€1,825 / member</span>
              </div>
              
              <div class="pt-4 text-sm">
                <p>Each member contributes just €1 per day, making participation accessible to most people. This small individual contribution becomes powerful when pooled together.</p>
              </div>
            </div>
          </div>
          
          <!-- Pool Allocation -->
          <div 
            class="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 shadow-lg"
            in:fly={{ x: 50, duration: 800 }}
          >
            <h3 class="text-xl font-bold text-white mb-4 flex items-center">
              <div class="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center mr-3 text-white">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </div>
              Community Pool Allocation
            </h3>
            
            <div class="space-y-6 text-gray-300">
              <div class="flex flex-col gap-2">
                <div class="w-full bg-gray-700 h-6 rounded-full overflow-hidden relative">
                  <div class="absolute inset-0 h-full w-3/4 bg-gradient-to-r from-blue-600 to-rose-500"></div>
                  <div class="absolute inset-0 flex items-center justify-center text-xs font-semibold">75% to Community Pool</div>
                </div>
                <div class="w-full bg-gray-700 h-6 rounded-full overflow-hidden relative">
                  <div class="absolute inset-0 h-full w-1/4 bg-gradient-to-r from-emerald-600 to-emerald-400"></div>
                  <div class="absolute inset-0 flex items-center justify-center text-xs font-semibold">25% to Member</div>
                </div>
              </div>
              
              <div class="space-y-2">
                <h4 class="font-semibold text-white">Pool Distribution:</h4>
                <div class="flex flex-col gap-2">
                  <div class="w-full bg-gray-700 h-6 rounded-full overflow-hidden relative">
                    <div class="absolute inset-0 h-full w-3/5 bg-gradient-to-r from-amber-500 to-red-500"></div>
                    <div class="absolute inset-0 flex items-center justify-center text-xs font-semibold">60% Project Funding</div>
                  </div>
                  <div class="w-full bg-gray-700 h-6 rounded-full overflow-hidden relative">
                    <div class="absolute inset-0 h-full w-2/5 bg-gradient-to-r from-emerald-500 to-teal-500"></div>
                    <div class="absolute inset-0 flex items-center justify-center text-xs font-semibold">40% Contribution Rewards</div>
                  </div>
                </div>
              </div>
              
              <div class="pt-2 text-sm">
                <p>75% of all contributions and token purchases go to the community pool, creating a powerful collective resource. This pool is then allocated to fund new projects (60%) and reward valuable contributions (40%).</p>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Growth Visualization -->
        <div 
          class="bg-gray-800/30 backdrop-blur-sm border border-gray-700 rounded-xl p-6 shadow-xl mb-12"
          in:fly={{ y: 50, duration: 800, delay: 200 }}
        >
          <h3 class="text-2xl font-bold text-white mb-6 text-center">Fibonacci Growth Projections</h3>
          
          <div class="overflow-x-auto">
            <table class="w-full text-sm text-left text-gray-300">
              <thead class="text-xs uppercase bg-gray-800 text-gray-400">
                <tr>
                  <th class="px-4 py-3 rounded-tl-lg">Period</th>
                  <th class="px-4 py-3">Members</th>
                  <th class="px-4 py-3">Community Pool</th>
                  <th class="px-4 py-3">Project Funding</th>
                  <th class="px-4 py-3">Possible Projects</th>
                  <th class="px-4 py-3 rounded-tr-lg">Contribution Rewards</th>
                </tr>
              </thead>
              <tbody>
                {#each roadmapData as phase, i}
                  {@const poolSize = phase.communityPool || 0}
                  {@const projectFunding = poolSize * PROJECT_FUNDING_PERCENTAGE}
                  {@const contributionRewards = poolSize * CONTRIBUTION_REWARDS_PERCENTAGE}
                  
                  <tr class={i % 2 === 0 ? 'bg-gray-800/30' : 'bg-gray-900/30'}>
                    <td class="px-4 py-4 font-medium text-white">{phase.title}</td>
                    <td class="px-4 py-4 font-mono">{phase.members || 0}</td>
                    <td class="px-4 py-4 font-mono">€{formatNumber(poolSize)}</td>
                    <td class="px-4 py-4 font-mono">€{formatNumber(projectFunding)}</td>
                    <td class="px-4 py-4 font-mono">{phase.projects || 0}</td>
                    <td class="px-4 py-4 font-mono">€{formatNumber(contributionRewards)}</td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
          
          <div class="mt-6 text-sm text-gray-400 text-center">
            <p>Based on €356 annual contribution per member with 75% allocated to community pool.</p>
            <p>Projects receive an average of €5,000 initial funding, with 60% of pool directed to project funding.</p>
          </div>
        </div>
      {/if}
    </div>
  </div>
</section>

<!-- Development Timeline heading -->
<section class="py-8">
  <div class="container mx-auto px-4 md:px-8">
    <div class="max-w-3xl mx-auto text-center mb-12" in:fade={{ duration: 800 }}>
      <h2 class="text-3xl font-bold text-white">Development Timeline</h2>
      <p class="text-gray-300 mt-4">
        From 2025 onwards, we'll be building the VisionCreator ecosystem. 
        Follow our path from the first 21 members to a community of hundreds.
      </p>
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
                <!-- Phase title and metrics -->
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
                  
                  {#if phase.members}
                    <div class="mt-4 space-y-2">
                      <div class="text-gray-400 text-sm">
                        <span class="font-medium text-white">{phase.members}</span> members
                      </div>
                      <div class="text-gray-400 text-sm">
                        <span class="font-medium text-emerald-400">€{formatNumber(phase.communityPool || 0)}</span> pool
                      </div>
                      <div class="text-gray-400 text-sm">
                        <span class="font-medium text-amber-400">{phase.projects}</span> projects
                      </div>
                    </div>
                  {/if}
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
                            <p class="text-gray-300 mt-1">{milestone.description}</p>
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

<!-- Call to action -->
<section class="py-16 bg-gradient-to-b from-gray-900 to-black">
  <div class="container mx-auto px-4 md:px-8">
    <div class="max-w-3xl mx-auto text-center">
      <h2 class="text-3xl font-bold text-white mb-6">Be a Founding Pioneer</h2>
      <p class="text-xl text-gray-300 mb-8">
        Our vision for 2025 and beyond requires dedicated early adopters who believe in a better way to work and create value. With just €1 per day, you'll be among the first 100 members shaping this revolutionary ecosystem from the ground up.
      </p>
      
      <div class="flex flex-col sm:flex-row gap-4 justify-center">
        <a href="#" class="px-8 py-4 bg-gradient-to-r from-rose-500 to-pink-600 rounded-md text-white font-bold hover:from-rose-400 hover:to-pink-500 transition-all shadow-lg">
          Reserve Your Membership
        </a>
        <a href="/presentation" class="px-8 py-4 bg-gray-800 hover:bg-gray-700 rounded-md text-white font-medium transition-all">
          Watch Our Presentation
        </a>
      </div>
      
      <p class="text-gray-400 mt-6">Limited to the first 100 members. Early pioneers receive founder benefits.</p>
    </div>
  </div>
</section> 