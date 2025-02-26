<script>
  import Avatar from '$lib/Avatar.svelte';
  import { onMount } from 'svelte';
  
  // Seeds for generating consistent avatars
  const seeds = [
    'alice', 'bob', 'charlie', 'david', 'eve', 
    'frank', 'grace', 'henry'
  ];
  
  let mounted = false;
  
  onMount(() => {
    // Trigger the entry animation sequence
    setTimeout(() => {
      mounted = true;
    }, 100);
  });
</script>

<!-- Entry Animation Overlay -->
<div class="fixed inset-0 z-[100] pointer-events-none {mounted ? 'opacity-0 scale-110' : 'opacity-100 scale-100'} transition-all duration-1500 transform-gpu">
  <div class="absolute inset-0 bg-slate-900 flex items-center justify-center">
    <div class="text-center space-y-8 transform-gpu">
      <!-- Particles background effect -->
      <div class="absolute inset-0 overflow-hidden">
        <div class="particles-container absolute inset-0"></div>
      </div>
      
      <div class="text-8xl font-bold bg-gradient-to-r from-yellow-400 via-cyan-400 to-cyan-600 text-transparent bg-clip-text animate-pulse relative">
        VisionCreator
      </div>
      <div class="text-3xl text-cyan-100/80 animate-fade-in-delayed mt-4">
        Own What You Build
      </div>
      
      <!-- Loading spinner -->
      <div class="w-16 h-16 mx-auto mt-8 border-t-4 border-r-4 border-yellow-400 rounded-full animate-spin"></div>
    </div>
  </div>
</div>

<!-- Navigation -->
<nav class="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-slate-900/80 border-b border-cyan-900/10">
  <div class="max-w-7xl mx-auto px-8 py-4 flex justify-between items-center">
    <div class="text-2xl font-bold bg-gradient-to-r from-yellow-400 to-cyan-400 text-transparent bg-clip-text">
      VisionCreator
    </div>
    <div>
      <button class="px-8 py-3 bg-gradient-to-r from-yellow-400 to-cyan-400 rounded-full text-black font-bold hover:scale-105 transition-all duration-300">
        Join Now
      </button>
    </div>
  </div>
</nav>

<!-- Hero Section -->
<section class="min-h-screen flex flex-col justify-center items-center p-8 pt-32 relative">
  <!-- Animated Background Elements -->
  <div class="absolute inset-0 overflow-hidden pointer-events-none">
    <div class="absolute top-1/4 -left-48 w-96 h-96 bg-yellow-400/10 rounded-full blur-3xl animate-pulse"></div>
    <div class="absolute bottom-1/4 -right-48 w-96 h-96 bg-cyan-400/10 rounded-full blur-3xl animate-pulse"></div>
  </div>

  <div class="max-w-5xl mx-auto space-y-24 relative z-10">
    <!-- Main Headline -->
  <div class="text-center space-y-8">
      <h1 class="text-9xl sm:text-[12rem] font-extrabold bg-gradient-to-r from-yellow-400 via-cyan-400 to-cyan-600 text-transparent bg-clip-text animate-title-rise tracking-tight leading-none">
        RISE
    </h1>
      <p class="text-5xl font-bold text-cyan-100/90 animate-slide-up">
        <span class="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-cyan-400">Time</span> Is Your Most Valuable Asset
      </p>
      <p class="text-2xl text-cyan-100/80 max-w-2xl mx-auto animate-slide-up-delayed">
        Create on your terms. Build from anywhere, earn everywhere. Own what you build.
      </p>
      
      <!-- Hero CTA Button -->
      <div class="mt-12 animate-fade-in-delayed">
        <button class="px-10 py-5 bg-gradient-to-r from-yellow-400 to-cyan-400 rounded-full text-black text-xl font-bold hover:scale-105 transition-all duration-300 shadow-lg shadow-cyan-500/20">
          Start Your Ownership Journey
        </button>
      </div>
    </div>
    
    <!-- Lisa's Story - Simplified -->
    <div class="max-w-3xl mx-auto bg-slate-900/50 backdrop-blur-xl rounded-3xl p-8 border border-cyan-500/20 animate-fade-in">
      <div class="flex items-start gap-6">
        <div class="mt-2">
          <Avatar seed="lisa" size="64" />
        </div>
        <div class="text-left">
          <p class="text-lg text-cyan-100/90 italic">
            "Three years ago, I spent six months coding a platform that eventually sold for €15 million. My reward? A €5,000 bonus and a thank you email. That night, I asked myself a question that changed everything..."
          </p>
          <p class="text-2xl font-semibold text-yellow-400 mt-4 animate-fade-in-delayed">
            "What if those who <span class="bg-gradient-to-r from-yellow-400 to-cyan-400 text-transparent bg-clip-text font-bold animate-pulse">build</span> also <span class="bg-gradient-to-r from-yellow-400 to-cyan-400 text-transparent bg-clip-text font-bold animate-pulse">owned</span> what they create?"
          </p>
          <p class="text-right text-sm text-cyan-100/70 mt-2">— Lisa, Software Engineer</p>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- DAO Light Concept Section - New -->
