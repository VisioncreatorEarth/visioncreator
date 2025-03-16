<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  
  // Mouse position state
  let mouseX = 0;
  let mouseY = 0;
  let targetX = 0;
  let targetY = 0;
  
  // Hover state
  let isHovering = false;
  let hoverElementType = '';
  
  // Elements for tracking cursor and hover events
  let cursorDot: HTMLElement;
  let cursorRing: HTMLElement;
  
  // Animation frame reference
  let animationFrame: number;
  
  // Cursor speed/smoothing factor (lower = smoother but slower)
  const smoothing = 0.15;
  
  // Track mouse position
  function onMouseMove(e: MouseEvent) {
    targetX = e.clientX;
    targetY = e.clientY;
  }
  
  // Detect hovering over interactive elements
  function handleMouseOver(e: MouseEvent) {
    const target = e.target as HTMLElement;
    
    // Check if hovering over interactive elements
    if (
      target.tagName.toLowerCase() === 'a' || 
      target.tagName.toLowerCase() === 'button' ||
      target.closest('a') || 
      target.closest('button') ||
      target.classList.contains('interactive') ||
      target.getAttribute('role') === 'button'
    ) {
      isHovering = true;
      
      // Determine the type of element for specific animations
      if (target.classList.contains('idea-card') || target.closest('.idea-card')) {
        hoverElementType = 'idea';
      } else if (target.classList.contains('vote-button') || target.closest('.vote-button')) {
        hoverElementType = 'vote';
      } else {
        hoverElementType = 'default';
      }
    } else {
      isHovering = false;
      hoverElementType = '';
    }
  }
  
  // Animation loop for smooth cursor movement
  function animateCursor() {
    // Calculate the distance between current and target position
    const dx = targetX - mouseX;
    const dy = targetY - mouseY;
    
    // Smoothly move toward target position
    mouseX += dx * smoothing;
    mouseY += dy * smoothing;
    
    // Update cursor position
    if (cursorDot) {
      cursorDot.style.transform = `translate(${mouseX}px, ${mouseY}px) scale(${isHovering ? 0.5 : 1})`;
    }
    
    if (cursorRing) {
      // Apply different styles based on hover state
      if (isHovering) {
        // Apply 3D tilt effect when hovering
        const tiltX = (dy / 20); // Tilt based on vertical movement
        const tiltY = -(dx / 20); // Tilt based on horizontal movement
        
        // Apply different animations based on element type
        if (hoverElementType === 'idea') {
          // Special animation for idea cards
          cursorRing.style.transform = `translate(${mouseX}px, ${mouseY}px) scale(1.5) rotateX(${tiltX}deg) rotateY(${tiltY}deg)`;
          cursorRing.style.backgroundColor = 'rgba(124, 58, 237, 0.2)';
          cursorRing.style.borderColor = 'rgba(124, 58, 237, 0.8)';
        } else if (hoverElementType === 'vote') {
          // Special animation for vote buttons
          cursorRing.style.transform = `translate(${mouseX}px, ${mouseY}px) scale(1.2) rotateX(${tiltX}deg) rotateY(${tiltY}deg)`;
          cursorRing.style.backgroundColor = 'rgba(52, 211, 153, 0.2)';
          cursorRing.style.borderColor = 'rgba(52, 211, 153, 0.8)';
        } else {
          // Default hover animation
          cursorRing.style.transform = `translate(${mouseX}px, ${mouseY}px) scale(1.4) rotateX(${tiltX}deg) rotateY(${tiltY}deg)`;
          cursorRing.style.backgroundColor = 'rgba(139, 92, 246, 0.15)';
          cursorRing.style.borderColor = 'rgba(139, 92, 246, 0.6)';
        }
      } else {
        // Default state
        cursorRing.style.transform = `translate(${mouseX}px, ${mouseY}px)`;
        cursorRing.style.backgroundColor = 'rgba(91, 33, 182, 0.1)';
        cursorRing.style.borderColor = 'rgba(91, 33, 182, 0.3)';
      }
    }
    
    // Continue animation loop
    animationFrame = requestAnimationFrame(animateCursor);
  }
  
  onMount(() => {
    // Initialize cursor elements
    cursorDot = document.querySelector('.cursor-dot') as HTMLElement;
    cursorRing = document.querySelector('.cursor-ring') as HTMLElement;
    
    // Set initial position to center of screen to avoid cursor jump on load
    mouseX = window.innerWidth / 2;
    mouseY = window.innerHeight / 2;
    targetX = mouseX;
    targetY = mouseY;
    
    // Add event listeners
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseover', handleMouseOver, true);
    
    // Hide default cursor
    document.documentElement.style.cursor = 'none';
    
    // Start animation loop
    animationFrame = requestAnimationFrame(animateCursor);
    
    // Add a class to detect devices that don't support hover
    if (window.matchMedia('(hover: none)').matches) {
      document.documentElement.classList.add('no-custom-cursor');
    } else {
      document.documentElement.classList.add('custom-cursor-enabled');
    }
  });
  
  onDestroy(() => {
    // Clean up event listeners and animation frame
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseover', handleMouseOver, true);
    cancelAnimationFrame(animationFrame);
    
    // Restore default cursor
    document.documentElement.style.cursor = '';
  });
</script>

<div class="cursor-wrapper">
  <div class="cursor-dot"></div>
  <div class="cursor-ring"></div>
</div>

<style>
  /* Hide cursor wrapper on touch devices */
  :global(.no-custom-cursor) .cursor-wrapper {
    display: none;
  }
  
  /* Hide cursor on elements */
  :global(.custom-cursor-enabled) a,
  :global(.custom-cursor-enabled) button,
  :global(.custom-cursor-enabled) [role="button"],
  :global(.custom-cursor-enabled) .interactive {
    cursor: none;
  }
  
  /* Base cursor wrapper */
  .cursor-wrapper {
    pointer-events: none;
    position: fixed;
    top: 0;
    left: 0;
    z-index: 9999;
    will-change: transform;
    overflow: visible;
  }
  
  /* Inner cursor dot */
  .cursor-dot {
    position: absolute;
    width: 8px;
    height: 8px;
    background: #7c3aed; /* Deep purple */
    border-radius: 50%;
    transform-origin: center;
    transition: transform 0.1s ease-out;
    box-shadow: 0 0 10px rgba(124, 58, 237, 0.5);
    will-change: transform;
    margin-top: -4px;
    margin-left: -4px;
  }
  
  /* Outer cursor ring */
  .cursor-ring {
    position: absolute;
    width: 36px;
    height: 36px;
    border: 2px solid rgba(91, 33, 182, 0.3);
    border-radius: 50%;
    transform-origin: center;
    transition: transform 0.15s ease-out, background-color 0.3s ease, border-color 0.3s ease;
    background-color: rgba(91, 33, 182, 0.1);
    will-change: transform, background-color, border-color;
    margin-top: -18px;
    margin-left: -18px;
    backdrop-filter: blur(4px);
  }
</style> 