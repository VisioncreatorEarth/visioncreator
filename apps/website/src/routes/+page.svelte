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
  <div class="space-y-16 text-center">
    <h1 class="text-[14rem] font-bold bg-gradient-to-r from-yellow-400 via-cyan-400 to-cyan-600 text-transparent bg-clip-text leading-none tracking-tight">
      RISE
    </h1>
    <div class="space-y-16">
      <p class="text-6xl font-light text-cyan-100 tracking-wide">One Collective Power</p>
      
      <!-- Founders Joined Section -->
      <div class="flex flex-col items-center space-y-6 mt-24">
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
        <div class="w-24 h-px bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-50"></div>
      </div>
    </div>
  </div>
</section>

<!-- Transform Section -->
<section class="min-h-screen flex items-center">
  <div class="max-w-7xl mx-auto px-8">
    <div class="space-y-20">
      <p class="text-3xl text-cyan-100 text-center font-light tracking-wide">Together we</p>
      <div class="text-center">
        <h2 class="text-6xl font-bold leading-tight">
          Transform <span class="text-yellow-400">€1</span> Into
          <br />
          <span class="text-cyan-400">Ownership</span>
        </h2>
      </div>
    </div>
  </div>
</section>

<!-- Investment Journey -->
<section class="min-h-screen py-64">
  <div class="max-w-7xl mx-auto px-8">
    <div class="text-center space-y-12">
      <h2 class="text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-cyan-400">
        Together we invest
      </h2>
      <div class="h-8"></div>
      <p class="text-3xl font-light text-cyan-100">
        <span class="text-yellow-400 font-bold">€365</span> into our VisionCreator pool
      </p>
    </div>

    <div class="h-32"></div>

    <!-- Journey Flow -->
    <div class="relative">
      <!-- Center Line -->
      <div class="absolute left-1/2 h-full w-px bg-gradient-to-b from-yellow-400/50 via-cyan-400/50 to-transparent"></div>

      <div class="grid grid-cols-2 gap-24">
        <!-- Ideation & Voting -->
        <div class="flex items-center justify-end space-x-8">
          <div class="text-right">
            <h3 class="text-2xl font-bold text-yellow-400 mb-2">Community Voting</h3>
            <p class="text-cyan-100 mb-4">Vote on startup proposals and shape our future</p>
            <div class="flex justify-end space-x-2">
              <span class="px-3 py-1 rounded-full bg-cyan-400/10 text-cyan-100 text-sm">Vote</span>
              <span class="px-3 py-1 rounded-full bg-cyan-400/10 text-cyan-100 text-sm">Propose</span>
            </div>
          </div>
          <div class="flex -space-x-3">
            <Avatar seed="voter1" />
            <Avatar seed="voter2" />
            <Avatar seed="voter3" />
            <div class="w-12 h-12 rounded-full border-2 border-slate-800 bg-gradient-to-br from-cyan-900/20 to-cyan-900/5 backdrop-blur-xl flex items-center justify-center text-cyan-100 text-sm">
              +18
            </div>
          </div>
        </div>

        <!-- First Project Selection -->
        <div class="flex items-center space-x-8 pl-24">
          <div class="bg-gradient-to-br from-cyan-900/20 to-cyan-900/5 rounded-2xl p-6 backdrop-blur-xl border border-cyan-500/20">
            <h3 class="text-xl font-bold text-yellow-400 mb-2">Project Selection</h3>
            <p class="text-cyan-100">Community-validated startups receive funding</p>
          </div>
        </div>

        <!-- Skill Contributions -->
        <div class="flex items-center justify-end space-x-8 mt-24">
          <div class="text-right space-y-6">
            <div>
              <h3 class="text-2xl font-bold text-yellow-400 mb-2">Contribute & Earn</h3>
              <p class="text-cyan-100">Add value with your unique skills</p>
            </div>
            <div class="flex justify-end gap-2 flex-wrap">
              <span class="px-3 py-1 rounded-full bg-yellow-400/10 text-yellow-400 text-sm">Development</span>
              <span class="px-3 py-1 rounded-full bg-cyan-400/10 text-cyan-400 text-sm">Marketing</span>
              <span class="px-3 py-1 rounded-full bg-yellow-400/10 text-yellow-400 text-sm">Design</span>
              <span class="px-3 py-1 rounded-full bg-cyan-400/10 text-cyan-400 text-sm">Strategy</span>
            </div>
          </div>
          <div class="relative">
            <div class="flex flex-col gap-3">
              <Avatar seed="dev1" />
              <Avatar seed="marketing1" />
              <Avatar seed="design1" />
            </div>
            <div class="absolute -right-4 top-1/2 -translate-y-1/2 flex items-center">
              <div class="w-8 h-8 rounded-full bg-yellow-400 flex items-center justify-center text-black text-xs">
                +€
              </div>
            </div>
          </div>
        </div>

        <!-- Revenue & Ownership -->
        <div class="flex items-center space-x-8 pl-24 mt-24">
          <div class="bg-gradient-to-br from-cyan-900/20 to-cyan-900/5 rounded-2xl p-8 backdrop-blur-xl border border-cyan-500/20 space-y-6">
            <div>
              <h3 class="text-xl font-bold text-yellow-400 mb-2">Shared Success</h3>
              <p class="text-cyan-100">Every contribution grows your ownership</p>
            </div>
            <div class="flex gap-4">
              <div class="flex-1 p-3 rounded-xl bg-cyan-400/5 border border-cyan-400/10">
                <p class="text-sm text-cyan-100 mb-1">Revenue Share</p>
                <p class="text-lg text-yellow-400">75%</p>
              </div>
              <div class="flex-1 p-3 rounded-xl bg-cyan-400/5 border border-cyan-400/10">
                <p class="text-sm text-cyan-100 mb-1">Ownership</p>
                <p class="text-lg text-yellow-400">GmbH Shares</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- System Benefits -->
      <div class="grid grid-cols-3 gap-8 mt-32">
        <div class="text-center space-y-3">
          <div class="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-cyan-400 mx-auto flex items-center justify-center">
            <span class="text-xl">🗳️</span>
          </div>
          <h4 class="text-lg font-bold text-yellow-400">Democratic</h4>
          <p class="text-cyan-100/80 text-sm">Every voice matters in our proposal system</p>
        </div>
        <div class="text-center space-y-3">
          <div class="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-cyan-400 mx-auto flex items-center justify-center">
            <span class="text-xl">💪</span>
          </div>
          <h4 class="text-lg font-bold text-yellow-400">Skill-Based</h4>
          <p class="text-cyan-100/80 text-sm">Contribute what you do best</p>
        </div>
        <div class="text-center space-y-3">
          <div class="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-cyan-400 mx-auto flex items-center justify-center">
            <span class="text-xl">📈</span>
          </div>
          <h4 class="text-lg font-bold text-yellow-400">Value Growth</h4>
          <p class="text-cyan-100/80 text-sm">Your stake grows with every contribution</p>
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