<section class="py-24 relative overflow-hidden">
  <div class="absolute inset-0 pointer-events-none">
    <div class="absolute top-1/4 -left-48 w-96 h-96 bg-yellow-400/5 rounded-full blur-3xl"></div>
    <div class="absolute bottom-1/4 -right-48 w-96 h-96 bg-cyan-400/5 rounded-full blur-3xl"></div>
  </div>

  <div class="max-w-5xl mx-auto px-8">
    <div class="text-center mb-16">
      <h2 class="text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-cyan-400 animate-title-rise">
        RISE
      </h2>
      <h3 class="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-cyan-400 mt-6">
        Vision, Autonomy & Ownership
      </h3>
      <p class="text-xl text-cyan-100/70 mt-4 max-w-3xl mx-auto">
        The end of an ancient practice. The beginning of human freedom.
      </p>
    </div>
    
    <div class="bg-slate-900/30 backdrop-blur-xl rounded-3xl border border-cyan-500/20 p-8 mb-12">
      <p class="text-lg text-cyan-100/90 italic mb-6">
        "Humans need to create, they want to create, but on their own terms, in their own time and contribute to something they truly believe in. Every human has deep inside of them a relentless drive for excellence - that sadly only an elite few have yet discovered."
      </p>
      
      <div class="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
        <div class="space-y-4">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-full bg-gradient-to-r from-yellow-400/20 to-cyan-400/20 flex items-center justify-center text-2xl">
              👁️
            </div>
            <h3 class="text-xl font-bold text-yellow-400">Vision</h3>
          </div>
          <p class="text-cyan-100/80">
            Creators unite around shared visions that inspire them, not corporate mandates that restrict them.
          </p>
        </div>
        
        <div class="space-y-4">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-full bg-gradient-to-r from-yellow-400/20 to-cyan-400/20 flex items-center justify-center text-2xl">
              🔄
            </div>
            <h3 class="text-xl font-bold text-yellow-400">Autonomy</h3>
          </div>
          <p class="text-cyan-100/80">
            Control your own time, choose your projects, and work when inspiration strikes - not when a timecard demands.
          </p>
        </div>
        
        <div class="space-y-4">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-full bg-gradient-to-r from-yellow-400/20 to-cyan-400/20 flex items-center justify-center text-2xl">
              🔑
            </div>
            <h3 class="text-xl font-bold text-yellow-400">Ownership</h3>
          </div>
          <p class="text-cyan-100/80">
            Build equity in every project you touch, transforming your time into long-term wealth through real ownership.
          </p>
        </div>
      </div>
    </div>
    
    <div class="grid grid-cols-1 md:grid-cols-2 gap-12">
      <div class="bg-slate-900/30 backdrop-blur-xl rounded-3xl border border-red-500/20 p-8">
        <h3 class="text-2xl font-bold text-red-400 mb-6">The Painful Truth</h3>
        <p class="text-cyan-100/80 mb-6">
          You don't control your own time. We've nurtured a system that serves other interests over our own well-being - for centuries.
        </p>
        <p class="text-cyan-100/80 mb-6">
          In today's perception, it's normal that humans exchange time for money, working for employers who prioritize profits over people.
        </p>
        <div class="h-px w-full bg-red-500/20 my-6"></div>
        <p class="text-xl text-red-400/80 font-light">
          This ancient practice has been lived by billions of humans for thousands of years.
        </p>
      </div>
      
      <div class="bg-slate-900/30 backdrop-blur-xl rounded-3xl border border-cyan-500/20 p-8 md:translate-y-8">
        <h3 class="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-cyan-400 mb-6">The Collective Alternative</h3>
        <p class="text-cyan-100/80 mb-6">
          VisionCreator's model operates as a "DAO Light" - a decentralized collective where governance, resources, and rewards are shared by all contributors.
        </p>
        <div class="space-y-4 mb-6">
          <div class="flex items-start gap-4">
            <div class="w-8 h-8 rounded-full bg-gradient-to-r from-yellow-400/20 to-cyan-400/20 flex items-center justify-center text-sm">
              1
            </div>
            <p class="text-cyan-100/90">Every member gets voting rights on project direction</p>
          </div>
          <div class="flex items-start gap-4">
            <div class="w-8 h-8 rounded-full bg-gradient-to-r from-yellow-400/20 to-cyan-400/20 flex items-center justify-center text-sm">
              2
            </div>
            <p class="text-cyan-100/90">Contribution is rewarded with both immediate value and long-term ownership</p>
          </div>
          <div class="flex items-start gap-4">
            <div class="w-8 h-8 rounded-full bg-gradient-to-r from-yellow-400/20 to-cyan-400/20 flex items-center justify-center text-sm">
              3
            </div>
            <p class="text-cyan-100/90">Transparency in all operations and value distribution</p>
          </div>
        </div>
        <div class="h-px w-full bg-cyan-500/20 my-6"></div>
        <p class="text-xl text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-cyan-400 font-bold">
          What if this ancient practice is about to come to an abrupt end?
        </p>
      </div>
    </div>
  </div>
