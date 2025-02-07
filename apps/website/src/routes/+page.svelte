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
    <div class="space-y-12">
      <div class="flex flex-col items-center space-y-8">
        <div class="flex items-center space-x-3 text-3xl text-cyan-100 font-light tracking-wide">
          <span class="relative">
            Together
            <div class="absolute -bottom-2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent"></div>
          </span>
          <span class="relative">
            we invest
            <div class="absolute -bottom-2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-yellow-400 to-transparent"></div>
          </span>
        </div>
        
        <div class="text-center space-y-6">
          <div class="relative">
            <h2 class="text-7xl font-bold leading-tight">
              <span class="relative inline-block">
                <span class="text-yellow-400">€1</span>
                <div class="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-yellow-400 to-transparent"></div>
              </span>
              <span class="text-3xl ml-4 text-cyan-100">Daily</span>
            </h2>
            <div class="mt-4">
              <h2 class="text-8xl font-bold">
                Into
                <span class="relative inline-block ml-4">
                  <span class="bg-gradient-to-r from-cyan-400 to-cyan-300 text-transparent bg-clip-text">Ownership</span>
                  <div class="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-cyan-400 to-transparent"></div>
                </span>
              </h2>
            </div>
          </div>
          
          <div class="flex justify-center items-center space-x-4 mt-12">
            <div class="px-4 py-2 rounded-full bg-cyan-400/10 backdrop-blur-sm border border-cyan-400/20 text-cyan-100">
              Daily Growth
            </div>
            <div class="w-2 h-2 rounded-full bg-yellow-400"></div>
            <div class="px-4 py-2 rounded-full bg-yellow-400/10 backdrop-blur-sm border border-yellow-400/20 text-yellow-400">
              Consistent Investment
            </div>
            <div class="w-2 h-2 rounded-full bg-cyan-400"></div>
            <div class="px-4 py-2 rounded-full bg-cyan-400/10 backdrop-blur-sm border border-cyan-400/20 text-cyan-100">
              Shared Success
            </div>
          </div>
        </div>
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
<section class="min-h-screen py-32 px-8 relative overflow-hidden">
  <div class="max-w-7xl mx-auto relative">
    <!-- Title -->
    <div class="text-center mb-32">
      <h2 class="text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-cyan-400">
        Your Rise
      </h2>
    </div>

    <!-- Benefits Tree -->
    <div class="relative">
      <!-- Skills & Value (Center) -->
      <div class="max-w-2xl mx-auto mb-32">
        <div class="group relative">
          <div class="absolute inset-0 bg-gradient-to-r from-yellow-400/0 via-cyan-400/0 to-yellow-400/0 group-hover:via-cyan-400/20 rounded-3xl transition-all duration-700 blur-xl"></div>
          <div class="bg-slate-900/50 backdrop-blur-sm rounded-3xl p-8 border border-transparent group-hover:border-cyan-500/40 transition-all duration-500 relative">
            <div class="flex flex-col items-center text-center">
              <div class="flex -space-x-2 mb-6 transform group-hover:scale-110 transition-transform duration-500">
                <Avatar seed="dev" />
                <Avatar seed="designer" />
                <Avatar seed="marketer" />
              </div>
              <h3 class="text-3xl font-bold text-yellow-400 mb-6">Skills & Value</h3>
              <div class="space-y-4 text-gray-300/80">
                <p class="group-hover:text-cyan-100 transition-colors duration-300">Use your skills to build value</p>
                <p class="group-hover:text-cyan-100 transition-colors duration-300">Choose projects you love</p>
                <p class="group-hover:text-cyan-100 transition-colors duration-300">Grow your professional portfolio</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Side Benefits -->
      <div class="grid grid-cols-2 gap-24">
        <!-- Token Growth -->
        <div class="group relative">
          <div class="absolute inset-0 bg-gradient-to-br from-yellow-400/0 to-cyan-400/0 group-hover:from-yellow-400/10 group-hover:to-cyan-400/10 rounded-3xl transition-all duration-700 blur-xl"></div>
          <div class="bg-slate-900/50 backdrop-blur-sm rounded-3xl p-8 border border-transparent group-hover:border-cyan-500/40 transition-all duration-500 relative">
            <div class="flex flex-col items-center text-center">
              <div class="flex -space-x-2 mb-6 transform group-hover:scale-110 transition-transform duration-500">
                <Avatar seed="early1" />
                <Avatar seed="early2" />
                <div class="w-8 h-8 rounded-full bg-gradient-to-r from-yellow-400 to-cyan-400 flex items-center justify-center text-white text-xs font-bold">1st</div>
              </div>
              <h3 class="text-3xl font-bold text-yellow-400 mb-6">Token Growth</h3>
              <div class="space-y-4 text-gray-300/80">
                <p class="group-hover:text-cyan-100 transition-colors duration-300">Early member advantages</p>
                <p class="group-hover:text-cyan-100 transition-colors duration-300">Value increases over time</p>
                <p class="group-hover:text-cyan-100 transition-colors duration-300">Limited membership spots</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Digital Shares -->
        <div class="group relative">
          <div class="absolute inset-0 bg-gradient-to-br from-cyan-400/0 to-yellow-400/0 group-hover:from-cyan-400/10 group-hover:to-yellow-400/10 rounded-3xl transition-all duration-700 blur-xl"></div>
          <div class="bg-slate-900/50 backdrop-blur-sm rounded-3xl p-8 border border-transparent group-hover:border-cyan-500/40 transition-all duration-500 relative">
            <div class="flex flex-col items-center text-center">
              <div class="flex -space-x-2 mb-6 transform group-hover:scale-110 transition-transform duration-500">
                <Avatar seed="owner1" />
                <Avatar seed="owner2" />
                <div class="w-8 h-8 rounded-full bg-gradient-to-r from-yellow-400 to-cyan-400 flex items-center justify-center text-xs font-bold">GmbH</div>
              </div>
              <h3 class="text-3xl font-bold text-yellow-400 mb-6">Digital Shares</h3>
              <div class="space-y-4 text-gray-300/80">
                <p class="group-hover:text-cyan-100 transition-colors duration-300">Real company ownership</p>
                <p class="group-hover:text-cyan-100 transition-colors duration-300">Build your asset portfolio</p>
                <p class="group-hover:text-cyan-100 transition-colors duration-300">Secure permanent rights</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Fibonacci Journey -->
