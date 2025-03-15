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
  /* Global styles */
  :global(body) {
    margin: 0;
    padding: 0;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
    color: #fff;
    background-color: #000;
    overflow-x: hidden;
    line-height: 1.6;
  }
  
  /* Main container */
  .landing-page {
    position: relative;
    width: 100%;
    min-height: 100vh;
    background-color: #000;
    color: #fff;
  }
  
  /* Progress Bar */
  .progress-container {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 3px;
    background: rgba(255, 255, 255, 0.1);
    z-index: 1000;
  }
  
  .progress-bar {
    height: 100%;
    background: linear-gradient(to right, #7c3aed, #3b82f6);
    width: 0%;
    transition: width 0.3s ease;
  }
  
  /* Section styling */
  .sections-container {
    position: relative;
    width: 100%;
    height: 100%;
  }
  
  .section {
    position: relative;
    min-height: 100vh;
    width: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    overflow: hidden;
    padding: 4rem 2rem;
    box-sizing: border-box;
    transition: all 0.5s ease;
  }
  
  .section-content {
    max-width: 1200px;
    width: 100%;
    margin: 0 auto;
    position: relative;
    z-index: 10;
    padding: 2rem;
  }
  
  /* Glow background effects - preserve existing space theme */
  .glow-background {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    overflow: hidden;
    z-index: 1;
    background-color: #000;
    /* Adding subtle star field for space theme */
    background-image: 
      radial-gradient(1px 1px at 20px 30px, rgba(255, 255, 255, 0.3), rgba(0, 0, 0, 0)),
      radial-gradient(1px 1px at 40px 70px, rgba(255, 255, 255, 0.3), rgba(0, 0, 0, 0)),
      radial-gradient(1px 1px at 50px 160px, rgba(255, 255, 255, 0.3), rgba(0, 0, 0, 0)),
      radial-gradient(1px 1px at 90px 40px, rgba(255, 255, 255, 0.3), rgba(0, 0, 0, 0)),
      radial-gradient(1px 1px at 130px 80px, rgba(255, 255, 255, 0.3), rgba(0, 0, 0, 0));
    background-repeat: repeat;
    background-size: 200px 200px;
  }
  
  .glow {
    position: absolute;
    border-radius: 50%;
    filter: blur(60px);
    opacity: 0.15;
    animation: float 20s infinite ease-in-out;
  }
  
  .glow-1 {
    width: 40vw;
    height: 40vw;
    background: radial-gradient(circle, #4f46e5 0%, #3730a3 100%);
    top: 10%;
    left: 20%;
    animation-delay: 0s;
  }
  
  .glow-2 {
    width: 50vw;
    height: 50vw;
    background: radial-gradient(circle, #7c3aed 0%, #4c1d95 100%);
    bottom: 5%;
    right: 10%;
    animation-delay: -5s;
  }
  
  /* Modern Typography styling based on reference images */
  h2 {
    font-size: 3rem;
    font-weight: 700;
    margin-bottom: 1.5rem;
    line-height: 1.2;
    background: linear-gradient(to right, #fff, #d4d4d8);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
  }
  
  .subtitle {
    font-size: 1.25rem;
    opacity: 0.9;
    max-width: 800px;
    margin-bottom: 2rem;
  }
  
  /* Content blocks styling */
  .content-block {
    background: rgba(30, 30, 40, 0.5);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    padding: 2rem;
    margin: 1.5rem 0;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
    transition: transform 0.3s ease, box-shadow 0.3s ease;
  }
  
  .content-block:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.3);
  }
  
  /* Button styling */
  .btn {
    display: inline-block;
    padding: 0.75rem 1.5rem;
    background: linear-gradient(90deg, #7c3aed, #4f46e5);
    color: white;
    border: none;
    border-radius: 6px;
    font-weight: 600;
    text-decoration: none;
    transition: all 0.3s ease;
    box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);
    cursor: pointer;
    margin-top: 1rem;
  }
  
  .btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(79, 70, 229, 0.4);
  }
  
  .btn.secondary {
    background: transparent;
    border: 2px solid rgba(79, 70, 229, 0.6);
    color: rgba(255, 255, 255, 0.9);
    box-shadow: none;
  }
  
  .btn.secondary:hover {
    background: rgba(79, 70, 229, 0.1);
  }
  
  /* Welcome screen */
  .welcome-screen {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }
  
  .welcome-content {
    position: relative;
    z-index: 10;
    text-align: center;
  }
  
  .welcome-title {
    font-size: 5rem;
    font-weight: 700;
    margin-bottom: 2rem;
    line-height: 1;
  }
  
  .title-line {
    background: linear-gradient(to right, #ffffff, #b3b3ff);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
    text-shadow: 0 0 30px rgba(179, 179, 255, 0.5);
  }
  
  .title-subtitle {
    font-size: 2.5rem;
    font-weight: 300;
    background: linear-gradient(to right, #64ffda, #4f46e5);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
    margin-top: 0.5rem;
  }
  
  .welcome-content p {
    font-size: 1.5rem;
    color: rgba(255, 255, 255, 0.6);
    margin-bottom: 3rem;
    letter-spacing: 0.05em;
  }
  
  /* Action button */
  .action-button {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.5rem;
    background: rgba(255, 255, 255, 0.1);
    color: #ffffff;
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 2rem;
    font-weight: 500;
    font-size: 1rem;
    cursor: pointer;
    transition: all 0.3s ease;
    margin-top: 2rem;
    text-decoration: none;
  }
  
  .action-button:hover {
    background: rgba(255, 255, 255, 0.2);
    border-color: rgba(255, 255, 255, 0.3);
  }
  
  .action-button svg {
    transition: transform 0.3s ease;
  }
  
  .action-button:hover svg {
    transform: translateX(3px);
  }
  
  /* Scroll to top button */
  .scroll-top-button {
    position: fixed;
    bottom: 2rem;
    right: 2rem;
    width: 3rem;
    height: 3rem;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    color: #ffffff;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    z-index: 900;
    transition: all 0.3s ease;
  }
  
  .scroll-top-button:hover {
    background: rgba(255, 255, 255, 0.2);
    border-color: rgba(255, 255, 255, 0.3);
  }
  
  /* Animations */
  @keyframes float {
    0%, 100% {
      transform: translateY(0) scale(1);
    }
    50% {
      transform: translateY(-30px) scale(1.05);
    }
  }
  
  @keyframes bounce {
    0%, 100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(10px);
    }
  }
  
  .arrow-down {
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 1rem auto;
    color: rgba(255, 255, 255, 0.6);
    animation: bounce 2s infinite;
  }
  
  /* Responsive adjustments */
  @media (max-width: 768px) {
    .section {
      padding: 2rem 1rem;
    }
    
    .section-content {
      padding: 1rem;
    }
    
    h2 {
      font-size: 2.25rem;
    }
    
    .subtitle {
      font-size: 1.1rem;
    }
    
    .welcome-title {
      font-size: 3.5rem;
    }
  }
  
  /* Cards and specialized content areas similar to reference images */
  .feature-card {
    background: rgba(20, 20, 30, 0.7);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(124, 58, 237, 0.2);
    border-radius: 12px;
    padding: 1.5rem;
    transition: all 0.3s ease;
    display: flex;
    flex-direction: column;
    height: 100%;
  }
  
  .feature-card:hover {
    transform: translateY(-5px);
    border-color: rgba(124, 58, 237, 0.5);
    box-shadow: 0 10px 30px rgba(124, 58, 237, 0.2);
  }
  
  .feature-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 48px;
    height: 48px;
    background: rgba(124, 58, 237, 0.1);
    border-radius: 10px;
    margin-bottom: 1rem;
    color: #a78bfa;
  }
  
  .feature-card h3 {
    font-size: 1.25rem;
    margin-bottom: 0.75rem;
    font-weight: 600;
    background: linear-gradient(to right, #fff, #d4d4d8);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
  }
  
  .solution-features {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 1.5rem;
    margin: 2rem 0;
  }
  
  /* Modern grid layout */
  .grid-container {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 2rem;
    margin: 3rem 0;
  }
  
  /* Hero section specific styles */
  .section[id="hero"] {
    min-height: 90vh;
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
  }
  
  .section[id="hero"] h2 {
    font-size: 4rem;
    max-width: 900px;
    margin: 0 auto 1rem;
  }
  
  .section[id="hero"] .subtitle {
    max-width: 700px;
    margin: 0 auto 2rem;
    font-size: 1.5rem;
  }
  
  /* Special section styles from reference */
  .accent-section {
    position: relative;
  }
  
  .accent-section::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(to bottom, rgba(124, 58, 237, 0.1), transparent);
    pointer-events: none;
    z-index: -1;
  }
  
  /* Stat counter styled like reference */
  .stat-card {
    background: rgba(20, 20, 30, 0.7);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    padding: 2rem;
    text-align: center;
  }
  
  .stat-number {
    font-size: 3.5rem;
    font-weight: 700;
    margin-bottom: 0.5rem;
    background: linear-gradient(to right, #7c3aed, #3b82f6);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
  }
  
  .stat-label {
    font-size: 1rem;
    opacity: 0.7;
    text-transform: uppercase;
    letter-spacing: 1px;
  }
  
  /* Quote section like in reference */
  .quote-card {
    position: relative;
    background: rgba(20, 20, 30, 0.7);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(124, 58, 237, 0.3);
    border-radius: 12px;
    padding: 2.5rem;
    margin: 3rem 0;
  }
  
  .quote-card::before {
    content: '"';
    position: absolute;
    top: -1.5rem;
    left: 1.5rem;
    font-size: 6rem;
    line-height: 1;
    color: rgba(124, 58, 237, 0.4);
    font-family: serif;
  }
  
  .quote-text {
    font-size: 1.25rem;
    line-height: 1.7;
    margin-bottom: 1.5rem;
    font-style: italic;
  }
  
  .quote-author {
    display: flex;
    align-items: center;
    gap: 1rem;
  }
  
  .author-avatar {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: linear-gradient(to right, #7c3aed, #3b82f6);
  }
  
  .author-details {
    display: flex;
    flex-direction: column;
  }
  
  .author-name {
    font-weight: 600;
  }
  
  .author-role {
    font-size: 0.875rem;
    opacity: 0.7;
  }
  
  /* Process visualization */
  .process-section {
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  
  .process-visualization {
    margin: 2rem 0;
    width: 100%;
    max-width: 800px;
  }
  
  .process-steps {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 2rem;
  }
  
  .process-step {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    position: relative;
    z-index: 2;
    transition: transform 0.3s ease;
  }
  
  .step-icon {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    transition: all 0.3s ease;
  }
  
  .process-step.active .step-icon {
    background: linear-gradient(90deg, #7c3aed, #3b82f6);
    color: #fff;
    box-shadow: 0 0 15px rgba(124, 58, 237, 0.5);
  }
  
  .process-step.current .step-icon {
    transform: scale(1.2);
    box-shadow: 0 0 20px rgba(124, 58, 237, 0.7);
  }
  
  .process-step:hover {
    transform: translateY(-5px);
  }
  
  .process-connector {
    flex: 1;
    height: 2px;
    background: rgba(255, 255, 255, 0.1);
    position: relative;
    z-index: 1;
  }
  
  /* DAO Process sections - modern card styling */
  .idea-card, .vote-progress, .draft-proposal, .reward-visualization {
    background: rgba(20, 20, 30, 0.7);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(124, 58, 237, 0.2);
    border-radius: 12px;
    padding: 1.5rem;
    max-width: 500px;
    margin: 2rem auto;
    box-shadow: 0 5px 20px rgba(0, 0, 0, 0.3);
  }
  
  .idea-card:hover, .vote-progress:hover, .draft-proposal:hover, .reward-visualization:hover {
    transform: translateY(-5px);
    border-color: rgba(124, 58, 237, 0.4);
    box-shadow: 0 10px 30px rgba(124, 58, 237, 0.2);
    transition: all 0.3s ease;
  }
  
  /* Idea card specific styling */
  .idea-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 1rem;
    padding-bottom: 0.75rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }
  
  .idea-label {
    font-size: 0.9rem;
    text-transform: uppercase;
    color: #a78bfa;
    letter-spacing: 0.5px;
  }
  
  .idea-stars {
    color: #fcd34d;
  }
  
  .idea-content {
    margin-bottom: 1.5rem;
  }
  
  .idea-content h3 {
    font-size: 1.25rem;
    margin-bottom: 0.5rem;
  }
  
  .idea-footer {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 1.5rem;
    font-size: 0.9rem;
    color: rgba(255, 255, 255, 0.7);
  }
  
  .idea-avatar {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: linear-gradient(45deg, #7c3aed, #a78bfa);
  }
  
  .add-idea-btn {
    width: 100%;
    background: rgba(124, 58, 237, 0.1);
    color: #a78bfa;
    border: 1px solid rgba(124, 58, 237, 0.3);
    padding: 0.75rem;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s ease;
    font-weight: 500;
  }
  
  .add-idea-btn:hover {
    background: rgba(124, 58, 237, 0.2);
    box-shadow: 0 0 15px rgba(124, 58, 237, 0.3);
  }
  
  /* Vote progress styling */
  .progress-bar-container {
    width: 100%;
    height: 8px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 4px;
    overflow: hidden;
    margin-bottom: 1rem;
  }
  
  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #7c3aed, #3b82f6);
    border-radius: 4px;
  }
  
  .vote-count {
    text-align: right;
    font-size: 0.9rem;
    margin-bottom: 1rem;
    color: rgba(255, 255, 255, 0.7);
  }
  
  .vote-avatars {
    display: flex;
    gap: 0.5rem;
  }
  
  .vote-avatar {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: linear-gradient(45deg, #7c3aed, #3b82f6);
    border: 2px solid rgba(0, 0, 0, 0.2);
  }
  
  /* Draft proposal styling */
  .draft-proposal h3 {
    text-align: center;
    margin-bottom: 1.5rem;
    font-weight: 600;
  }
  
  .proposal-lines {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-bottom: 1.5rem;
  }
  
  .proposal-line {
    height: 8px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 4px;
  }
  
  .proposal-line.short {
    width: 70%;
  }
  
  .budget-box {
    background: rgba(124, 58, 237, 0.1);
    border: 1px solid rgba(124, 58, 237, 0.3);
    border-radius: 8px;
    padding: 0.75rem;
    margin: 1.5rem 0;
    text-align: center;
    color: #a78bfa;
    font-weight: 500;
  }
  
  /* Reward visualization styling */
  .reward-tokens {
    display: flex;
    justify-content: center;
    gap: 2rem;
    margin-bottom: 2rem;
  }
  
  .token {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.5rem;
    font-weight: 700;
  }
  
  .token.euro {
    background: linear-gradient(45deg, #3b82f6, #60a5fa);
    color: white;
    box-shadow: 0 0 20px rgba(59, 130, 246, 0.5);
  }
  
  .token.vcr {
    background: linear-gradient(45deg, #7c3aed, #a78bfa);
    color: white;
    box-shadow: 0 0 20px rgba(124, 58, 237, 0.5);
  }
  
  .ownership-stake {
    background: rgba(124, 58, 237, 0.1);
    border: 1px solid rgba(124, 58, 237, 0.3);
    border-radius: 8px;
    padding: 0.75rem;
    text-align: center;
    color: #a78bfa;
    font-weight: 500;
  }
  
  /* Hominio section styling */
  .hominio-section {
    max-width: 800px;
    margin: 0 auto;
    text-align: center;
    background: linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.5)), 
                radial-gradient(circle at center, rgba(124, 58, 237, 0.2) 0%, rgba(0,0,0,0) 70%);
    border-radius: 16px;
    padding: 2.5rem;
    box-shadow: 0 0 40px rgba(124, 58, 237, 0.2);
  }
  
  .accent-content {
    background: rgba(20, 20, 30, 0.7);
    border-color: rgba(124, 58, 237, 0.3);
    text-align: center;
  }
  
  .accent-content p {
    font-size: 1.25rem;
    line-height: 1.8;
    color: #f0f0f0;
  }
  
  .special-cta {
    margin-top: 2.5rem;
    background: linear-gradient(90deg, rgba(124, 58, 237, 0.1), rgba(59, 130, 246, 0.1));
    border-radius: 12px;
    text-align: center;
    border: none;
    border-left: 4px solid #7c3aed;
  }
  
  .accent-btn {
    background: linear-gradient(90deg, #7c3aed, #3b82f6);
    color: white;
    padding: 0.75rem 2.5rem;
    border-radius: 30px;
    font-weight: 600;
    transition: all 0.3s ease;
    border: none;
    text-decoration: none;
    box-shadow: 0 5px 15px rgba(124, 58, 237, 0.4);
    margin-top: 1.5rem;
    display: inline-block;
  }
  
  .accent-btn:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 20px rgba(124, 58, 237, 0.6);
  }
  
  /* Join section styling */
  .join-section {
    max-width: 800px;
    margin: 0 auto;
    text-align: center;
  }
  
  .revolutionary {
    background: rgba(20, 20, 30, 0.7);
    border-color: rgba(124, 58, 237, 0.3);
    text-align: center;
    padding: 2rem;
  }
  
  .big-text {
    font-size: 1.5rem !important;
    font-weight: 600;
    color: white;
    text-shadow: 0 0 10px rgba(124, 58, 237, 0.5);
  }
  
  .join-cta {
    margin-top: 3rem;
  }
  
  .join-buttons {
    display: flex;
    justify-content: center;
    gap: 1.5rem;
    margin-top: 1.5rem;
    flex-wrap: wrap;
  }
  
  .glow-btn {
    background: linear-gradient(90deg, #7c3aed, #3b82f6);
    color: white;
    padding: 0.75rem 2.5rem;
    border-radius: 30px;
    font-weight: 600;
    border: none;
    text-decoration: none;
    position: relative;
    overflow: hidden;
    z-index: 1;
    box-shadow: 0 0 25px rgba(124, 58, 237, 0.5);
  }
  
  .glow-btn::before {
    content: '';
    position: absolute;
    top: -2px;
    left: -2px;
    right: -2px;
    bottom: -2px;
    background: linear-gradient(90deg, #7c3aed, #3b82f6, #7c3aed);
    z-index: -1;
    border-radius: 32px;
    background-size: 200%;
    animation: glow 3s linear infinite;
  }
  
  @keyframes glow {
    0% {
      background-position: 0% 50%;
    }
    50% {
      background-position: 100% 50%;
    }
    100% {
      background-position: 0% 50%;
    }
  }
  
  .glow-btn:hover {
    transform: translateY(-3px);
    box-shadow: 0 0 35px rgba(124, 58, 237, 0.7);
  }
  
  .secondary {
    background: transparent;
    color: white;
    padding: 0.75rem 2.5rem;
    border-radius: 30px;
    font-weight: 600;
    border: 2px solid rgba(255, 255, 255, 0.3);
    text-decoration: none;
    transition: all 0.3s ease;
  }
  
  .secondary:hover {
    border-color: rgba(255, 255, 255, 0.8);
    background: rgba(255, 255, 255, 0.1);
    transform: translateY(-3px);
  }
  
  /* Modern presentation content */
  .presentation-content {
    background: rgba(20, 20, 30, 0.7);
    text-align: center;
    border-color: rgba(124, 58, 237, 0.2);
  }
  
  .presentation-content p {
    font-size: 1.2rem;
    line-height: 1.8;
    margin-bottom: 1.5rem;
  }
</style>