</section>

<!-- Problem-Solution Section -->
<section class="py-24 relative overflow-hidden">
  <div class="absolute inset-0 pointer-events-none">
    <div class="absolute top-1/4 -left-48 w-96 h-96 bg-yellow-400/5 rounded-full blur-3xl"></div>
    <div class="absolute bottom-1/4 -right-48 w-96 h-96 bg-cyan-400/5 rounded-full blur-3xl"></div>
  </div>

  <div class="max-w-5xl mx-auto px-8">
    <div class="text-center mb-16">
      <h2 class="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-cyan-400">
        The Problem & Our Solution
      </h2>
    </div>
    
    <!-- Split Screen Problem-Solution - Kept but simplified -->
    <div class="relative">
      <div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-gradient-to-r from-yellow-400 to-cyan-400 rounded-full flex items-center justify-center z-10 text-black text-2xl">VS</div>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
        <!-- Traditional Model -->
        <div class="bg-slate-900/50 backdrop-blur-xl rounded-3xl border border-red-500/20 p-8 transform hover:scale-98 transition-all duration-300 opacity-80 hover:opacity-100">
          <h3 class="text-2xl font-bold text-red-400 mb-6">Traditional Work Model</h3>
          <div class="space-y-4">
            <div class="flex items-start gap-4">
              <div class="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center text-xl">⏱️</div>
              <p class="text-cyan-100/80">Time traded for one-time payment</p>
            </div>
            <div class="flex items-start gap-4">
              <div class="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center text-xl">🔗</div>
              <p class="text-cyan-100/80">Zero ownership in what you create</p>
            </div>
            <div class="flex items-start gap-4">
              <div class="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center text-xl">💰</div>
              <p class="text-cyan-100/80">Others profit from your creation</p>
            </div>
            
            <div class="py-4">
              <div class="h-4 w-full bg-red-500/10 rounded-full relative">
                <div class="absolute top-0 bottom-0 left-0 w-[3%] bg-red-500 rounded-full"></div>
                <div class="absolute bottom-full mb-1 left-[3%] transform -translate-x-1/2 text-xs text-red-400">3%</div>
                <div class="absolute bottom-full mb-1 right-0 text-xs text-cyan-100/70">Creator's Share</div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- VisionCreator Model -->
        <div class="bg-slate-900/50 backdrop-blur-xl rounded-3xl border border-cyan-500/20 p-8 transform md:scale-105 shadow-lg shadow-cyan-500/10">
          <h3 class="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-cyan-400 mb-6">VisionCreator Model</h3>
          <div class="space-y-4">
            <div class="flex items-start gap-4">
              <div class="w-10 h-10 rounded-full bg-gradient-to-r from-yellow-400/20 to-cyan-400/20 flex items-center justify-center text-xl">⏱️</div>
              <p class="text-cyan-100">Time creates permanent streams of income</p>
            </div>
            <div class="flex items-start gap-4">
              <div class="w-10 h-10 rounded-full bg-gradient-to-r from-yellow-400/20 to-cyan-400/20 flex items-center justify-center text-xl">🔑</div>
              <p class="text-cyan-100">Real ownership in every venture</p>
            </div>
            <div class="flex items-start gap-4">
              <div class="w-10 h-10 rounded-full bg-gradient-to-r from-yellow-400/20 to-cyan-400/20 flex items-center justify-center text-xl">💰</div>
              <p class="text-cyan-100">You share in the long-term success</p>
            </div>
            
            <div class="py-4">
              <div class="h-4 w-full bg-cyan-500/10 rounded-full relative">
                <div class="absolute top-0 bottom-0 left-0 w-[50%] bg-gradient-to-r from-yellow-400 to-cyan-400 rounded-full"></div>
                <div class="absolute bottom-full mb-1 left-[50%] transform -translate-x-1/2 text-xs text-yellow-400 font-bold">50%+</div>
                <div class="absolute bottom-full mb-1 right-0 text-xs text-cyan-100/70">Creator's Share</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- How It Works - Simplified -->