<section class="relative py-32 overflow-hidden">
  <!-- Journey Heading -->
  <div class="text-center mb-32">
    <h2 class="text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-cyan-400">
      Fibonacci Growth
    </h2>
    <p class="text-2xl text-cyan-100 mt-4">Each milestone unlocks the next venture</p>
  </div>

  <!-- Fibonacci Spiral Journey -->
  <div class="max-w-7xl mx-auto px-8">
    <!-- 144 Launch -->
    <div class="group relative flex items-center mb-48">
      <div class="absolute top-0 left-1/2 w-px h-full bg-gradient-to-b from-yellow-400 via-cyan-400 to-transparent"></div>
      <div class="w-full">
        <div class="relative bg-slate-900/50 backdrop-blur-xl rounded-3xl border border-cyan-500/20 p-12 hover:border-cyan-400/40 transition-all duration-500">
          <div class="absolute -top-6 left-1/2 -translate-x-1/2">
            <div class="flex -space-x-2">
              <Avatar seed="launch1" />
              <Avatar seed="launch2" />
              <Avatar seed="launch3" />
              <div class="w-12 h-12 rounded-full bg-gradient-to-r from-yellow-400 to-cyan-400 flex items-center justify-center text-black font-bold">
                144
              </div>
            </div>
          </div>
          <div class="text-center space-y-6">
            <h3 class="text-4xl font-bold text-yellow-400">Platform Launch</h3>
            <div class="flex justify-center gap-4">
              <span class="px-4 py-2 rounded-full bg-cyan-400/10 text-cyan-100">Community Platform</span>
              <span class="px-4 py-2 rounded-full bg-yellow-400/10 text-yellow-400">Digital Shares</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 233 First Startup -->
    <div class="group relative flex items-center mb-48">
      <div class="absolute top-0 left-1/2 w-px h-full bg-gradient-to-b from-yellow-400 via-cyan-400 to-transparent"></div>
      <div class="w-full">
        <div class="relative bg-slate-900/50 backdrop-blur-xl rounded-3xl border border-cyan-500/20 p-12 hover:border-cyan-400/40 transition-all duration-500">
          <div class="absolute -top-6 left-1/2 -translate-x-1/2">
            <div class="flex -space-x-2">
              <Avatar seed="voter1" />
              <Avatar seed="voter2" />
              <Avatar seed="voter3" />
              <div class="w-12 h-12 rounded-full bg-gradient-to-r from-yellow-400 to-cyan-400 flex items-center justify-center text-black font-bold">
                233
              </div>
            </div>
          </div>
          <div class="text-center space-y-6">
            <h3 class="text-4xl font-bold text-yellow-400">First Venture Vote</h3>
            <div class="flex justify-center gap-4">
              <span class="px-4 py-2 rounded-full bg-cyan-400/10 text-cyan-100">Community Selection</span>
              <span class="px-4 py-2 rounded-full bg-yellow-400/10 text-yellow-400">Revenue Begins</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 377 Network Effects -->
    <div class="group relative flex items-center mb-48">
      <div class="absolute top-0 left-1/2 w-px h-full bg-gradient-to-b from-yellow-400 via-cyan-400 to-transparent"></div>
      <div class="w-full">
        <div class="relative bg-slate-900/50 backdrop-blur-xl rounded-3xl border border-cyan-500/20 p-12 hover:border-cyan-400/40 transition-all duration-500">
          <div class="absolute -top-6 left-1/2 -translate-x-1/2">
            <div class="flex -space-x-2">
              <Avatar seed="dev1" />
              <Avatar seed="designer1" />
              <Avatar seed="marketer1" />
              <div class="w-12 h-12 rounded-full bg-gradient-to-r from-yellow-400 to-cyan-400 flex items-center justify-center text-black font-bold">
                377
              </div>
            </div>
          </div>
          <div class="text-center space-y-6">
            <h3 class="text-4xl font-bold text-yellow-400">Network Growth</h3>
            <div class="flex justify-center gap-4">
              <span class="px-4 py-2 rounded-full bg-cyan-400/10 text-cyan-100">Multiple Ventures</span>
              <span class="px-4 py-2 rounded-full bg-yellow-400/10 text-yellow-400">Accelerating Growth</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 610 Ecosystem -->
    <div class="group relative flex items-center">
      <div class="w-full">
        <div class="relative bg-slate-900/50 backdrop-blur-xl rounded-3xl border border-cyan-500/20 p-12 hover:border-cyan-400/40 transition-all duration-500">
          <div class="absolute -top-6 left-1/2 -translate-x-1/2">
            <div class="flex -space-x-2">
              <Avatar seed="eco1" />
              <Avatar seed="eco2" />
              <Avatar seed="eco3" />
              <div class="w-12 h-12 rounded-full bg-gradient-to-r from-yellow-400 to-cyan-400 flex items-center justify-center text-black font-bold">
                610
              </div>
            </div>
          </div>
          <div class="text-center space-y-6">
            <h3 class="text-4xl font-bold text-yellow-400">Thriving Ecosystem</h3>
            <div class="flex justify-center gap-4">
              <span class="px-4 py-2 rounded-full bg-cyan-400/10 text-cyan-100">Market Impact</span>
              <span class="px-4 py-2 rounded-full bg-yellow-400/10 text-yellow-400">Sustainable Growth</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Decorative Elements -->
    <div class="absolute top-0 left-0 w-full h-full pointer-events-none">
      <div class="absolute top-1/4 -left-48 w-96 h-96 bg-yellow-400/10 rounded-full blur-3xl"></div>
      <div class="absolute top-3/4 -right-48 w-96 h-96 bg-cyan-400/10 rounded-full blur-3xl"></div>
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
