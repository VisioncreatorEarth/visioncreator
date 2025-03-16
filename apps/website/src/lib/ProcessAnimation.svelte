<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { fade, fly, scale } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';
  
  // Props
  export let step: 'idea' | 'vote' | 'draft' | 'implementation' | 'reward' = 'idea';
  
  // Animation state
  let visible = false;
  let animationPlaying = false;
  let observer: IntersectionObserver;
  let container: HTMLElement;
  
  // Step data
  const steps = {
    idea: {
      icon: 'M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z',
      title: 'Got an Idea? Share It!',
      description: "Have an idea or a way to make something better? Post it on our idea board! Whether it's a new feature or a small tweak, this is your chance to shape Visioncreator."
    },
    vote: {
      icon: 'M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
      title: 'Discuss and Vote',
      description: 'Your idea kicks off a conversation. We discuss it together as a collective, share feedback, and then vote. Get enough votes, and your idea turns into a draft—ready to take the next step.'
    },
    draft: {
      icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z',
      title: 'From Draft to Reality',
      description: "Now it's yours to run with. Define your draft, set a budget (say, 1500 euros), and take full responsibility to execute it. You're the leader, backed by the community."
    },
    implementation: {
      icon: 'M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4',
      title: 'Implementation Phase',
      description: 'With the draft approved, you lead the implementation. Develop the feature or improvement with support from the community and regular progress updates.'
    },
    reward: {
      icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
      title: 'Success Pays Off',
      description: "Once it's done, we vote again. If it's a win, you get paid—not just in euros, but also in token shares that boost your ownership in Visioncreator."
    }
  };
  
  // Paths for animated icons
  const avatarPositions = [
    { x: 20, y: 40 },
    { x: 120, y: 60 },
    { x: 60, y: 90 },
    { x: 190, y: 70 },
    { x: 30, y: 120 }
  ];
  
  // Trigger animation when in viewport
  function setupIntersectionObserver() {
    observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && !animationPlaying) {
          visible = true;
          animationPlaying = true;
        } else if (!entry.isIntersecting) {
          visible = false;
          animationPlaying = false;
        }
      },
      {
        threshold: 0.2
      }
    );
    
    if (container) {
      observer.observe(container);
    }
  }
  
  onMount(() => {
    setupIntersectionObserver();
    // Start with animation visible if at top of page
    if (window.scrollY < 100) {
      visible = true;
      animationPlaying = true;
    }
  });
  
  onDestroy(() => {
    if (observer && container) {
      observer.unobserve(container);
    }
  });
</script>