<section class="py-24 bg-slate-950/50">
  <div class="max-w-5xl mx-auto px-8">
    <div class="text-center mb-16">
      <h2 class="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-cyan-400">
        How VisionCreator Works
      </h2>
      <p class="text-xl text-cyan-100/70 mt-4 max-w-2xl mx-auto">
        A collective approach that transforms time into ownership
      </p>
    </div>
    
    <!-- Dao Light Membership Flow -->
    <div class="relative mx-auto max-w-4xl mb-20">
      <div class="absolute top-0 left-1/2 h-full w-1 bg-gradient-to-b from-yellow-400/50 to-cyan-400/50 transform -translate-x-1/2"></div>
      
      <!-- Step 1: Join -->
      <div class="relative z-10 mb-16">
        <div class="flex items-center">
          <div class="w-16 h-16 rounded-full bg-gradient-to-r from-yellow-400 to-cyan-400 flex items-center justify-center text-2xl text-black font-bold shadow-lg">
            1
          </div>
          <div class="ml-8 bg-slate-900/50 backdrop-blur-xl rounded-xl border border-cyan-500/20 p-6 flex-1">
            <h3 class="text-xl font-bold text-yellow-400 mb-2">Contribute €1 Daily</h3>
            <p class="text-cyan-100/80">Join the collective pool with minimal investment. This amount compounds your future returns and builds the community resource.</p>
          </div>
        </div>
      </div>
      
      <!-- Step 2: Participate -->
      <div class="relative z-10 mb-16 ml-24">
        <div class="flex items-center">
          <div class="w-16 h-16 rounded-full bg-gradient-to-r from-yellow-400 to-cyan-400 flex items-center justify-center text-2xl text-black font-bold shadow-lg">
            2
          </div>
          <div class="ml-8 bg-slate-900/50 backdrop-blur-xl rounded-xl border border-cyan-500/20 p-6 flex-1">
            <h3 class="text-xl font-bold text-yellow-400 mb-2">Contribute Your Skills</h3>
            <p class="text-cyan-100/80">Apply your talents to projects you believe in. Each contribution earns you both immediate compensation and permanent ownership stakes.</p>
          </div>
        </div>
      </div>
      
      <!-- Step 3: Vote -->
      <div class="relative z-10 mb-16">
        <div class="flex items-center">
          <div class="w-16 h-16 rounded-full bg-gradient-to-r from-yellow-400 to-cyan-400 flex items-center justify-center text-2xl text-black font-bold shadow-lg">
            3
          </div>
          <div class="ml-8 bg-slate-900/50 backdrop-blur-xl rounded-xl border border-cyan-500/20 p-6 flex-1">
            <h3 class="text-xl font-bold text-yellow-400 mb-2">Participate in Governance</h3>
            <p class="text-cyan-100/80">Vote on project direction, resource allocation, and value distribution. Every member has a voice in the collective's future.</p>
          </div>
        </div>
      </div>
      
      <!-- Step 4: Benefit -->
      <div class="relative z-10 ml-24">
        <div class="flex items-center">
          <div class="w-16 h-16 rounded-full bg-gradient-to-r from-yellow-400 to-cyan-400 flex items-center justify-center text-2xl text-black font-bold shadow-lg">
            4
          </div>
          <div class="ml-8 bg-slate-900/50 backdrop-blur-xl rounded-xl border border-cyan-500/20 p-6 flex-1">
            <h3 class="text-xl font-bold text-yellow-400 mb-2">Receive Ongoing Returns</h3>
            <p class="text-cyan-100/80">As projects succeed, your ownership stakes generate continuing income streams that grow over time, creating true financial freedom.</p>
          </div>
        </div>
      </div>
    </div>
    
    <div class="text-center">
      <p class="text-2xl text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-cyan-400 font-bold">
        From Time to Ownership to Freedom
      </p>
    </div>
  </div>
