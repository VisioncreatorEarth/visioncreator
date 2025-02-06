<script>
  import Avatar from '$lib/Avatar.svelte';
  
  // Seeds for generating consistent avatars
  const seeds = [
    'alice', 'bob', 'charlie', 'david', 'eve', 
    'frank', 'grace', 'henry'
  ];
</script>

<!-- Navigation -->
<nav class="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-slate-900/80 border-b border-cyan-900/10">
  <div class="max-w-7xl mx-auto px-8 py-4 flex justify-between items-center">
    <div class="text-2xl font-bold bg-gradient-to-r from-yellow-400 to-cyan-400 text-transparent bg-clip-text">
      VisionCreator
    </div>
    <button class="px-8 py-3 bg-gradient-to-r from-yellow-400 to-cyan-400 rounded-full text-black font-bold hover:scale-105 transition-all duration-300">
      Join Now
    </button>
  </div>
</nav>

<!-- Hero -->
<section class="h-screen flex flex-col justify-center items-center p-8">
  <div class="space-y-8 text-center">
    <h1 class="text-[14rem] font-bold bg-gradient-to-r from-yellow-400 via-cyan-400 to-cyan-600 text-transparent bg-clip-text leading-none tracking-tight">
      RISE
    </h1>
    <div class="space-y-8">
      <p class="text-2xl text-cyan-100">One Collective Power</p>
      
      <!-- Founders Joined Section -->
      <div class="flex flex-col items-center space-y-4">
        <div class="flex -space-x-4">
          {#each seeds as seed}
            <Avatar {seed} />
          {/each}
          <div class="w-12 h-12 rounded-full border-2 border-slate-800 bg-gradient-to-br from-cyan-900/20 to-cyan-900/5 backdrop-blur-xl flex items-center justify-center text-cyan-100">
            +13
          </div>
        </div>
        <p class="text-lg text-cyan-100/80">
          <span class="font-semibold text-yellow-400">21 Founders</span>
        </p>
        <div class="w-32 h-px bg-gradient-to-r from-transparent via-cyan-500 to-transparent"></div>
      </div>
    </div>
  </div>
</section>

<!-- Transform Section -->
<section class="min-h-screen flex items-center">
  <div class="max-w-7xl mx-auto px-8">
    <div class="space-y-12">
      <div class="text-center space-y-6">
        <p class="text-2xl text-cyan-100">Together we</p>
        <h2 class="text-6xl font-bold leading-tight">
          Transform <span class="text-yellow-400">€1</span> Into
          <br />
          <span class="text-cyan-400">Ownership Power</span>
        </h2>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div class="bg-gradient-to-br from-cyan-900/20 to-cyan-900/5 rounded-3xl p-8 backdrop-blur-xl border border-cyan-500/20">
          <p class="text-xl text-cyan-100">Join a revolutionary community of creators</p>
        </div>
        <div class="bg-gradient-to-br from-cyan-900/20 to-cyan-900/5 rounded-3xl p-8 backdrop-blur-xl border border-cyan-500/20">
          <p class="text-xl text-cyan-100">Daily micro-investment builds massive potential</p>
        </div>
        <div class="bg-gradient-to-br from-cyan-900/20 to-cyan-900/5 rounded-3xl p-8 backdrop-blur-xl border border-cyan-500/20">
          <p class="text-xl text-cyan-100">75% of revenue flows into shared Innovation Pool</p>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Your Rise Benefits -->
<section class="min-h-screen py-32 px-8">
  <div class="max-w-7xl mx-auto">
    <h2 class="text-7xl font-bold text-yellow-400 text-center mb-24">Your Rise</h2>
    <div class="grid grid-cols-2 gap-16">
      <!-- Revenue Share -->
      <div class="bg-gradient-to-br from-cyan-900/20 to-cyan-900/5 rounded-3xl p-12 backdrop-blur-xl border border-cyan-500/20 group hover:border-cyan-500/40 transition-all duration-500">
        <h3 class="text-4xl font-bold text-yellow-400 mb-8">Revenue Share</h3>
        <div class="space-y-4">
          <p class="text-xl text-gray-300 group-hover:text-cyan-100 transition-colors duration-300">Start earning from day one as projects launch</p>
          <p class="text-xl text-gray-300 group-hover:text-cyan-100 transition-colors duration-300">Every contribution grows your income stream</p>
          <p class="text-xl text-gray-300 group-hover:text-cyan-100 transition-colors duration-300">Multiple projects = Multiple revenue flows</p>
          <p class="text-xl text-gray-300 group-hover:text-cyan-100 transition-colors duration-300">Passive income that scales with our growth</p>
        </div>
      </div>

      <!-- Contribution Value -->
      <div class="bg-gradient-to-br from-cyan-900/20 to-cyan-900/5 rounded-3xl p-12 backdrop-blur-xl border border-cyan-500/20 group hover:border-cyan-500/40 transition-all duration-500">
        <h3 class="text-4xl font-bold text-yellow-400 mb-8">Contribution Value</h3>
        <div class="space-y-4">
          <p class="text-xl text-gray-300 group-hover:text-cyan-100 transition-colors duration-300">Turn your existing skills into income</p>
          <p class="text-xl text-gray-300 group-hover:text-cyan-100 transition-colors duration-300">Choose projects that match your expertise</p>
          <p class="text-xl text-gray-300 group-hover:text-cyan-100 transition-colors duration-300">Build a portfolio of paid contributions</p>
          <p class="text-xl text-gray-300 group-hover:text-cyan-100 transition-colors duration-300">Your value increases with every success</p>
        </div>
      </div>

      <!-- Token Growth -->
      <div class="bg-gradient-to-br from-cyan-900/20 to-cyan-900/5 rounded-3xl p-12 backdrop-blur-xl border border-cyan-500/20 group hover:border-cyan-500/40 transition-all duration-500">
        <h3 class="text-4xl font-bold text-yellow-400 mb-8">Token Growth</h3>
        <div class="space-y-4">
          <p class="text-xl text-gray-300 group-hover:text-cyan-100 transition-colors duration-300">Early members get maximum token allocation</p>
          <p class="text-xl text-gray-300 group-hover:text-cyan-100 transition-colors duration-300">Each new project increases token value</p>
          <p class="text-xl text-gray-300 group-hover:text-cyan-100 transition-colors duration-300">Get in before we reach 144 members</p>
          <p class="text-xl text-gray-300 group-hover:text-cyan-100 transition-colors duration-300">Limited time to join at ground level</p>
        </div>
      </div>

      <!-- Digital Shares -->
      <div class="bg-gradient-to-br from-cyan-900/20 to-cyan-900/5 rounded-3xl p-12 backdrop-blur-xl border border-cyan-500/20 group hover:border-cyan-500/40 transition-all duration-500">
        <h3 class="text-4xl font-bold text-yellow-400 mb-8">Digital Shares</h3>
        <div class="space-y-4">
          <p class="text-xl text-gray-300 group-hover:text-cyan-100 transition-colors duration-300">Own real equity in every venture</p>
          <p class="text-xl text-gray-300 group-hover:text-cyan-100 transition-colors duration-300">Build a portfolio of digital assets</p>
          <p class="text-xl text-gray-300 group-hover:text-cyan-100 transition-colors duration-300">Each €1 converts to permanent ownership</p>
          <p class="text-xl text-gray-300 group-hover:text-cyan-100 transition-colors duration-300">Your wealth grows as we succeed</p>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Timeline Section with Heading -->
<section class="relative pt-32">
  <!-- Timeline Heading -->
  <div class="text-center mb-32">
    <h2 class="text-7xl font-bold text-yellow-400 mb-4">Our Path</h2>
    <p class="text-2xl text-cyan-100">From Vision to Reality</p>
  </div>

  <!-- Timeline with Milestones -->
  <div class="relative">
    <!-- Central Line -->
    <div class="absolute left-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-cyan-500 via-cyan-500 to-cyan-900 transform -translate-x-1/2"></div>

    <!-- Milestones -->
    <div class="relative">
      <!-- 144 -->
      <div class="min-h-screen flex items-center">
        <div class="w-full max-w-7xl mx-auto px-8 grid grid-cols-2 gap-24">
          <div class="text-right space-y-6">
            <h3 class="text-6xl font-bold text-yellow-400">144</h3>
            <p class="text-2xl text-cyan-100">Platform Launch</p>
            <p class="text-xl text-cyan-100">Community Platform Goes Live</p>
            <p class="text-xl text-cyan-100">Digitalized GmbH shares distributed</p>
          </div>
          <div class="relative">
            <div class="absolute -left-[3.25rem] top-8 w-6 h-6 bg-gradient-to-r from-yellow-400 to-cyan-400 rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>

      <!-- 233 -->
      <div class="min-h-screen flex items-center">
        <div class="w-full max-w-7xl mx-auto px-8 grid grid-cols-2 gap-24">
          <div class="relative">
            <div class="absolute -right-[3.25rem] top-8 w-6 h-6 bg-gradient-to-r from-yellow-400 to-cyan-400 rounded-full animate-pulse"></div>
          </div>
          <div class="text-left space-y-6">
            <h3 class="text-6xl font-bold text-yellow-400">233</h3>
            <p class="text-2xl text-cyan-100">First Startup Launch</p>
            <p class="text-xl text-cyan-100">Community selects first venture</p>
            <p class="text-xl text-cyan-100">Revenue cycle begins</p>
          </div>
        </div>
      </div>

      <!-- 377 -->
      <div class="min-h-screen flex items-center">
        <div class="w-full max-w-7xl mx-auto px-8 grid grid-cols-2 gap-24">
          <div class="text-right space-y-6">
            <h3 class="text-6xl font-bold text-yellow-400">377</h3>
            <p class="text-2xl text-cyan-100">Multiple Ventures Live</p>
            <p class="text-xl text-cyan-100">Network Effects Begin</p>
            <p class="text-xl text-cyan-100">Growth Accelerates</p>
          </div>
          <div class="relative">
            <div class="absolute -left-[3.25rem] top-8 w-6 h-6 bg-gradient-to-r from-yellow-400 to-cyan-400 rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>

      <!-- 610 -->
      <div class="min-h-screen flex items-center">
        <div class="w-full max-w-7xl mx-auto px-8 grid grid-cols-2 gap-24">
          <div class="relative">
            <div class="absolute -right-[3.25rem] top-8 w-6 h-6 bg-gradient-to-r from-yellow-400 to-cyan-400 rounded-full animate-pulse"></div>
          </div>
          <div class="text-left space-y-6">
            <h3 class="text-6xl font-bold text-yellow-400">610</h3>
            <p class="text-2xl text-cyan-100">Market Impact</p>
            <p class="text-xl text-cyan-100">Multiple Revenue Streams</p>
            <p class="text-xl text-cyan-100">Ecosystem Thrives</p>
          </div>
        </div>
      </div>

      <!-- Infinite -->
      <div class="min-h-screen flex items-center">
        <div class="w-full max-w-7xl mx-auto px-8 grid grid-cols-2 gap-24">
          <div class="text-right space-y-6">
            <h3 class="text-6xl font-bold text-yellow-400">∞</h3>
            <p class="text-2xl text-cyan-100">The Rise Continues</p>
            <p class="text-xl text-cyan-100">Unlimited Potential</p>
          </div>
          <div class="relative">
            <div class="absolute -left-[3.25rem] top-8 w-6 h-6 bg-gradient-to-r from-yellow-400 to-cyan-400 rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- CTA -->
<section class="min-h-screen flex flex-col justify-center items-center">
  <div class="max-w-4xl space-y-16 text-center">
    <h2 class="text-7xl font-bold">
      Start with €1
      <br />
      <span class="text-yellow-400">Rise with Every Project</span>
    </h2>
    <button class="px-12 py-6 bg-gradient-to-r from-yellow-400 to-cyan-400 rounded-full text-black text-2xl font-bold hover:scale-105 transition-transform duration-300">
      Join Now
    </button>
  </div>
</section>

<div class="bg-slate-900 min-h-screen text-white">
  <slot />
</div>
