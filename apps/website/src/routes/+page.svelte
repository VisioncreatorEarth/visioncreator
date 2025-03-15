<script lang="ts">
  // Test edit to fix tool calling issues - Debug test
  import Avatar from '$lib/Avatar.svelte';
  import { onMount, tick } from 'svelte';
  import { fade, fly, scale, slide } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';
  
  // Seeds for generating consistent avatars
  const seeds = [
    'alice', 'bob', 'charlie', 'david', 'eve', 
    'frank', 'grace', 'henry'
  ];
  
  // Navigation links
  const navLinks = [
    { label: 'About', url: '/#about' },
    { label: 'Solution', url: '/#solution' },
    { label: 'Process', url: '/#process' },
    { label: 'Join', url: 'https://visioncreator.io/join' }
  ];
  
  // Define sections with proper TypeScript interface
  interface Section {
    id: string;
    title: string;
    subtitle?: string;
    content?: string[];
    callToAction?: string;
    accent?: boolean;
    hasListItems?: boolean;
    listItems?: string[];
    hasSubslides?: boolean;
    subslides?: {
      id: string;
      title: string;
      content: string;
    }[];
  }
  
  // Define sections
  const sections: Section[] = [
    {
      id: 'hero',
      title: 'We Need a New Way to Work',
      subtitle: 'A New Way to Work',
      accent: true,
      callToAction: 'Join the movement towards a new paradigm of work'
    },
    {
      id: 'outdated',
      title: 'THE OUTDATED NATURE OF WORK',
      subtitle: "In today's digital age, traditional work models are hopelessly outdated.",
      content: [
        "Employee: You trade time for money with no ownership or freedom.",
        "Self-Employed: You gain independence but remain chained to trading time for money, with endless stress."
      ],
      callToAction: "Neither path fits your life in the modern world. You deserve better.",
      accent: true
    },
    {
      id: 'choice',
      title: 'A MISERABLE CHOICE',
      subtitle: "You face a dilemma:",
      content: [
        "Employee: Create value for someone else, never fully realizing your potential.",
        "Self-Employed: Shoulder overwhelming responsibility with little time to breathe."
      ],
      callToAction: "Neither option feels fulfilling in the digital age. It's time for a new way forward."
    },
    {
      id: 'why',
      title: 'WHY THIS MATTERS',
      subtitle: "This isn't just inconvenient—it degrades your quality of life.",
      content: [
        "You spend a huge part of your day at work. It should:"
      ],
      hasListItems: true,
      listItems: [
        "Enhance your well-being.",
        "Secure your financial future."
      ],
      callToAction: "Instead, you feel disconnected and unfulfilled. You deserve work that aligns with who you are."
    },
    {
      id: 'new-way',
      title: 'A NEW WAY FORWARD',
      subtitle: "",
      content: [
        "Imagine a work model that lets you build assets, collaborate freely, and enjoy income that flows without constant work. Visioncreator is this new way—a path to ownership, freedom, and fulfillment for you."
      ],
      accent: true
    },
    {
      id: 'deserve',
      title: 'WHAT YOU DESERVE',
      subtitle: "You deserve an organisation form that feels like home. It should offer:",
      hasSubslides: true,
      subslides: [
        {
          id: 'belonging',
          title: 'Belonging',
          content: 'Be part of a community that values you.'
        },
        {
          id: 'autonomy',
          title: 'Autonomy & Agency',
          content: 'Pursue your purpose without restrictions.'
        },
        {
          id: 'security',
          title: 'Financial Security',
          content: 'Build lasting value for yourself and others.'
        },
        {
          id: 'expression',
          title: 'Authentic Expression',
          content: 'Align your work with your true vision.'
        }
      ]
    },
    {
      id: 'solution',
      title: 'A NEW WAY TO WORK AND LIVE',
      subtitle: "",
      content: [
        "Imagine being a co-owner, not just a participant. Visioncreator is a Decentralized Autonomous Organization where power belongs to everyone. You propose ideas, vote on decisions, and shape our future together—no bosses, just collective wisdom. Your voice matters in every feature, resource, and goal we set. This isn't just a platform; it's a revolution in collaborative work and life."
      ],
      accent: true
    },
    {
      id: 'dao',
      title: 'GOT AN IDEA? SHARE IT!',
      subtitle: "",
      content: [
        "Have an idea or a way to make something better? Post it on our idea board! Whether it's a new feature or a small tweak, this is your chance to shape Visioncreator."
      ]
    },
    {
      id: 'implementation',
      title: 'DISCUSS AND VOTE',
      subtitle: "",
      content: [
        "Your idea kicks off a conversation. We discuss it together as a collective, share feedback, and then vote. Get enough votes, and your idea turns into a draft—ready to take the next step."
      ]
    },
    {
      id: 'your-role',
      title: 'FROM DRAFT TO REALITY',
      subtitle: "",
      content: [
        "Now it's yours to run with. Define your draft, set a budget (say, 1500 euros), and take full responsibility to execute it. You're the leader, backed by the community."
      ]
    },
    {
      id: 'lifestyle',
      title: 'SUCCESS PAYS OFF',
      subtitle: "",
      content: [
        "Once it's done, we vote again. If it's a win, you get paid—not just in euros, but also in token shares that boost your ownership in Visioncreator."
      ]
    },
    {
      id: 'hominio',
      title: 'INTRODUCING HOMINIO',
      subtitle: "",
      content: [
        "We're building our first project with this new kind of organization form.",
        "Hominio is where we begin our journey together."
      ],
      callToAction: "Be among the founding members.",
      accent: true
    },
    {
      id: 'join',
      title: 'JOIN THE REVOLUTION',
      subtitle: "",
      content: [
        "Ready to stop building for others and start building for yourself?"
      ],
      callToAction: "Join Visioncreator today and step into the future of work.",
      accent: true
    }
  ];
  
  // Reactive variables
  let mounted = false;
  let memberCount = 27;
  let scrollY = 0;
  let windowHeight = 0;
  let documentHeight = 0;
  let sectionElements: HTMLElement[] = [];
  let progressPercentage = 0;
  let showWelcome = true;
  let currentSection = 0;
  let currentSubslideIndices: { [key: string]: number } = {};
  
  // Idea process states for visualization
  const processStates: Record<string, string> = {
    'dao': 'idea',
    'implementation': 'vote',
    'your-role': 'draft',
    'lifestyle': 'reward'
  };
  
  // Calculate progress
  function updateProgress() {
    if (documentHeight <= windowHeight) {
      progressPercentage = 100;
      return;
    }
    
    progressPercentage = Math.min(100, Math.max(0, 
      (scrollY / (documentHeight - windowHeight)) * 100
    ));
    
    // Hide welcome screen when scrolling down
    if (scrollY > 100 && showWelcome) {
      showWelcome = false;
    }
  }
  
  // Initialize intersection observer
  function initObserver() {
    const options = {
      root: null,
      rootMargin: "-20% 0px",
      threshold: 0.3
    };
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const id = entry.target.id;
        
        if (entry.isIntersecting) {
          const index = sections.findIndex(section => section.id === id);
          if (index >= 0) {
            currentSection = index;
            
            // Update URL hash without triggering scroll
            const newUrl = window.location.pathname + `#${id}`;
            history.replaceState(null, '', newUrl);
          }
        }
      });
    }, options);
    
    sectionElements.forEach(el => observer.observe(el));
    
    return observer;
  }
  
  // Scroll to section
  function scrollToSection(index: number) {
    const section = sectionElements[index];
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' });
    }
  }
  
  // Navigate subslides
  function nextSubslide(sectionId: string) {
    if (!currentSubslideIndices[sectionId]) {
      currentSubslideIndices[sectionId] = 0;
    }
    
    const section = sections.find(s => s.id === sectionId);
    if (section?.hasSubslides && section.subslides) {
      const maxIndex = section.subslides.length - 1;
      currentSubslideIndices[sectionId] = Math.min(maxIndex, currentSubslideIndices[sectionId] + 1);
    }
  }
  
  function prevSubslide(sectionId: string) {
    if (!currentSubslideIndices[sectionId]) {
      currentSubslideIndices[sectionId] = 0;
    }
    
    currentSubslideIndices[sectionId] = Math.max(0, currentSubslideIndices[sectionId] - 1);
  }
  
  // Start presentation and hide welcome screen
  function startPresentation() {
    showWelcome = false;
    setTimeout(() => {
      scrollToSection(0);
    }, 100);
  }
  
  onMount(() => {
    // Initialize current subslide indices
    sections.forEach(section => {
      if (section.hasSubslides) {
        currentSubslideIndices[section.id] = 0;
      }
    });
    
    // Get section elements
    sectionElements = sections.map(section => document.getElementById(section.id) as HTMLElement);
    
    // Set initial dimensions
    windowHeight = window.innerHeight;
    documentHeight = document.body.scrollHeight;
    
    // Handle initial hash
    if (window.location.hash) {
      const id = window.location.hash.substring(1);
      const index = sections.findIndex(section => section.id === id);
      if (index >= 0) {
        showWelcome = false;
      setTimeout(() => {
          scrollToSection(index);
        }, 100);
      }
    }
    
    // Set up observer
    const observer = initObserver();
    
    // Event listeners
    const handleScroll = () => {
      scrollY = window.scrollY;
      updateProgress();
    };
    
    const handleResize = () => {
      windowHeight = window.innerHeight;
      documentHeight = document.body.scrollHeight;
      updateProgress();
    };
    
      window.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleResize);
    
    // Initial update
    handleScroll();
      
      return () => {
        window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
      observer.disconnect();
      };
  });