</section>

<!-- Real Example - Kept Marco's story as it provides social proof -->
<section class="py-24 relative overflow-hidden">
  <div class="absolute inset-0 pointer-events-none">
    <div class="absolute top-1/4 -left-48 w-96 h-96 bg-yellow-400/5 rounded-full blur-3xl"></div>
    <div class="absolute bottom-1/4 -right-48 w-96 h-96 bg-cyan-400/5 rounded-full blur-3xl"></div>
  </div>

  <div class="max-w-4xl mx-auto px-8">
    <div class="text-center mb-16">
      <h2 class="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-cyan-400">
        Real Results
      </h2>
    </div>
    
    <!-- Marco's Story - Kept but centered -->
    <div class="bg-slate-900/50 backdrop-blur-xl rounded-3xl p-8 border border-cyan-500/20 hover:border-cyan-400/40 transition-all duration-500 max-w-2xl mx-auto">
      <div class="space-y-8">
        <div class="flex items-start gap-6">
          <Avatar seed="marco" size="64" />
          <div>
            <h3 class="text-2xl font-bold text-yellow-400 mb-2">Marco's Journey</h3>
            <p class="text-cyan-100/80 text-sm">Developer from Portugal</p>
          </div>
        </div>
        
        <div class="space-y-4">
          <div class="flex items-center gap-4">
            <div class="w-8 h-8 rounded-full bg-gradient-to-r from-yellow-400/20 to-cyan-400/20 flex items-center justify-center">
              1
            </div>
            <p class="text-cyan-100">Started with €1/day into our community pool</p>
          </div>
          
          <div class="flex items-center gap-4">
            <div class="w-8 h-8 rounded-full bg-gradient-to-r from-yellow-400/20 to-cyan-400/20 flex items-center justify-center">
              2
            </div>
            <p class="text-cyan-100">Contributed code to three different ventures</p>
          </div>
          
          <div class="flex items-center gap-4">
            <div class="w-8 h-8 rounded-full bg-gradient-to-r from-yellow-400/20 to-cyan-400/20 flex items-center justify-center">
              3
            </div>
            <p class="text-cyan-100">Earned both immediate payment AND ownership stakes</p>
          </div>
          
          <div class="flex items-center gap-4">
            <div class="w-8 h-8 rounded-full bg-gradient-to-r from-yellow-400/20 to-cyan-400/20 flex items-center justify-center">
              4
            </div>
            <p class="text-cyan-100">Now receives monthly returns from two successful projects</p>
          </div>
        </div>
        
        <div class="bg-gradient-to-r from-yellow-400/10 to-cyan-400/10 rounded-xl p-4">
          <p class="text-cyan-100/90 italic">
            "I used to build products for others. Now I build wealth for myself while doing what I love."
          </p>
          <p class="text-right text-sm text-cyan-100/70 mt-2">— Marco</p>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- CTA Section - Simplified but clear -->
