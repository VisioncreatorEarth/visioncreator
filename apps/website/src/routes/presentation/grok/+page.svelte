<script lang="ts">
  import { onMount } from 'svelte';
  import { fade, fly, scale } from 'svelte/transition';
  
  interface Section {
    id: string;
    title: string;
    subtitle: string;
    content: string[];
    hasListItems?: boolean;
    listItems?: string[];
    callToAction?: string;
    accent?: boolean;
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
      subtitle: "You deserve a workplace that feels like home. It should offer:",
      content: [],
      hasListItems: true,
      listItems: [
        "Belonging: Be part of a community that values you.",
        "Autonomy & Agency: Pursue your purpose without restrictions.",
        "Financial Security: Build lasting value for yourself and others.",
        "Authentic Expression: Align your work with your true vision."
      ]
    },
    {
      id: 'how-works',
      title: 'How Visioncreator Works',
      subtitle: "Visioncreator is a collaborative ecosystem where:",
      content: [],
      hasListItems: true,
      listItems: [
        "You contribute based on your skills and passions.",
        "Ownership is collective through tokenized shares.",
        "Decision-making is democratic and transparent.",
        "Innovation comes from community proposals.",
        "Your contributions are tracked and rewarded fairly."
      ]
    },
    {
      id: 'dao',
      title: 'The DAO Framework',
      subtitle: "Visioncreator uses a DAO (Decentralized Autonomous Organization) framework:",
      content: [],
      hasListItems: true,
      listItems: [
        "Propose & Vote: You shape the future with democratic decisions.",
        "Own Collectively: VCR tokens give you real legal stakes.",
        "Innovate Together: You drive innovation through proposals.",
        "Earn Fairly: Transparent rewards in tokens and stablecoins.",
        "Quadratic Voting: Ensures fairness, no matter your token holdings."
      ]
    },
    {
      id: 'implementation',
      title: 'Implementation Details',
      subtitle: "Visioncreator is live:",
      content: [],
      hasListItems: true,
      listItems: [
        "A tokenized German GmbH on the tokenize-it platform.",
        "VCR token represents real legal ownership.",
        "€365 one-time buy-in gives you tokens and a stake.",
        "Community pool rewards your contributions.",
        "Quadratic voting keeps decisions fair.",
        "At 10,000 investors, it becomes a fully decentralized DAO."
      ]
    },
    {
      id: 'your-role',
      title: 'Your Role in Visioncreator',
      subtitle: "As a Visioncreator, you can:",
      content: [],
      hasListItems: true,
      listItems: [
        "Collaborate freely based on your skills and interests.",
        "Own real stakes in the projects you help build.",
        "Shape the future by proposing and voting on ideas.",
        "Earn tokens and stablecoins transparently."
      ],
      callToAction: "You're not just working—you're owning and creating."
    },
    {
      id: 'lifestyle',
      title: 'The Visioncreator Lifestyle',
      subtitle: "Imagine a life where you:",
      content: [],
      hasListItems: true,
      listItems: [
        "Collaborate with a vibrant community of creators.",
        "Build assets that generate income over time.",
        "Enjoy autonomy and financial security.",
        "Express your true self and vision.",
        "Live and work aligned with your values."
      ]
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
  
  // Start presentation and hide welcome screen
  function startPresentation() {
    showWelcome = false;
    setTimeout(() => {
      scrollToSection(0);
    }, 100);
  }
  
  onMount(() => {
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
          
          <!-- Regular content paragraphs if any -->
          {#if section.content && section.content.length > 0}
            {#each section.content as paragraph, pIndex}
              <p 
                class="content-paragraph"
                in:fly={{ y: 20, duration: 800, delay: 300 + (pIndex * 100) }}
              >{paragraph}</p>
            {/each}
          {/if}
          
          <!-- List items if any -->
          {#if section.hasListItems && section.listItems && section.listItems.length > 0}
            <ul class="content-list">
              {#each section.listItems as item, itemIndex}
                <li 
                  in:fly={{ y: 20, duration: 800, delay: 300 + (itemIndex * 100) }}
                >{item}</li>
              {/each}
            </ul>
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
    
    .call-to-action {
      font-size: 1.4rem;
    }
    
    .welcome-title {
      font-size: 3.5rem;
    }
    
    .scroll-hint {
      bottom: 1rem;
    }
  }
</style> 