<div class="process-animation-container" bind:this={container}>
  {#if visible}
    <div class="process-animation {step}-animation">
      <!-- Step title and description -->
      <div class="step-content" in:fly={{ y: 20, duration: 600, delay: 300 }}>
        <div class="step-icon" in:scale={{ duration: 500, delay: 200, start: 0.5, opacity: 0 }}>
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="32" 
            height="32" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            stroke-width="2" 
            stroke-linecap="round" 
            stroke-linejoin="round"
          >
            <path d={steps[step].icon}></path>
          </svg>
        </div>
        <h3 in:fly={{ y: 20, duration: 500, delay: 400 }}>{steps[step].title}</h3>
        <p in:fly={{ y: 20, duration: 500, delay: 500 }}>{steps[step].description}</p>
      </div>
      
      <!-- Visual animation based on step -->
      <div class="animation-visual">
        {#if step === 'idea'}
          <!-- Idea lightbulb animation -->
          <div class="idea-visual" in:scale={{ duration: 800, delay: 200, start: 0.8, opacity: 0 }}>
            <div class="lightbulb">
              <div class="bulb-glow"></div>
              <svg class="lightbulb-icon" width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" stroke-width="1.5">
                <path d="M9.663 17h4.673M12 3v1M12 22v-2M3 12h1M20 12h1M18.364 5.636l-.707.707M6.343 17.657l-.707.707M6.343 6.343l-.707-.707M18.364 18.364l-.707-.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            
            <!-- Floating ideas -->
            {#each Array(5) as _, i}
              <div 
                class="floating-idea idea-{i + 1}" 
                in:fly={{ y: 20, x: i % 2 ? 15 : -15, duration: 600, delay: 300 + i * 100 }}
              >
                <div class="idea-content"></div>
              </div>
            {/each}
          </div>
        {:else if step === 'vote'}
          <!-- Voting animation -->
          <div class="vote-visual" in:fade={{ duration: 600, delay: 200 }}>
            <div class="vote-counter" in:scale={{ duration: 800, delay: 600, start: 0.8 }}>
              <div class="vote-count">8</div>
              <div class="vote-label">votes</div>
            </div>
            
            <!-- Avatars and voting -->
            {#each avatarPositions as pos, i}
              <div 
                class="voter voter-{i + 1}" 
                style="top: {pos.y}px; left: {pos.x}px;" 
                in:fly={{ y: 40, x: i % 2 ? 20 : -20, duration: 800, delay: 400 + i * 150 }}
              >
                <div class="avatar">
                  <div class="avatar-content"></div>
                </div>
                {#if i < 3}
                  <div class="vote-action" in:fly={{ y: -10, duration: 400, delay: 800 + i * 200 }}>
                    <span class="vote-up">+1</span>
                  </div>
                {/if}
              </div>
            {/each}
          </div>
        {:else if step === 'draft'}
          <!-- Draft document animation -->
          <div class="draft-visual" in:scale={{ duration: 700, delay: 300, start: 0.9 }}>
            <div class="document">
              <div class="document-header"></div>
              {#each Array(3) as _, i}
                <div class="document-line" in:scale={{ duration: 400, delay: 500 + i * 100, start: 0, opacity: 0.5 }}></div>
              {/each}
              
              <div class="budget-section" in:fly={{ y: 10, duration: 500, delay: 800 }}>
                <div class="budget-label">Budget:</div>
                <div class="budget-amount">€1,500</div>
              </div>
              
              {#each Array(2) as _, i}
                <div class="document-line" in:scale={{ duration: 400, delay: 900 + i * 100, start: 0, opacity: 0.5 }}></div>
              {/each}
            </div>
            
            <div class="pen" in:fly={{ x: -50, y: 30, duration: 1000, delay: 500 }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" stroke-width="2">
                <path d="M12 19l7-7 3 3-7 7-3-3z"></path>
                <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"></path>
                <path d="M2 2l7.586 7.586"></path>
                <path d="M11 11l2.5 2.5"></path>
              </svg>
            </div>
          </div>
        {:else if step === 'implementation'}
          <!-- Implementation code animation -->
          <div class="implementation-visual" in:fade={{ duration: 600, delay: 300 }}>
            <div class="code-window" in:scale={{ duration: 700, delay: 400, start: 0.9 }}>
              <div class="window-bar">
                <div class="window-controls">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
              <div class="code-content">
                {#each Array(5) as _, i}
                  <div 
                    class="code-line" 
                    in:fly={{ x: -10, duration: 300, delay: 500 + i * 100 }}
                  >
                    <span class="code-indentation"></span>
                    <span class="code-text"></span>
                  </div>
                {/each}
              </div>
            </div>
            
            <!-- Moving code blocks representing development -->
            {#each Array(3) as _, i}
              <div 
                class="code-block block-{i + 1}" 
                in:fly={{ y: 30, x: i * 15, duration: 800, delay: 800 + i * 200 }}
              ></div>
            {/each}
          </div>
        {:else if step === 'reward'}
          <!-- Reward animation -->
          <div class="reward-visual" in:fade={{ duration: 600, delay: 300 }}>
            <div class="token-container" in:scale={{ duration: 800, delay: 400, start: 0.5 }}>
              <div class="token euro">
                <span>€</span>
              </div>
              <div class="token vc" in:fly={{ x: 30, duration: 600, delay: 700 }}>
                <span>VC</span>
              </div>
              <div class="glow-effect"></div>
            </div>
            
            <!-- Moving particles representing rewards -->
            {#each Array(8) as _, i}
              <div 
                class="reward-particle p-{i + 1}" 
                in:fly={{ y: i % 2 ? 20 : -20, x: i % 3 ? 15 : -15, duration: 1000, delay: 500 + i * 100 }}
              ></div>
            {/each}
            
            <div class="ownership-text" in:fly={{ y: 20, duration: 600, delay: 1000 }}>
              <span>+</span>
              <span class="percentage">5.7%</span>
              <span>ownership</span>
            </div>
          </div>
        {/if}
      </div>
    </div>
  {/if}
</div>

<style>
  /* Container */
  .process-animation-container {
    position: relative;
    width: 100%;
    height: 320px;
    margin: 2rem 0;
    overflow: hidden;
  }
  
  .process-animation {
    position: relative;
    width: 100%;
    height: 100%;
    display: flex;
    gap: 2rem;
    align-items: center;
    justify-content: space-between;
    padding: 1rem;
  }
  
  /* Step content */
  .step-content {
    flex: 1;
    max-width: 50%;
    padding: 1.5rem;
    background: rgba(20, 20, 30, 0.5);
    border-radius: 12px;
    border: 1px solid rgba(124, 58, 237, 0.2);
    backdrop-filter: blur(10px);
  }
  
  .step-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 48px;
    height: 48px;
    background: rgba(124, 58, 237, 0.2);
    border-radius: 50%;
    margin-bottom: 1rem;
    color: #a78bfa;
  }
  
  .step-content h3 {
    font-size: 1.5rem;
    margin-bottom: 0.75rem;
    font-weight: 700;
    background: linear-gradient(to right, #fff, #d4d4d8);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
  }
  
  .step-content p {
    color: rgba(255, 255, 255, 0.8);
    line-height: 1.6;
  }
  
  /* Animation visual */
  .animation-visual {
    flex: 1;
    height: 100%;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  /* Idea animations */
  .idea-visual {
    position: relative;
    width: 100%;
    height: 100%;
  }
  
  .lightbulb {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  }
  
  .bulb-glow {
    position: absolute;
    width: 80px;
    height: 80px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(124, 58, 237, 0.6) 0%, rgba(124, 58, 237, 0) 70%);
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    animation: pulse 2s infinite alternate;
  }
  
  .floating-idea {
    position: absolute;
    width: 30px;
    height: 30px;
    border-radius: 8px;
    background: rgba(124, 58, 237, 0.3);
    border: 1px solid rgba(124, 58, 237, 0.5);
    animation: float 4s ease-in-out infinite;
  }
  
  .idea-1 { top: 20%; left: 20%; animation-delay: 0s; }
  .idea-2 { top: 60%; left: 30%; animation-delay: 0.5s; }
  .idea-3 { top: 30%; left: 70%; animation-delay: 1s; }
  .idea-4 { top: 70%; left: 60%; animation-delay: 1.5s; }
  .idea-5 { top: 40%; left: 85%; animation-delay: 2s; }
  
  .idea-content {
    width: 70%;
    height: 2px;
    background: rgba(255, 255, 255, 0.7);
    margin: 6px auto;
    border-radius: 1px;
  }
  
  .idea-content::before {
    content: '';
    display: block;
    width: 50%;
    height: 2px;
    background: rgba(255, 255, 255, 0.7);
    margin: 4px auto;
    border-radius: 1px;
  }
  
  /* Vote animations */
  .vote-visual {
    position: relative;
    width: 100%;
    height: 100%;
  }
  
  .vote-counter {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: rgba(124, 58, 237, 0.2);
    border: 2px solid rgba(124, 58, 237, 0.6);
    width: 80px;
    height: 80px;
    border-radius: 50%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    box-shadow: 0 0 20px rgba(124, 58, 237, 0.3);
  }
  
  .vote-count {
    font-size: 2rem;
    font-weight: 700;
    color: white;
  }
  
  .vote-label {
    font-size: 0.8rem;
    text-transform: uppercase;
    color: rgba(255, 255, 255, 0.7);
  }
  
  .voter {
    position: absolute;
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  
  .avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: rgba(20, 20, 30, 0.8);
    border: 2px solid rgba(124, 58, 237, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }
  
  .avatar-content {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.5);
    position: relative;
  }
  
  .avatar-content::before,
  .avatar-content::after {
    content: '';
    position: absolute;
    background: rgba(255, 255, 255, 0.5);
  }
  
  .avatar-content::before {
    width: 26px;
    height: 26px;
    border-radius: 50%;
    top: 12px;
    left: 50%;
    transform: translateX(-50%);
  }
  
  .vote-action {
    margin-top: 5px;
  }
  
  .vote-up {
    display: inline-block;
    background: rgba(52, 211, 153, 0.2);
    color: #34d399;
    border-radius: 4px;
    padding: 2px 4px;
    font-size: 0.75rem;
    font-weight: bold;
  }
  
  /* Draft animations */
  .draft-visual {
    position: relative;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .document {
    width: 200px;
    height: 250px;
    background: rgba(30, 30, 40, 0.7);
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.2);
    padding: 1rem;
    position: relative;
    overflow: hidden;
  }
  
  .document-header {
    height: 24px;
    background: rgba(124, 58, 237, 0.2);
    border-radius: 4px;
    margin-bottom: 1rem;
  }
  
  .document-line {
    height: 12px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 2px;
    margin: 0.75rem 0;
    transform-origin: left;
  }
  
  .budget-section {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin: 1.5rem 0;
    padding: 0.5rem;
    background: rgba(124, 58, 237, 0.1);
    border-radius: 4px;
    border-left: 3px solid rgba(124, 58, 237, 0.5);
  }
  
  .budget-label {
    font-size: 0.9rem;
    color: rgba(255, 255, 255, 0.8);
  }
  
  .budget-amount {
    font-size: 1.1rem;
    font-weight: 700;
    color: white;
  }
  
  .pen {
    position: absolute;
    top: 60%;
    right: 30%;
    transform: rotate(-20deg);
    filter: drop-shadow(0 0 5px rgba(124, 58, 237, 0.5));
    animation: writingMotion 3s ease-in-out infinite;
    transform-origin: bottom right;
  }
  
  /* Implementation animations */
  .implementation-visual {
    position: relative;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .code-window {
    width: 240px;
    height: 200px;
    background: rgba(20, 20, 30, 0.8);
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.2);
    overflow: hidden;
  }
  
  .window-bar {
    height: 28px;
    background: rgba(30, 30, 40, 0.8);
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    display: flex;
    align-items: center;
    padding: 0 0.5rem;
  }
  
  .window-controls {
    display: flex;
    gap: 6px;
  }
  
  .window-controls span {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.2);
  }
  
  .window-controls span:first-child {
    background: rgba(239, 68, 68, 0.6);
  }
  
  .window-controls span:nth-child(2) {
    background: rgba(245, 158, 11, 0.6);
  }
  
  .window-controls span:last-child {
    background: rgba(34, 197, 94, 0.6);
  }
  
  .code-content {
    padding: 0.75rem;
  }
  
  .code-line {
    height: 16px;
    margin: 0.5rem 0;
    display: flex;
  }
  
  .code-indentation {
    width: 20px;
    height: 100%;
  }
  
  .code-text {
    flex: 1;
    height: 100%;
    background: rgba(124, 58, 237, 0.3);
    border-radius: 2px;
  }
  
  .code-block {
    position: absolute;
    width: 60px;
    height: 40px;
    background: rgba(124, 58, 237, 0.2);
    border: 1px solid rgba(124, 58, 237, 0.4);
    border-radius: 6px;
    animation: float 4s ease-in-out infinite;
  }
  
  .block-1 {
    top: 20%;
    right: 10%;
    animation-delay: 0s;
  }
  
  .block-2 {
    bottom: 30%;
    right: 15%;
    animation-delay: 1s;
  }
  
  .block-3 {
    bottom: 15%;
    left: 10%;
    animation-delay: 2s;
  }
  
  /* Reward animations */
  .reward-visual {
    position: relative;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .token-container {
    position: relative;
    width: 140px;
    height: 140px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .token {
    width: 70px;
    height: 70px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.5rem;
    font-weight: 700;
    position: absolute;
  }
  
  .euro {
    background: linear-gradient(135deg, #3b82f6, #1d4ed8);
    border: 2px solid rgba(59, 130, 246, 0.5);
    color: white;
    left: 10px;
    box-shadow: 0 0 15px rgba(59, 130, 246, 0.5);
    z-index: 2;
  }
  
  .vc {
    background: linear-gradient(135deg, #7c3aed, #4c1d95);
    border: 2px solid rgba(124, 58, 237, 0.5);
    color: white;
    right: 10px;
    box-shadow: 0 0 15px rgba(124, 58, 237, 0.5);
    z-index: 2;
  }
  
  .glow-effect {
    position: absolute;
    width: 140px;
    height: 140px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(124, 58, 237, 0.3) 0%, rgba(124, 58, 237, 0) 70%);
    animation: pulse 2s infinite alternate;
    z-index: 1;
  }
  
  .reward-particle {
    position: absolute;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: rgba(124, 58, 237, 0.6);
    animation: floatParticle 5s ease-in-out infinite;
  }
  
  .p-1 { top: 20%; left: 30%; animation-delay: 0s; background: rgba(59, 130, 246, 0.6); }
  .p-2 { top: 60%; left: 40%; animation-delay: 0.5s; }
  .p-3 { top: 30%; left: 60%; animation-delay: 1s; background: rgba(59, 130, 246, 0.6); }
  .p-4 { top: 70%; left: 70%; animation-delay: 1.5s; }
  .p-5 { top: 40%; left: 80%; animation-delay: 2s; background: rgba(59, 130, 246, 0.6); }
  .p-6 { top: 20%; left: 60%; animation-delay: 2.5s; }
  .p-7 { top: 80%; left: 30%; animation-delay: 3s; background: rgba(59, 130, 246, 0.6); }
  .p-8 { top: 50%; left: 50%; animation-delay: 3.5s; }
  
  .ownership-text {
    position: absolute;
    bottom: 20%;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 1.1rem;
    color: rgba(255, 255, 255, 0.8);
  }
  
  .percentage {
    font-size: 1.5rem;
    font-weight: 700;
    color: #7c3aed;
  }
  
  /* Animations */
  @keyframes pulse {
    0% {
      transform: translate(-50%, -50%) scale(0.9);
      opacity: 0.6;
    }
    100% {
      transform: translate(-50%, -50%) scale(1.1);
      opacity: 0.8;
    }
  }
  
  @keyframes float {
    0%, 100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(-15px);
    }
  }
  
  @keyframes floatParticle {
    0%, 100% {
      transform: translate(0, 0);
    }
    25% {
      transform: translate(10px, -10px);
    }
    50% {
      transform: translate(0, -15px);
    }
    75% {
      transform: translate(-10px, -10px);
    }
  }
  
  @keyframes writingMotion {
    0%, 100% {
      transform: rotate(-20deg) translate(0, 0);
    }
    25% {
      transform: rotate(-15deg) translate(5px, 2px);
    }
    50% {
      transform: rotate(-18deg) translate(10px, 5px);
    }
    75% {
      transform: rotate(-22deg) translate(5px, 3px);
    }
  }
  
  /* Responsive adjustments */
  @media (max-width: 768px) {
    .process-animation {
      flex-direction: column;
    }
    
    .step-content {
      max-width: 100%;
      margin-bottom: 1rem;
    }
    
    .animation-visual {
      width: 100%;
    }
    
    .process-animation-container {
      height: auto;
      min-height: 500px;
    }
  }
</style> 