<section class="py-32 relative overflow-hidden">
  <div class="absolute inset-0 pointer-events-none">
    <div class="absolute top-1/2 -left-48 w-96 h-96 bg-yellow-400/10 rounded-full blur-3xl"></div>
  </div>

  <div class="max-w-3xl mx-auto px-8 text-center space-y-12">
    <h2 class="text-5xl font-bold">
      Start with <span class="text-yellow-400">€1 Daily</span>
      <br />
      <span class="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-cyan-400">Own Your Future</span>
    </h2>
    
    <p class="text-xl text-cyan-100/80 max-w-xl mx-auto">
      Join a community of 233+ visionaries already building ownership through shared ventures.
    </p>
    
    <div class="flex justify-center items-center space-x-6">
      <button class="px-10 py-5 bg-gradient-to-r from-yellow-400 to-cyan-400 rounded-full text-black text-xl font-bold hover:scale-105 transition-all duration-300">
        Begin Your Ownership Journey
      </button>
    </div>
    
    <!-- Social Proof - Simplified -->
    <div class="flex justify-center gap-4">
      <div class="flex -space-x-3">
        <Avatar seed="member1" />
        <Avatar seed="member2" />
        <Avatar seed="member3" />
        <div class="w-12 h-12 rounded-full border-2 border-slate-800 bg-gradient-to-br from-cyan-900/20 to-cyan-900/5 backdrop-blur-xl flex items-center justify-center text-cyan-100 text-sm">
          +230
        </div>
      </div>
    </div>
  </div>
</section>

<div class="bg-slate-900 min-h-screen text-white">
  <slot />
</div>

<style>
  @keyframes float-slow {
    0%, 100% { transform: translateY(0) rotate(12deg); }
    50% { transform: translateY(-20px) rotate(12deg); }
  }

  @keyframes float-delayed {
    0%, 100% { transform: translateY(0) rotate(-12deg); }
    50% { transform: translateY(-30px) rotate(-12deg); }
  }

  @keyframes title-rise {
    0% { transform: translateY(50px); opacity: 0; }
    100% { transform: translateY(0); opacity: 1; }
  }

  @keyframes fade-in {
    0% { opacity: 0; }
    100% { opacity: 1; }
  }

  @keyframes slide-up {
    0% { transform: translateY(20px); opacity: 0; }
    100% { transform: translateY(0); opacity: 1; }
  }

  @keyframes fade-in-up {
    0% { transform: translateY(20px); opacity: 0; }
    100% { transform: translateY(0); opacity: 1; }
  }

  @keyframes spin-slow {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  @keyframes scale-98 {
    0% { transform: scale(1); }
    100% { transform: scale(0.98); }
  }
  
  @keyframes typewriter {
    from { width: 0; }
    to { width: 100%; }
  }

  @keyframes blink-caret {
    from, to { border-color: transparent; }
    50% { border-color: rgba(56, 189, 248, 0.7); }
  }

  .typewriter-container {
    position: relative;
    margin-bottom: 1rem;
  }
  
  .typewriter-placeholder {
    display: none;
  }

  .typewriter-text {
    display: none;
  }

  .animate-float-slow {
    animation: float-slow 6s ease-in-out infinite;
  }

  .animate-float-delayed {
    animation: float-delayed 8s ease-in-out infinite;
  }

  .animate-title-rise {
    animation: title-rise 1.5s ease-out forwards;
  }

  .animate-fade-in {
    animation: fade-in 1s ease-out forwards;
  }

  .animate-slide-up {
    animation: slide-up 1s ease-out forwards;
  }

  .animate-slide-up-delayed {
    animation: slide-up 1s ease-out 0.3s forwards;
    opacity: 0;
  }

  .animate-fade-in-delayed {
    animation: fade-in 1s ease-out 0.5s forwards;
    opacity: 0;
  }

  .animate-fade-in-delayed-2 {
    animation: fade-in 1s ease-out 0.8s forwards;
    opacity: 0;
  }

  .animate-fade-in-up {
    animation: fade-in-up 1s ease-out forwards;
  }

  .animate-fade-in-up-delayed {
    animation: fade-in-up 1s ease-out 1s forwards;
    opacity: 0;
  }

  .particles-container {
    background-image: 
      radial-gradient(circle at 20% 20%, rgba(56, 189, 248, 0.1) 0%, transparent 20%),
      radial-gradient(circle at 80% 80%, rgba(250, 204, 21, 0.1) 0%, transparent 20%);
    background-size: 100% 100%;
    animation: pulse 8s ease-in-out infinite;
  }
  
  @keyframes pulse {
    0%, 100% { opacity: 0.5; }
    50% { opacity: 1; }
  }
</style>
