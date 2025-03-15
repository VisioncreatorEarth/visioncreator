<script lang="ts">
  import { onMount } from 'svelte';
  import { fade, fly, scale, slide } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';
  
  interface Section {
    id: string;
    title: string;
    subtitle: string;
    content: string[];
    hasListItems?: boolean;
    listItems?: string[];
    callToAction?: string;
    accent?: boolean;
    hasSubslides?: boolean;
    subslides?: Subslide[];
  }
  
  interface Subslide {
    id: string;
    title: string;
    content: string;
  }
  
  // Updated content for each slide
  const sections: Section[] = [
    {
      id: 'outdated',
      title: 'The Outdated Nature of Work',
      subtitle: "In today's digital age, traditional work models are hopelessly outdated.",
      content: [
        "Employee: You trade time for money with no ownership or freedom.",
        "Self-Employed: You gain independence but remain chained to trading time for money, with endless stress."
      ],
      listItems: [],
      callToAction: "Neither path fits your life in the modern world. You deserve better.",
      accent: true
    },
    {
      id: 'choice',
      title: 'A Miserable Choice',
      subtitle: "You face a dilemma:",
      content: [
        "Employee: Create value for someone else, never fully realizing your potential.",
        "Self-Employed: Shoulder overwhelming responsibility with little time to breathe."
      ],
      callToAction: "Neither option feels fulfilling in the digital age. It's time for a new way forward."
    },
    {
      id: 'why',
      title: 'Why This Matters',
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
      title: 'A New Way Forward',
      subtitle: "",
      content: [
        "Imagine a work model that lets you build assets, collaborate freely, and enjoy income that flows without constant work. Visioncreator is this new way—a path to ownership, freedom, and fulfillment for you."
      ],
      accent: true
    },
    {
      id: 'deserve',
      title: 'What You Deserve',
      subtitle: "You deserve an organisation form that feels like home. It should offer:",
      content: [],
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
      id: 'how-works',
      title: 'A New Way to Work and Live',
      subtitle: "",
      content: [
        "Imagine being a co-owner, not just a participant. Visioncreator is a Decentralized Autonomous Organization where power belongs to everyone. You propose ideas, vote on decisions, and shape our future together—no bosses, just collective wisdom. Your voice matters in every feature, resource, and goal we set. This isn't just a platform; it's a revolution in collaborative work and life."
      ],
      hasListItems: false,
      accent: true
    },
    {
      id: 'dao',
      title: 'Got an Idea? Share It!',
      subtitle: "",
      content: [
        "Have an idea or a way to make something better? Post it on our idea board! Whether it's a new feature or a small tweak, this is your chance to shape Visioncreator."
      ],
      hasListItems: false
    },
    {
      id: 'implementation',
      title: 'Discuss and Vote',
      subtitle: "",
      content: [
        "Your idea kicks off a conversation. We discuss it together as a collective, share feedback, and then vote. Get enough votes, and your idea turns into a draft—ready to take the next step."
      ],
      hasListItems: false
    },
    {
      id: 'your-role',
      title: 'From Draft to Reality',
      subtitle: "",
      content: [
        "Now it's yours to run with. Define your draft, set a budget (say, 1500 euros), and take full responsibility to execute it. You're the leader, backed by the community."
      ],
      hasListItems: false
    },
    {
      id: 'lifestyle',
      title: 'Success Pays Off',
      subtitle: "",
      content: [
        "Once it's done, we vote again. If it's a win, you get paid—not just in euros, but also in token shares that boost your ownership in Visioncreator."
      ],
      hasListItems: false
    },
    {
      id: 'hominio-vision',
      title: 'Introducing Hominio',
      subtitle: "",
      content: [
        "We're building our first project with this new kind of organization form.",
        "Hominio is where we begin our journey together."
      ],
      callToAction: "Be among the founding members.",
      accent: true,
      hasListItems: false
    },
    {
      id: 'join',
      title: 'Join the Revolution',
      subtitle: "",
      content: [
        "Ready to stop building for others and start building for yourself?"
      ],
      callToAction: "Join Visioncreator today and step into the future of work.",
      accent: true
    }
  ];
  
  // Reactive variables
  let currentSection = 0;
  let scrollY = 0;
  let windowHeight = 0;
  let documentHeight = 0;
  let sectionElements: HTMLElement[] = [];
  let progressPercentage = 0;
  let showWelcome = true;
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
  
  <!-- Navigation -->
  <nav class="navigation" class:hidden={showWelcome}>
    <ul>
      {#each sections as section, i}
        <li class:active={i === currentSection}>
          <a 
            href="#{section.id}"
            on:click|preventDefault={() => scrollToSection(i)}
            aria-label="Navigate to {section.title}"
          >
            <span class="nav-indicator"></span>
            <span class="nav-text">{section.title}</span>
          </a>
        </li>
      {/each}
    </ul>
  </nav>
  
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
      <div class="starfield">
        <div class="node-network"></div>
      </div>
      
      <div class="welcome-content">
        <div class="welcome-title" in:fade={{ duration: 800, delay: 200 }}>
          <div class="title-line">Visioncreator</div>
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
    {#each sections as section, i}
      <section 
        id={section.id} 
        class="section"
        class:active={i === currentSection}
        class:accent={section.accent}
        style="--section-index: {i}"
      >
        <div class="starfield">
          <div class="node-network"></div>
        </div>
        
        <div class="section-content">
          <!-- Title -->
          <h2 in:fly={{ y: 20, duration: 800, delay: 100 }}>{section.title}</h2>
          
          <!-- Subtitle if exists -->
          {#if section.subtitle}
            <p class="subtitle" in:fly={{ y: 20, duration: 800, delay: 200 }}>{section.subtitle}</p>
          {/if}
          
          <!-- Process visualization for slides 7-10 (idea board process) -->
          {#if ['dao', 'implementation', 'your-role', 'lifestyle'].includes(section.id)}
            <div 
              class="process-visual"
              in:fade={{ duration: 600, delay: 300 }}
            >
              <div class="process-timeline">
                <div class="timeline-track"></div>
                <div 
                  class="timeline-progress" 
                  style="width: {['dao', 'implementation', 'your-role', 'lifestyle'].indexOf(section.id) * 33 + 33}%"
                  in:slide={{ duration: 800, delay: 400, easing: quintOut }}
                ></div>
                
                <!-- Process steps -->
                <div class="timeline-steps">
                  <div class="step" class:active={processStates[section.id] === 'idea' || ['implementation', 'your-role', 'lifestyle'].includes(section.id)}>
                    <div class="step-icon">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="12"></line>
                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                      </svg>
                    </div>
                    <span class="step-label">Idea</span>
                  </div>
                  <div class="step" class:active={processStates[section.id] === 'vote' || ['your-role', 'lifestyle'].includes(section.id)}>
                    <div class="step-icon">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    </div>
                    <span class="step-label">Vote</span>
                  </div>
                  <div class="step" class:active={processStates[section.id] === 'draft' || section.id === 'lifestyle'}>
                    <div class="step-icon">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                        <line x1="16" y1="13" x2="8" y2="13"></line>
                        <line x1="16" y1="17" x2="8" y2="17"></line>
                        <polyline points="10 9 9 9 8 9"></polyline>
                      </svg>
                    </div>
                    <span class="step-label">Draft</span>
                  </div>
                  <div class="step" class:active={processStates[section.id] === 'reward'}>
                    <div class="step-icon">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="8" r="7"></circle>
                        <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline>
                      </svg>
                    </div>
                    <span class="step-label">Reward</span>
                  </div>
                </div>
              </div>
              
              <!-- Stage-specific visualization -->
              {#if section.id === 'dao'}
                <div class="idea-board-visual" in:fade={{ duration: 600, delay: 600 }}>
                  <div class="idea-card">
                    <div class="idea-header">
                      <span class="idea-tag">Idea</span>
                      <span class="idea-votes">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                        </svg>
                        <span>5</span>
                      </span>
                    </div>
                    <div class="idea-title">Improve the onboarding process</div>
                    <div class="idea-author">
                      <div class="author-avatar"></div>
                      <span>Posted by you</span>
                    </div>
                  </div>
                  <div class="add-idea-button">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <line x1="12" y1="5" x2="12" y2="19"></line>
                      <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                    <span>Add New Idea</span>
                  </div>
                </div>
              {/if}
              
              {#if section.id === 'implementation'}
                <div class="vote-visual" in:fade={{ duration: 600, delay: 600 }}>
                  <div class="vote-progress">
                    <div class="vote-bar">
                      <div class="vote-fill" style="width: 75%" in:slide={{ duration: 1000, delay: 800, easing: quintOut }}></div>
                    </div>
                    <div class="vote-count">
                      <span>75%</span>
                      <span class="vote-detail">9 of 12 votes</span>
                    </div>
                  </div>
                  <div class="vote-avatars">
                    {#each Array(4) as _, i}
                      <div 
                        class="voter-avatar"
                        style="--delay: {i * 200}ms"
                        in:scale={{ duration: 400, delay: 1000 + (i * 200), start: 0.5 }}
                      ></div>
                    {/each}
                  </div>
                </div>
              {/if}
              
              {#if section.id === 'your-role'}
                <div class="draft-visual" in:fade={{ duration: 600, delay: 600 }}>
                  <div class="draft-document">
                    <div class="draft-header">Draft Proposal</div>
                    <div class="draft-content">
                      <div class="draft-line" in:slide={{ duration: 400, delay: 700 }}></div>
                      <div class="draft-line" in:slide={{ duration: 400, delay: 800 }}></div>
                      <div class="draft-line short" in:slide={{ duration: 400, delay: 900 }}></div>
                      <div class="draft-budget" in:fade={{ duration: 600, delay: 1200 }}>
                        Budget: €1500
                      </div>
                      <div class="draft-line" in:slide={{ duration: 400, delay: 1300 }}></div>
                      <div class="draft-line short" in:slide={{ duration: 400, delay: 1400 }}></div>
                    </div>
                  </div>
                </div>
              {/if}
              
              {#if section.id === 'lifestyle'}
                <div class="reward-visual" in:fade={{ duration: 600, delay: 600 }}>
                  <div class="reward-tokens">
                    <div class="token euro" in:scale={{ duration: 600, delay: 700, start: 0.5 }}>€</div>
                    <div class="token vcr" in:scale={{ duration: 600, delay: 900, start: 0.5 }}>VCR</div>
                  </div>
                  <div class="ownership-increase" in:fade={{ duration: 800, delay: 1200 }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
                      <polyline points="17 6 23 6 23 12"></polyline>
                    </svg>
                    <span>Ownership Stake</span>
                  </div>
                </div>
              {/if}
            </div>
          {/if}
          
          <!-- Hominio special visualization -->
          {#if section.id === 'hominio-vision'}
            <div class="hominio-minimal" in:fade={{ duration: 600, delay: 300 }}>
              <div class="hominio-logo-simple" in:scale={{ duration: 800, delay: 400, start: 0.8 }}>
                <img src="data:image/png;base64,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" alt="Visioncreator Logo" class="logo-image" />
              </div>
            </div>
          {/if}
          
          <!-- Regular content paragraphs if any -->
          {#if section.content && section.content.length > 0}
            {#each section.content as paragraph, pIndex}
              <p 
                class="content-paragraph"
                in:fly={{ y: 20, duration: 800, delay: 300 + (pIndex * 100) }}
              >{paragraph}</p>
            {/each}
          {/if}
          
          <!-- Subslides if any -->
          {#if section.hasSubslides && section.subslides && section.subslides.length > 0}
            <div class="subslides-container">
              {#each section.subslides as subslide, subIndex}
                {#if currentSubslideIndices[section.id] === subIndex}
                  <div class="subslide" in:fade={{ duration: 400 }}>
                    <h3 class="subslide-title">{subslide.title}</h3>
                    <p class="subslide-content">{subslide.content}</p>
                  </div>
                {/if}
              {/each}
              
              <!-- Subslide navigation -->
              <div class="subslide-nav">
                {#if currentSubslideIndices[section.id] > 0}
                  <button class="subslide-nav-button prev" on:click={() => prevSubslide(section.id)}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <polyline points="15 18 9 12 15 6"></polyline>
                    </svg>
                  </button>
                {/if}
                
                <div class="subslide-indicators">
                  {#each section.subslides as _, dotIndex}
                    <span 
                      class="subslide-dot" 
                      class:active={currentSubslideIndices[section.id] === dotIndex}
                    ></span>
                  {/each}
                </div>
                
                {#if currentSubslideIndices[section.id] < section.subslides.length - 1}
                  <button class="subslide-nav-button next" on:click={() => nextSubslide(section.id)}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                  </button>
                {/if}
              </div>
            </div>
          {/if}
          
          <!-- List items if any (only for non-subslide sections now) -->
          {#if !section.hasSubslides && section.hasListItems && section.listItems && section.listItems.length > 0}
            {#if section.id === 'how-works'}
              <div class="radial-container">
                <div class="center-point">
                  <span class="center-text">Visioncreator</span>
                </div>
                
                {#each section.listItems as item, itemIndex}
                  <div 
                    class="radial-item"
                    style="--item-index: {itemIndex}; --total-items: {section.listItems.length};"
                    in:fly={{ y: 20, duration: 800, delay: 300 + (itemIndex * 150) }}
                  >
                    <div class="ray"></div>
                    <div class="point-content">{item}</div>
                  </div>
                {/each}
              </div>
            {:else if section.id === 'hominio'}
              <ul class="hominio-features">
                {#each section.listItems as item, itemIndex}
                  <li 
                    in:fly={{ y: 20, duration: 800, delay: 2400 + (itemIndex * 100) }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    <span>{item}</span>
                  </li>
                {/each}
              </ul>
            {:else}
              <ul class="content-list">
                {#each section.listItems as item, itemIndex}
                  <li 
                    in:fly={{ y: 20, duration: 800, delay: 300 + (itemIndex * 100) }}
                  >{item}</li>
                {/each}
              </ul>
            {/if}
          {/if}
          
          <!-- Call to action if exists -->
          {#if section.callToAction}
            <p 
              class="call-to-action"
              in:fly={{ y: 20, duration: 800, delay: 500 }}
            >{section.callToAction}</p>
          {/if}
          
          <!-- Join button on the last slide -->
          {#if section.id === 'join'}
            <a 
              href="https://visioncreator.io" 
              target="_blank" 
              rel="noopener noreferrer"
              class="action-button"
              in:scale={{ duration: 600, delay: 700, start: 0.8 }}
            >
              Join Now
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </a>
          {/if}
          
          {#if i < sections.length - 1}
            <button class="scroll-hint" on:click={() => scrollToSection(i + 1)}>
              <span class="scroll-dot"></span>
              <span class="scroll-dot"></span>
              <span class="scroll-dot"></span>
            </button>
          {/if}
        </div>
      </section>
    {/each}
  </main>
</div>

<style>
  :global(html) {
    scroll-behavior: smooth;
  }
  
  :global(body) {
    margin: 0;
    padding: 0;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
    background-color: #000;
    color: #ffffff;
    overflow-x: hidden;
  }
  
  .landing-page {
    position: relative;
    width: 100%;
    overflow-x: hidden;
  }
  
  /* Progress bar */
  .progress-container {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 2px;
    z-index: 1000;
    background: rgba(64, 64, 64, 0.3);
  }
  
  .progress-bar {
    height: 100%;
    background: rgba(255, 255, 255, 0.6);
    transition: width 0.1s;
  }
  
  /* Navigation */
  .navigation {
    position: fixed;
    top: 50%;
    right: 2rem;
    transform: translateY(-50%);
    z-index: 900;
    transition: opacity 0.3s ease;
  }
  
  .navigation.hidden {
    opacity: 0;
    pointer-events: none;
  }
  
  .navigation ul {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  
  .navigation li {
    position: relative;
  }
  
  .navigation a {
    background: none;
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    padding: 0.3rem;
    transition: all 0.3s ease;
    color: rgba(255, 255, 255, 0.4);
    text-decoration: none;
  }
  
  .navigation a:hover {
    color: rgba(255, 255, 255, 0.8);
  }
  
  .navigation .nav-indicator {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.3);
    margin-right: 0.5rem;
    transition: all 0.3s ease;
  }
  
  .navigation .nav-text {
    opacity: 0;
    transform: translateX(0.5rem);
    transition: all 0.3s ease;
    white-space: nowrap;
    font-size: 0.875rem;
    font-weight: 500;
  }
  
  .navigation a:hover .nav-text {
    opacity: 1;
    transform: translateX(0);
  }
  
  .navigation li.active .nav-indicator {
    background: rgba(255, 255, 255, 0.9);
    box-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
  }
  
  .navigation li.active a {
    color: rgba(255, 255, 255, 0.9);
  }
  
  /* Sections container */
  .sections-container {
    width: 100%;
  }
  
  /* Sections */
  .section {
    min-height: 100vh;
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    overflow: hidden;
    padding: 1rem 0;
  }
  
  /* Starfield background */
  .starfield {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(135deg, #000000 0%, #0a0a14 100%);
    overflow: hidden;
    z-index: 1;
  }
  
  .node-network {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-image: radial-gradient(1px 1px at 20px 30px, rgba(255, 255, 255, 0.3), rgba(0, 0, 0, 0)),
                      radial-gradient(1px 1px at 40px 70px, rgba(255, 255, 255, 0.3), rgba(0, 0, 0, 0)),
                      radial-gradient(1px 1px at 50px 160px, rgba(255, 255, 255, 0.3), rgba(0, 0, 0, 0)),
                      radial-gradient(1px 1px at 90px 40px, rgba(255, 255, 255, 0.3), rgba(0, 0, 0, 0)),
                      radial-gradient(1px 1px at 130px 80px, rgba(255, 255, 255, 0.3), rgba(0, 0, 0, 0)),
                      radial-gradient(1px 1px at 160px 120px, rgba(255, 255, 255, 0.3), rgba(0, 0, 0, 0));
    background-repeat: repeat;
    background-size: 200px 200px;
  }
  
  .section.accent .starfield {
    background: linear-gradient(135deg, #000000 0%, #0a1025 100%);
  }
  
  /* Section content */
  .section-content {
    position: relative;
    z-index: 10;
    max-width: 800px;
    text-align: center;
    padding: 2rem;
  }
  
  .section-content h2 {
    font-size: 1.5rem;
    font-weight: 300;
    margin-bottom: 2rem;
    color: rgba(255, 255, 255, 0.5);
    text-transform: uppercase;
    letter-spacing: 0.1em;
  }
  
  .section-content .subtitle {
    font-size: 2.5rem;
    font-weight: 600;
    line-height: 1.2;
    margin: 0 0 2rem;
    color: rgba(255, 255, 255, 0.9);
  }
  
  .section.accent .section-content .subtitle {
    background: linear-gradient(to right, #ffffff, #b3b3ff);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
  }
  
  .content-paragraph {
    font-size: 1.5rem;
    line-height: 1.5;
    margin: 1.5rem 0;
    color: rgba(255, 255, 255, 0.8);
  }
  
  .content-list {
    list-style: none;
    padding: 0;
    margin: 2rem 0;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    text-align: left;
  }
  
  .content-list li {
    font-size: 1.25rem;
    line-height: 1.5;
    color: rgba(255, 255, 255, 0.8);
    padding: 0.75rem 1rem;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 0.5rem;
    border-left: 3px solid rgba(255, 255, 255, 0.2);
    transition: all 0.3s ease;
  }
  
  .content-list li:hover {
    background: rgba(255, 255, 255, 0.08);
    border-left-color: rgba(255, 255, 255, 0.4);
    transform: translateX(5px);
  }
  
  .call-to-action {
    font-size: 1.75rem;
    font-weight: 500;
    line-height: 1.4;
    margin: 2rem 0 1rem;
    color: rgba(255, 255, 255, 0.9);
    font-style: italic;
  }
  
  .section.accent .call-to-action {
    background: linear-gradient(to right, #ffffff, #b3b3ff);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
  }
  
  /* Scroll hint */
  .scroll-hint {
    position: absolute;
    bottom: 2rem;
    left: 50%;
    transform: translateX(-50%);
    background: none;
    border: none;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.3rem;
    opacity: 0.6;
    transition: opacity 0.3s ease;
  }
  
  .scroll-hint:hover {
    opacity: 1;
  }
  
  .scroll-dot {
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background-color: white;
  }
  
  .scroll-hint .scroll-dot:nth-child(1) {
    animation: pulseDown 1.5s infinite;
  }
  
  .scroll-hint .scroll-dot:nth-child(2) {
    animation: pulseDown 1.5s infinite 0.2s;
  }
  
  .scroll-hint .scroll-dot:nth-child(3) {
    animation: pulseDown 1.5s infinite 0.4s;
  }
  
  @keyframes pulseDown {
    0%, 100% {
      opacity: 0;
      transform: translateY(-5px);
    }
    50% {
      opacity: 1;
      transform: translateY(0);
    }
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
  }
  
  .welcome-content p {
    font-size: 1.5rem;
    color: rgba(255, 255, 255, 0.6);
    margin-bottom: 3rem;
    letter-spacing: 0.05em;
  }
  
  /* Buttons */
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
  
  /* Media queries */
  @media (max-width: 768px) {
    .navigation {
      bottom: 1rem;
      top: auto;
      right: 50%;
      transform: translateX(50%);
    }
    
    .navigation ul {
      flex-direction: row;
      flex-wrap: wrap;
      justify-content: center;
      max-width: 90vw;
    }
    
    .navigation .nav-text {
      display: none;
    }
    
    .section-content .subtitle {
      font-size: 1.75rem;
    }
    
    .content-paragraph {
      font-size: 1.25rem;
    }
    
    .content-list li {
      font-size: 1.1rem;
    }
    
    .welcome-title {
      font-size: 3.5rem;
    }
    
    .scroll-hint {
      bottom: 1rem;
    }
  }
  
  /* Subslide styles */
  .subslides-container {
    position: relative;
    margin: 2rem 0;
    min-height: 200px;
  }
  
  .subslide {
    text-align: center;
    padding: 1rem;
    margin-bottom: 2rem;
  }
  
  .subslide-title {
    font-size: 1.75rem;
    font-weight: 600;
    margin-bottom: 1rem;
    color: rgba(255, 255, 255, 0.9);
    background: linear-gradient(to right, #ffffff, #b3b3ff);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
    text-shadow: 0 0 15px rgba(179, 179, 255, 0.5);
  }
  
  .subslide-content {
    font-size: 1.25rem;
    line-height: 1.5;
    color: rgba(255, 255, 255, 0.8);
    text-shadow: 0 0 10px rgba(255, 255, 255, 0.3);
  }
  
  .subslide-nav {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 1rem;
    margin-top: 1rem;
  }
  
  .subslide-nav-button {
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 50%;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.3s ease;
  }
  
  .subslide-nav-button:hover {
    background: rgba(255, 255, 255, 0.2);
  }
  
  .subslide-indicators {
    display: flex;
    gap: 0.5rem;
  }
  
  .subslide-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.3);
    transition: all 0.3s ease;
  }
  
  .subslide-dot.active {
    background: rgba(255, 255, 255, 0.9);
    box-shadow: 0 0 5px rgba(255, 255, 255, 0.5);
  }
  
  /* Media queries */
  @media (max-width: 768px) {
    .subslide-title {
      font-size: 1.5rem;
    }
    
    .subslide-content {
      font-size: 1.1rem;
    }
  }
  
  /* Radial list visualization */
  .radial-container {
    position: relative;
    min-height: 400px;
    margin: 2rem auto;
    max-width: 900px;
  }
  
  .center-point {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 120px;
    height: 120px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10;
    box-shadow: 0 0 30px rgba(255, 255, 255, 0.2);
    animation: pulse 3s infinite alternate;
  }
  
  .center-text {
    font-size: 1rem;
    font-weight: 600;
    color: white;
    background: linear-gradient(to right, #ffffff, #b3b3ff);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
    text-shadow: 0 0 10px rgba(179, 179, 255, 0.6);
  }
  
  .radial-item {
    position: absolute;
    top: 50%;
    left: 50%;
    --angle: calc(360deg / var(--total-items) * var(--item-index));
    --distance: 230px;
    transform: 
      rotate(var(--angle)) 
      translate(var(--distance)) 
      rotate(calc(-1 * var(--angle)));
    width: 200px;
  }
  
  .ray {
    position: absolute;
    top: 50%;
    left: 0;
    width: var(--distance);
    height: 1px;
    background: linear-gradient(to left, rgba(255, 255, 255, 0.5), rgba(255, 255, 255, 0));
    transform: translateY(-50%) translateX(-100%);
    opacity: 0.5;
    animation: glow 4s infinite alternate;
    animation-delay: calc(var(--item-index) * 0.5s);
  }
  
  .point-content {
    position: relative;
    padding: 0.75rem 1rem;
    background: rgba(255, 255, 255, 0.03);
    border-radius: 0.5rem;
    width: 200px;
    font-size: 1rem;
    color: rgba(255, 255, 255, 0.9);
    text-shadow: 0 0 10px rgba(255, 255, 255, 0.3);
    text-align: center;
    transition: all 0.3s ease;
  }
  
  .point-content:hover {
    background: rgba(255, 255, 255, 0.07);
    transform: scale(1.05);
    text-shadow: 0 0 15px rgba(255, 255, 255, 0.5);
  }
  
  @keyframes pulse {
    0% {
      box-shadow: 0 0 20px rgba(255, 255, 255, 0.2);
      transform: translate(-50%, -50%) scale(1);
    }
    100% {
      box-shadow: 0 0 40px rgba(255, 255, 255, 0.4);
      transform: translate(-50%, -50%) scale(1.05);
    }
  }
  
  @keyframes glow {
    0% {
      opacity: 0.3;
    }
    100% {
      opacity: 0.7;
    }
  }
  
  /* Media queries */
  @media (max-width: 768px) {
    .radial-container {
      min-height: auto;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }
    
    .center-point {
      position: relative;
      transform: none;
      top: auto;
      left: auto;
      margin: 1rem auto;
    }
    
    .radial-item {
      position: relative;
      transform: none;
      top: auto;
      left: auto;
      width: 100%;
    }
    
    .ray {
      display: none;
    }
    
    .point-content {
      width: 100%;
    }
  }
  
  /* Process visualization styles */
  .process-visual {
    margin: 1.5rem 0;
    padding: 0.5rem;
    width: 100%;
  }
  
  .process-timeline {
    position: relative;
    height: 2rem;
    margin: 2rem auto;
    max-width: 80%;
  }
  
  .timeline-track {
    position: absolute;
    top: 50%;
    left: 0;
    width: 100%;
    height: 2px;
    background: rgba(255, 255, 255, 0.2);
    transform: translateY(-50%);
  }
  
  .timeline-progress {
    position: absolute;
    top: 50%;
    left: 0;
    height: 2px;
    background: linear-gradient(to right, rgba(255, 255, 255, 0.7), rgba(179, 179, 255, 0.7));
    transform: translateY(-50%);
    box-shadow: 0 0 8px rgba(179, 179, 255, 0.4);
  }
  
  .timeline-steps {
    position: relative;
    display: flex;
    justify-content: space-between;
    width: 100%;
  }
  
  .step {
    display: flex;
    flex-direction: column;
    align-items: center;
    color: rgba(255, 255, 255, 0.5);
    transition: all 0.3s ease;
  }
  
  .step.active {
    color: rgba(255, 255, 255, 0.9);
  }
  
  .step-icon {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 0.5rem;
    transition: all 0.3s ease;
  }
  
  .step.active .step-icon {
    background: rgba(255, 255, 255, 0.2);
    border-color: rgba(255, 255, 255, 0.4);
    box-shadow: 0 0 12px rgba(255, 255, 255, 0.3);
  }
  
  .step-label {
    font-size: 0.8rem;
    font-weight: 500;
  }
  
  /* Idea board visualization */
  .idea-board-visual {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin: 2rem 0;
    gap: 1rem;
  }
  
  .idea-card {
    width: 280px;
    background: rgba(255, 255, 255, 0.07);
    border-radius: 8px;
    padding: 1rem;
    border: 1px solid rgba(255, 255, 255, 0.1);
  }
  
  .idea-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
  }
  
  .idea-tag {
    font-size: 0.7rem;
    background: rgba(179, 179, 255, 0.2);
    padding: 0.2rem 0.5rem;
    border-radius: 12px;
    color: rgba(255, 255, 255, 0.8);
  }
  
  .idea-votes {
    display: flex;
    align-items: center;
    gap: 0.3rem;
    font-size: 0.8rem;
    color: rgba(255, 255, 255, 0.7);
  }
  
  .idea-title {
    font-size: 1rem;
    font-weight: 500;
    margin-bottom: 1rem;
    color: rgba(255, 255, 255, 0.9);
  }
  
  .idea-author {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.7rem;
    color: rgba(255, 255, 255, 0.6);
  }
  
  .author-avatar {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.2);
  }
  
  .add-idea-button {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 20px;
    color: rgba(255, 255, 255, 0.8);
    cursor: pointer;
    transition: all 0.3s ease;
  }
  
  .add-idea-button:hover {
    background: rgba(255, 255, 255, 0.15);
    transform: translateY(-2px);
  }
  
  /* Vote visualization */
  .vote-visual {
    margin: 2rem auto;
    width: 280px;
  }
  
  .vote-progress {
    margin-bottom: 1.5rem;
  }
  
  .vote-bar {
    height: 8px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 4px;
    overflow: hidden;
    margin-bottom: 0.5rem;
  }
  
  .vote-fill {
    height: 100%;
    background: linear-gradient(to right, rgba(255, 255, 255, 0.7), rgba(179, 179, 255, 0.7));
    border-radius: 4px;
  }
  
  .vote-count {
    display: flex;
    justify-content: space-between;
    font-size: 0.8rem;
    color: rgba(255, 255, 255, 0.7);
  }
  
  .vote-detail {
    font-size: 0.7rem;
    opacity: 0.8;
  }
  
  .vote-avatars {
    display: flex;
    justify-content: center;
    margin-top: 1rem;
  }
  
  .voter-avatar {
    width: 30px;
    height: 30px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.3);
    margin-left: -10px;
    animation: pulseAvatar 3s infinite alternate;
    animation-delay: var(--delay, 0ms);
  }
  
  @keyframes pulseAvatar {
    0% {
      box-shadow: 0 0 0 rgba(255, 255, 255, 0);
    }
    100% {
      box-shadow: 0 0 10px rgba(255, 255, 255, 0.3);
    }
  }
  
  /* Draft visualization */
  .draft-visual {
    margin: 2rem auto;
    width: 280px;
  }
  
  .draft-document {
    background: rgba(255, 255, 255, 0.07);
    border-radius: 8px;
    padding: 1rem;
    border: 1px solid rgba(255, 255, 255, 0.1);
  }
  
  .draft-header {
    font-size: 0.9rem;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.8);
    padding-bottom: 0.5rem;
    margin-bottom: 0.8rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }
  
  .draft-content {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
  }
  
  .draft-line {
    height: 8px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 4px;
    width: 100%;
  }
  
  .draft-line.short {
    width: 60%;
  }
  
  .draft-budget {
    font-size: 0.9rem;
    color: rgba(179, 179, 255, 0.9);
    background: rgba(179, 179, 255, 0.1);
    padding: 0.5rem;
    border-radius: 4px;
    margin: 0.5rem 0;
    text-align: center;
  }
  
  /* Reward visualization */
  .reward-visual {
    margin: 2rem auto;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1.5rem;
  }
  
  .reward-tokens {
    display: flex;
    gap: 2rem;
  }
  
  .token {
    width: 60px;
    height: 60px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.3rem;
    font-weight: 600;
    box-shadow: 0 0 15px rgba(255, 255, 255, 0.2);
  }
  
  .token.euro {
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.15), rgba(255, 255, 255, 0.05));
    border: 2px solid rgba(255, 255, 255, 0.3);
    color: rgba(255, 255, 255, 0.9);
  }
  
  .token.vcr {
    background: linear-gradient(135deg, rgba(179, 179, 255, 0.2), rgba(179, 179, 255, 0.05));
    border: 2px solid rgba(179, 179, 255, 0.3);
    color: rgba(179, 179, 255, 0.9);
  }
  
  .ownership-increase {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: rgba(255, 255, 255, 0.8);
    font-size: 0.9rem;
    padding: 0.5rem 1rem;
    background: rgba(255, 255, 255, 0.07);
    border-radius: 20px;
    border: 1px solid rgba(255, 255, 255, 0.1);
  }
  
  .ownership-increase svg {
    color: rgba(179, 179, 255, 0.9);
  }
  
  /* Media queries for process visualization */
  @media (max-width: 768px) {
    .process-timeline {
      max-width: 95%;
    }
    
    .step-label {
      font-size: 0.7rem;
    }
    
    .step-icon {
      width: 24px;
      height: 24px;
    }
  }
  
  /* Simplified Hominio styles */
  .hominio-minimal {
    display: flex;
    justify-content: center;
    align-items: center;
    margin: 3rem 0;
  }
  
  .hominio-logo-simple {
    width: 140px;
    height: 140px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 4rem;
    font-weight: 300;
    color: rgba(255, 255, 255, 0.9);
    box-shadow: 0 0 20px rgba(179, 179, 255, 0.2);
    overflow: hidden;
  }
  
  .logo-image {
    max-width: 80%;
    max-height: 80%;
    object-fit: contain;
  }
  
  /* Vision steps styles */
  .hominio-vision {
    margin: 3rem 0;
  }
  
  .vision-steps {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    flex-wrap: wrap;
  }
  
  .vision-step {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
  }
  
  .step-number {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.2rem;
    font-weight: 400;
    color: rgba(255, 255, 255, 0.9);
  }
  
  .step-label {
    font-size: 0.9rem;
    color: rgba(255, 255, 255, 0.7);
  }
  
  .step-arrow {
    color: rgba(255, 255, 255, 0.4);
    font-size: 1.5rem;
    margin: 0 0.5rem;
  }
  
  @media (max-width: 768px) {
    .vision-steps {
      flex-direction: column;
      gap: 1.5rem;
    }
    
    .step-arrow {
      transform: rotate(90deg);
      margin: 0.5rem 0;
    }
  }
  
  /* Remove the old complex Hominio styles, keeping only what we need */
  .hominio-visual, .hominio-logo-container, .milestone-timeline, 
  .founders-container, .hominio-features, .timeline-connector,
  .milestone, .milestone-dot, .milestone-label, .founders-label,
  .founders-avatars, .founder-avatar, .hominio-logo, .logo-rays {
    /* Override with simpler styles or set to display: none */
    display: none;
  }
  
  /* Keep necessary animations but simplify */
  @keyframes pulseLogo {
    0% {
      box-shadow: 0 0 20px rgba(179, 179, 255, 0.2);
    }
    100% {
      box-shadow: 0 0 30px rgba(179, 179, 255, 0.3);
    }
  }
</style> 