</script>

<svelte:head>
  <title>Visioncreator | Own Your Future</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
</svelte:head>

<svelte:window bind:scrollY />

<div class="landing-page">
  <!-- Progress bar -->
  <div class="progress-container">
    <div class="progress-bar" style="width: {progressPercentage}%"></div>
    </div>
  
  <!-- Scroll to top button -->
  {#if scrollY > windowHeight && !showWelcome}
    <button 
      class="scroll-top-button"
      on:click={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label="Scroll to top"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M18 15l-6-6-6 6"/>
      </svg>
    </button>
  {/if}
  
  <!-- Welcome screen -->
  {#if showWelcome}
    <div class="welcome-screen" transition:fade={{ duration: 300 }}>
      <div class="glow-background">
        <div class="glow glow-1"></div>
        <div class="glow glow-2"></div>
  </div>

      <div class="welcome-content">
        <div class="welcome-title" in:fade={{ duration: 800, delay: 200 }}>
          <div class="title-line">Visioncreator</div>
          <div class="title-subtitle">A New Way to Work</div>
        </div>
        <p in:fade={{ duration: 800, delay: 400 }}>Own Your Future</p>
        
      <button 
          class="action-button" 
          on:click={startPresentation}
          in:fade={{ duration: 800, delay: 600 }}
        >
          Explore
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="7 13 12 18 17 13"></polyline>
            <polyline points="7 6 12 11 17 6"></polyline>
          </svg>
        </button>
  </div>
    </div>
  {/if}

  <!-- Section content -->
  <main class="sections-container">
    <!-- Single global glow background -->
    <div class="glow-background">
      <div class="glow glow-1"></div>
      <div class="glow glow-2"></div>
    </div>
    
    {#each sections as section, i}
      <section 
        id={section.id} 
        class="section"
        class:active={i === currentSection}
        class:accent={section.accent}
        style="--section-index: {i}"
      >
        <div class="section-content">
          {#if section.id === 'hero'}
            <!-- Hero section with centered content -->
            <h2 in:fly={{ y: 20, duration: 800, delay: 100 }}>{section.title}</h2>
            <p class="subtitle" in:fly={{ y: 20, duration: 800, delay: 200 }}>{section.subtitle}</p>
            
            {#if section.callToAction}
              <div class="call-to-action" in:fade={{ duration: 800, delay: 400 }}>
                <p>{section.callToAction}</p>
              </div>
            {/if}
            
            <div class="arrow-down" in:fade={{ duration: 400, delay: 800 }} aria-label="Scroll down to next section">
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <polyline points="19 12 12 19 5 12"></polyline>
              </svg>
      </div>
      
          {:else if section.id === 'outdated'}
            <!-- Custom layout for outdated section -->
            <div class="split-layout">
              <div class="split-content">
                <h2 in:fly={{ y: 20, duration: 800, delay: 100 }}>{section.title}</h2>
                <p class="subtitle" in:fly={{ y: 20, duration: 800, delay: 200 }}>{section.subtitle}</p>
                
                <div class="comparison-container" in:fade={{ duration: 600, delay: 300 }}>
                  <div class="comparison-card employee">
                    <h3>Employee</h3>
                    <p>You trade time for money with no ownership or freedom.</p>
      </div>
                  <div class="comparison-divider">VS</div>
                  <div class="comparison-card self-employed">
                    <h3>Self-Employed</h3>
                    <p>You gain independence but remain chained to trading time for money, with endless stress.</p>
    </div>
                </div>
                
                {#if section.callToAction}
                  <div class="call-to-action" in:fade={{ duration: 800, delay: 600 }}>
                    <p>{section.callToAction}</p>
                  </div>
                {/if}
              </div>
              <div class="split-visual">
                <div class="model-visual" in:scale={{ duration: 800, delay: 500, start: 0.8 }}>
                  <div class="model-old"></div>
                  <div class="model-arrow">
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <line x1="5" y1="12" x2="19" y2="12"></line>
                      <polyline points="12 5 19 12 12 19"></polyline>
                    </svg>
                  </div>
                  <div class="model-new"></div>
                </div>
              </div>
    </div>
    
          {:else if section.id === 'choice'}
            <!-- Choice section custom layout -->
            <h2 in:fly={{ y: 20, duration: 800, delay: 100 }}>{section.title}</h2>
            
            {#if section.subtitle}
              <p class="subtitle" in:fly={{ y: 20, duration: 800, delay: 200 }}>{section.subtitle}</p>
            {/if}
            
            <div class="choice-layout">
              <div class="paths-container" in:fade={{ duration: 600, delay: 300 }}>
                <div class="path-option">
                  <div class="path-icon employee-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                      <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                  </div>
                  <div class="path-content">
                    <h3>Employee</h3>
                    <p>Create value for someone else, never fully realizing your potential.</p>
                    <div class="restrictions">
                      <span class="restriction">Limited freedom</span>
                      <span class="restriction">No ownership</span>
                      <span class="restriction">Capped income</span>
                    </div>
                  </div>
        </div>
        
                <div class="path-divider">
                  <span>OR</span>
        </div>
        
                <div class="path-option">
                  <div class="path-icon self-employed-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                    </svg>
                  </div>
                  <div class="path-content">
                    <h3>Self-Employed</h3>
                    <p>Shoulder overwhelming responsibility with little time to breathe.</p>
                    <div class="restrictions">
                      <span class="restriction">Constant stress</span>
                      <span class="restriction">No security</span>
                      <span class="restriction">Limited scale</span>
                    </div>
                  </div>
        </div>
      </div>
      
              {#if section.callToAction}
                <div class="call-to-action better-way" in:fade={{ duration: 800, delay: 600 }}>
                  <p>{section.callToAction}</p>
      </div>
              {/if}
              
              <div class="arrow-down" in:fade={{ duration: 400, delay: 700 }} aria-label="Scroll down to next section">
                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <polyline points="19 12 12 19 5 12"></polyline>
                </svg>
    </div>
            </div>
            
          {:else if section.id === 'why'}
            <!-- Why This Matters section -->
            <h2 in:fly={{ y: 20, duration: 800, delay: 100 }}>{section.title}</h2>
            
            {#if section.subtitle}
              <p class="subtitle" in:fly={{ y: 20, duration: 800, delay: 200 }}>{section.subtitle}</p>
            {/if}
            
            {#if section.content && section.content.length > 0}
              <div class="content-block" in:fade={{ duration: 600, delay: 300 }}>
                {#each section.content as paragraph}
                  <p>{paragraph}</p>
                {/each}
                
                {#if section.hasListItems && section.listItems && section.listItems.length > 0}
                  <ul class="list-items">
                    {#each section.listItems as item, index}
                      <li in:fly={{ x: 20, duration: 400, delay: 400 + 100 * index }}>{item}</li>
                    {/each}
                  </ul>
                {/if}
    </div>
            {/if}
            
            {#if section.callToAction}
              <div class="call-to-action" in:fade={{ duration: 800, delay: 600 }}>
                <p>{section.callToAction}</p>
              </div>
            {/if}
            
          {:else if section.id === 'new-way'}
            <!-- New Way Forward section -->
            <h2 in:fly={{ y: 20, duration: 800, delay: 100 }}>{section.title}</h2>
            
            {#if section.subtitle}
              <p class="subtitle" in:fly={{ y: 20, duration: 800, delay: 200 }}>{section.subtitle}</p>
            {/if}
            
            <div class="new-way-content" in:fade={{ duration: 600, delay: 300 }}>
              {#if section.content && section.content.length > 0}
                <div class="content-block" in:fade={{ duration: 600, delay: 300 }}>
                  {#each section.content as paragraph}
                    <p>{paragraph}</p>
                  {/each}
                </div>
              {/if}
            </div>
            
            {#if section.callToAction}
              <div class="call-to-action" in:fade={{ duration: 800, delay: 600 }}>
                <p>{section.callToAction}</p>
              </div>
            {/if}
            
          {:else if section.id === 'deserve'}
            <!-- Deserve section with subslides -->
            <h2 in:fly={{ y: 20, duration: 800, delay: 100 }}>{section.title}</h2>
            
            {#if section.subtitle}
              <p class="subtitle" in:fly={{ y: 20, duration: 800, delay: 200 }}>{section.subtitle}</p>
            {/if}
            
            {#if section.hasSubslides && section.subslides && section.subslides.length > 0}
              <div class="subslides-container" in:fade={{ duration: 600, delay: 300 }}>
                <!-- Using index if not initialized -->
                {#if !currentSubslideIndices[section.id]}
                  <!-- svelte-ignore missing-declaration -->
                  {currentSubslideIndices[section.id] = 0}
                {/if}
                
                <div class="subslides-navigation">
                  <button 
                    class="subslide-nav-btn" 
                    on:click={() => prevSubslide(section.id)}
                    disabled={currentSubslideIndices[section.id] === 0}
                    aria-label="Previous slide"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="m15 18-6-6 6-6"/>
                    </svg>
                  </button>
                  
                  <div class="subslides-wrapper">
                    {#each section.subslides as subslide, j}
                      {#if j === currentSubslideIndices[section.id]}
                        <div class="subslide" in:fade={{ duration: 300 }}>
                          <h3>{subslide.title}</h3>
                          <p>{subslide.content}</p>
            </div>
                      {/if}
                    {/each}
              </div>
                  
                  <button 
                    class="subslide-nav-btn" 
                    on:click={() => nextSubslide(section.id)}
                    disabled={currentSubslideIndices[section.id] === (section.subslides?.length || 0) - 1}
                    aria-label="Next slide"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="m9 18 6-6-6-6"/>
                    </svg>
                  </button>
            </div>
                
                <div class="subslides-indicators">
                  {#each section.subslides as _, j}
                    <button 
                      class="subslide-indicator"
                      class:active={j === currentSubslideIndices[section.id]}
                      on:click={() => { currentSubslideIndices[section.id] = j }}
                      aria-label="Go to slide {j + 1}"
                    ></button>
                  {/each}
          </div>
        </div>
            {/if}
            
          {:else if section.id === 'solution'}
            <!-- Solution section with feature cards -->
            <h2 in:fly={{ y: 20, duration: 800, delay: 100 }}>{section.title}</h2>
            
            {#if section.subtitle}
              <p class="subtitle" in:fly={{ y: 20, duration: 800, delay: 200 }}>{section.subtitle}</p>
            {/if}
            
            <div class="solution-features" in:fade={{ duration: 600, delay: 300 }}>
              <div class="feature-card">
                <div class="feature-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M12 2v4"></path><path d="M12 18v4"></path><path d="m4.93 4.93 2.83 2.83"></path><path d="m16.24 16.24 2.83 2.83"></path><path d="M2 12h4"></path><path d="M18 12h4"></path><path d="m4.93 19.07 2.83-2.83"></path><path d="m16.24 7.76 2.83-2.83"></path>
                  </svg>
              </div>
                <h3>Shared Resources</h3>
                <p>Leverage collective expertise, tools, and connections without starting from zero.</p>
              </div>
              
              <div class="feature-card">
                <div class="feature-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                  </svg>
              </div>
                <h3>Built-in Community</h3>
                <p>Work alongside like-minded builders who support your vision and growth.</p>
        </div>
              
              <div class="feature-card">
                <div class="feature-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="m22 9-10 13L2 9l10-5 10 5Z"></path><path d="M12 12v5"></path>
                  </svg>
      </div>
                <h3>Aligned Incentives</h3>
                <p>Build real ownership through contribution, with interests aligned for mutual success.</p>
    </div>
              
              <div class="feature-card">
                <div class="feature-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect width="7" height="9" x="3" y="3" rx="1"></rect><rect width="7" height="5" x="14" y="3" rx="1"></rect><rect width="7" height="9" x="14" y="12" rx="1"></rect><rect width="7" height="5" x="3" y="16" rx="1"></rect>
                  </svg>
                </div>
                <h3>Freedom with Structure</h3>
                <p>Maintain autonomy while accessing frameworks that support consistent growth.</p>
              </div>
    </div>
    
            {#if section.callToAction}
              <div class="call-to-action" in:fade={{ duration: 800, delay: 600 }}>
                <p>{section.callToAction}</p>
              </div>
            {/if}
            
          {:else if section.id === 'dao' || section.id === 'implementation' || section.id === 'your-role' || section.id === 'lifestyle'}
            <!-- Process flow sections with visual indicator -->
            <div class="process-section">
              <h2 in:fly={{ y: 20, duration: 800, delay: 100 }}>{section.title}</h2>
              
              {#if section.subtitle}
                <p class="subtitle" in:fly={{ y: 20, duration: 800, delay: 200 }}>{section.subtitle}</p>
              {/if}
              
              <div class="process-visualization" in:fade={{ duration: 600, delay: 300 }}>
                <div class="process-steps">
                  <div class="process-step {processStates['dao'] === 'idea' ? 'active' : ''}" class:current={section.id === 'dao'}>
                    <div class="step-icon">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <path d="M12 16v-4"></path>
                        <path d="M12 8h.01"></path>
                      </svg>
                    </div>
                    <span>Idea</span>
                  </div>
                  <div class="process-connector"></div>
                  <div class="process-step {processStates['implementation'] === 'vote' ? 'active' : ''}" class:current={section.id === 'implementation'}>
                    <div class="step-icon">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="m9 11 3 3L22 4"></path>
                        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
                      </svg>
                    </div>
                    <span>Vote</span>
                  </div>
                  <div class="process-connector"></div>
                  <div class="process-step {processStates['your-role'] === 'draft' ? 'active' : ''}" class:current={section.id === 'your-role'}>
                    <div class="step-icon">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M12 19c-2.3 0-6.4-.2-8.1-.6-.7-.2-1.2-.7-1.4-1.4-.3-1.1-.5-3.4-.5-5s.2-3.9.5-5c.2-.7.7-1.2 1.4-1.4C5.6 5.2 9.7 5 12 5s6.4.2 8.1.6c.7.2 1.2.7 1.4 1.4.3 1.1.5 3.4.5 5s-.2 3.9-.5 5c-.2.7-.7 1.2-1.4 1.4-1.7.4-5.8.6-8.1.6 0 0 0 0 0 0z"></path>
                        <polygon points="12 16 14 13 12 10 10 13"></polygon>
                      </svg>
                    </div>
                    <span>Draft</span>
                  </div>
                  <div class="process-connector"></div>
                  <div class="process-step {processStates['lifestyle'] === 'reward' ? 'active' : ''}" class:current={section.id === 'lifestyle'}>
                    <div class="step-icon">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="8" r="7"></circle>
                        <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline>
                      </svg>
                    </div>
                    <span>Reward</span>
                  </div>
                </div>
              </div>
              
              {#if section.id === 'dao'}
                <!-- Example idea card for the idea section -->
                <div class="idea-card" in:fade={{ duration: 600, delay: 300 }}>
                  <div class="idea-header">
                    <span class="idea-label">Idea</span>
                    <span class="idea-stars">★ 5</span>
                  </div>
                  <div class="idea-content">
                    <h3>Improve the onboarding process</h3>
                  </div>
                  <div class="idea-footer">
                    <div class="idea-avatar"></div>
                    <span>Posted by you</span>
                  </div>
                  <button class="add-idea-btn">+ Add New Idea</button>
                </div>
              {/if}
              
              {#if section.id === 'implementation'}
                <!-- Voting progress for implementation section -->
                <div class="vote-progress" in:fade={{ duration: 600, delay: 300 }}>
                  <div class="progress-bar-container">
                    <div class="progress-fill" style="width: 75%"></div>
                  </div>
                  <div class="vote-count">9 of 12 votes</div>
                  <div class="vote-avatars">
                    <div class="vote-avatar"></div>
                    <div class="vote-avatar"></div>
                    <div class="vote-avatar"></div>
                    <div class="vote-avatar"></div>
                  </div>
                </div>
              {/if}
              
              {#if section.id === 'your-role'}
                <!-- Draft proposal for the your-role section -->
                <div class="draft-proposal" in:fade={{ duration: 600, delay: 300 }}>
                  <h3>Draft Proposal</h3>
                  <div class="proposal-lines">
                    <div class="proposal-line"></div>
                    <div class="proposal-line"></div>
                    <div class="proposal-line"></div>
                    <div class="proposal-line short"></div>
                  </div>
                  <div class="budget-box">
                    <span>Budget: €1500</span>
                  </div>
                  <div class="proposal-lines">
                    <div class="proposal-line"></div>
                    <div class="proposal-line short"></div>
                  </div>
                </div>
              {/if}
              
              {#if section.id === 'lifestyle'}
                <!-- Reward visualization for the lifestyle section -->
                <div class="reward-visualization" in:fade={{ duration: 600, delay: 300 }}>
                  <div class="reward-tokens">
                    <div class="token euro">€</div>
                    <div class="token vcr">VCR</div>
                  </div>
                  <div class="ownership-stake">
                    <span>Ownership Stake</span>
                  </div>
                </div>
              {/if}
              
              {#if section.content && section.content.length > 0}
                <div class="content-block presentation-content" in:fade={{ duration: 600, delay: 400 }}>
                  {#each section.content as paragraph}
                    <p>{paragraph}</p>
                  {/each}
                </div>
              {/if}
            </div>
          
          {:else if section.id === 'process'}
            <!-- This section is no longer used per the presentation images -->
            <div>
              <!-- Placeholder for empty process section -->
            </div>
            
          {:else if section.id === 'hominio'}
            <!-- Hominio section with special styling -->
            <div class="hominio-section">
              <h2 in:fly={{ y: 20, duration: 800, delay: 100 }}>{section.title}</h2>
              
              {#if section.subtitle}
                <p class="subtitle" in:fly={{ y: 20, duration: 800, delay: 200 }}>{section.subtitle}</p>
              {/if}
              
              {#if section.content && section.content.length > 0}
                <div class="content-block accent-content" in:fade={{ duration: 600, delay: 300 }}>
                  {#each section.content as paragraph}
                    <p>{paragraph}</p>
                  {/each}
                </div>
              {/if}
              
              {#if section.callToAction}
                <div class="call-to-action special-cta" in:fade={{ duration: 800, delay: 600 }}>
                  <p>{section.callToAction}</p>
                  <a href="/join" class="btn accent-btn">Join as a Founder</a>
                </div>
              {/if}
            </div>
            
          {:else if section.id === 'join'}
            <!-- Join section with more impactful CTA -->
            <div class="join-section">
              <h2 in:fly={{ y: 20, duration: 800, delay: 100 }}>{section.title}</h2>
              
              {#if section.subtitle}
                <p class="subtitle" in:fly={{ y: 20, duration: 800, delay: 200 }}>{section.subtitle}</p>
              {/if}
              
              {#if section.content && section.content.length > 0}
                <div class="content-block revolutionary" in:fade={{ duration: 600, delay: 300 }}>
                  <p class="big-text">{section.content[0]}</p>
                </div>
              {/if}
              
              <div class="join-cta" in:fade={{ duration: 800, delay: 500 }}>
                <p>{section.callToAction}</p>
                
                <div class="join-buttons">
                  <a href="/join" class="btn glow-btn">Join VisionCreator</a>
                  <a href="#outdated" class="btn secondary">Learn More</a>
                </div>
              </div>
            </div>
            
          {:else}
            <!-- Default section layout -->
            <h2 in:fly={{ y: 20, duration: 800, delay: 100 }}>{section.title}</h2>
            
            {#if section.subtitle}
              <p class="subtitle" in:fly={{ y: 20, duration: 800, delay: 200 }}>{section.subtitle}</p>
            {/if}
            
            {#if section.content && section.content.length > 0}
              <div class="content-block" in:fade={{ duration: 600, delay: 300 }}>
                {#each section.content as paragraph}
                  <p>{paragraph}</p>
                {/each}
              </div>
            {/if}
            
            {#if section.callToAction}
              <div class="call-to-action" in:fade={{ duration: 800, delay: 600 }}>
                <p>{section.callToAction}</p>
              </div>
            {/if}
          {/if}
        </div>
      </section>
    {/each}
  </main>
</div>

<style>
</style>

