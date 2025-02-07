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
<section class="min-h-screen flex flex-col justify-center items-center p-8 pt-32">
  <div class="space-y-16 text-center">
    <h1 class="text-[14rem] font-bold bg-gradient-to-r from-yellow-400 via-cyan-400 to-cyan-600 text-transparent bg-clip-text leading-none tracking-tight">
      RISE
    </h1>
    <div class="space-y-16">
      <p class="text-4xl font-light text-cyan-100/90">Work Freely. Create Value. Build Ownership.</p>
      
      <div class="text-xl text-cyan-100/80">
        Start with just <span class="text-yellow-400 font-bold">€1 daily</span> and unlock your full potential
      </div>

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
          <span class="font-semibold text-yellow-400">21 Founders</span> Already Creating Their Future
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
                  <span class="bg-gradient-to-r from-cyan-400 to-cyan-300 text-transparent bg-clip-text">Our Future</span>
                  <div class="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-cyan-400 to-transparent"></div>
                </span>
              </h2>
            </div>
          </div>
          
          <div class="flex justify-center items-center space-x-4 mt-12">
            <div class="px-4 py-2 rounded-full bg-cyan-400/10 backdrop-blur-sm border border-cyan-400/20 text-cyan-100">
              Community Owned
            </div>
            <div class="w-2 h-2 rounded-full bg-yellow-400"></div>
            <div class="px-4 py-2 rounded-full bg-yellow-400/10 backdrop-blur-sm border border-yellow-400/20 text-yellow-400">
              Decentralized
            </div>
            <div class="w-2 h-2 rounded-full bg-cyan-400"></div>
            <div class="px-4 py-2 rounded-full bg-cyan-400/10 backdrop-blur-sm border border-cyan-400/20 text-cyan-100">
              Digital GmbH Shares
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
        Together we create
      </h2>
      <div class="h-8"></div>
      <p class="text-3xl font-light text-cyan-100">
        <span class="text-yellow-400 font-bold">€365</span> a year into our community-owned VisionCreator pool
      </p>
      <p class="text-xl text-cyan-100/80">Propose startups, contribute skills, earn tokens & rewards</p>
    </div>

    <div class="h-32"></div>

    <!-- Journey Flow -->
    <div class="relative">
      <!-- Center Line -->
      <div class="absolute left-1/2 h-full w-px bg-gradient-to-b from-yellow-400/50 via-cyan-400/50 to-transparent"></div>

      <div class="grid grid-cols-2 gap-24">
        <!-- Community Voting -->
        <div class="flex items-center justify-end space-x-8">
          <div class="text-right">
            <h3 class="text-2xl font-bold text-yellow-400 mb-2">Decentralized Voting</h3>
            <p class="text-cyan-100 mb-4">Vote on startup proposals at each milestone</p>
            <div class="flex justify-end space-x-2">
              <span class="px-3 py-1 rounded-full bg-cyan-400/10 text-cyan-100 text-sm">Make Proposals</span>
              <span class="px-3 py-1 rounded-full bg-cyan-400/10 text-cyan-100 text-sm">Vote Together</span>
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

        <!-- Contribution Benefits -->
        <div class="flex items-center space-x-8 pl-24">
          <div class="bg-gradient-to-br from-cyan-900/20 to-cyan-900/5 rounded-2xl p-6 backdrop-blur-xl border border-cyan-500/20">
            <h3 class="text-xl font-bold text-yellow-400 mb-2">Multiple Opportunities</h3>
            <p class="text-cyan-100">Each contribution can earn tokens & rewards</p>
          </div>
        </div>

        <!-- Skill Contributions -->
        <div class="flex items-center justify-end space-x-8 mt-24">
          <div class="text-right space-y-6">
            <div>
              <h3 class="text-2xl font-bold text-yellow-400 mb-2">Build & Earn</h3>
              <p class="text-cyan-100">Get rewarded from the VisionCreator pool</p>
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

        <!-- Community Success -->
        <div class="flex items-center space-x-8 pl-24 mt-24">
          <div class="bg-gradient-to-br from-cyan-900/20 to-cyan-900/5 rounded-2xl p-8 backdrop-blur-xl border border-cyan-500/20 space-y-6">
            <div>
              <h3 class="text-xl font-bold text-yellow-400 mb-2">Rise Together</h3>
              <p class="text-cyan-100">Your success is the community's success</p>
            </div>
            <div class="flex gap-4">
              <div class="flex-1 p-3 rounded-xl bg-cyan-400/5 border border-cyan-400/10">
                <p class="text-sm text-cyan-100 mb-1">Community Pool</p>
                <p class="text-lg text-yellow-400">75%</p>
              </div>
              <div class="flex-1 p-3 rounded-xl bg-cyan-400/5 border border-cyan-400/10">
                <p class="text-sm text-cyan-100 mb-1">DAO Shares</p>
                <p class="text-lg text-yellow-400">Digital GmbH</p>
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
          <h4 class="text-lg font-bold text-yellow-400">Decentralized</h4>
          <p class="text-cyan-100/80 text-sm">Community-driven DAO governance</p>
        </div>
        <div class="text-center space-y-3">
          <div class="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-cyan-400 mx-auto flex items-center justify-center">
            <span class="text-xl">💪</span>
          </div>
          <h4 class="text-lg font-bold text-yellow-400">Contribute & Earn</h4>
          <p class="text-cyan-100/80 text-sm">Multiple ways to earn rewards</p>
        </div>
        <div class="text-center space-y-3">
          <div class="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-cyan-400 mx-auto flex items-center justify-center">
            <span class="text-xl">📈</span>
          </div>
          <h4 class="text-lg font-bold text-yellow-400">Shared Growth</h4>
          <p class="text-cyan-100/80 text-sm">Own the platform & its ventures</p>
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
      <!-- Side Benefits -->
      <div class="grid grid-cols-2 gap-24">
        <!-- Skills & Value -->
        <div class="group relative flex items-center">
          <div class="absolute inset-0 bg-gradient-to-br from-yellow-400/0 to-cyan-400/0 group-hover:from-yellow-400/10 group-hover:to-cyan-400/10 rounded-3xl transition-all duration-700 blur-xl"></div>
          <div class="w-full bg-slate-900/50 backdrop-blur-sm rounded-3xl p-8 border border-transparent group-hover:border-cyan-500/40 transition-all duration-500 relative">
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

        <!-- Token Growth -->
        <div class="group relative">
          <div class="absolute inset-0 bg-gradient-to-br from-yellow-400/0 to-cyan-400/0 group-hover:from-yellow-400/10 group-hover:to-cyan-400/10 rounded-3xl transition-all duration-700 blur-xl"></div>
          <div class="bg-slate-900/50 backdrop-blur-sm rounded-3xl p-8 border border-transparent group-hover:border-cyan-500/40 transition-all duration-500 relative">
            <div class="flex flex-col items-center text-center">
              <div class="flex -space-x-2 mb-6 transform group-hover:scale-110 transition-transform duration-500">
                <Avatar seed="early1" />
                <Avatar seed="early2" />
                <div class="w-8 h-8 rounded-full bg-gradient-to-r from-yellow-400 to-cyan-400 flex items-center justify-center text-white text-xs font-bold">GmbH</div>
              </div>
              <h3 class="text-3xl font-bold text-yellow-400 mb-6">Token Growth</h3>
              <div class="flex flex-col gap-8">
                <!-- Personal Growth -->
                <div class="space-y-2">
                  <div class="w-12 h-12 rounded-full bg-gradient-to-r from-yellow-400 to-cyan-400 mx-auto flex items-center justify-center text-black">
                    👤
                  </div>
                  <h4 class="text-xl font-semibold text-cyan-100">Personal Rise</h4>
                  <div class="space-y-2 text-gray-300/80">
                    <p class="group-hover:text-cyan-100 transition-colors duration-300">Portfolio value grows</p>
                    <p class="group-hover:text-cyan-100 transition-colors duration-300">Skill recognition</p>
                    <p class="group-hover:text-cyan-100 transition-colors duration-300">Real company ownership</p>
                  </div>
                </div>
                <!-- Project Growth -->
                <div class="pt-8 border-t border-cyan-500/20 space-y-2">
                  <div class="w-12 h-12 rounded-full bg-gradient-to-r from-yellow-400 to-cyan-400 mx-auto flex items-center justify-center text-black">
                    🚀
                  </div>
                  <h4 class="text-xl font-semibold text-cyan-100">Project Success</h4>
                  <div class="space-y-2 text-gray-300/80">
                    <p class="group-hover:text-cyan-100 transition-colors duration-300">Co-own what you build</p>
                    <p class="group-hover:text-cyan-100 transition-colors duration-300">Share project growth</p>
                    <p class="group-hover:text-cyan-100 transition-colors duration-300">Secure permanent rights</p>
                  </div>
                </div>
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
    <p class="text-2xl text-cyan-100 mt-4">Each milestone unlocks bigger ventures</p>
  </div>

  <!-- Fibonacci Spiral Journey -->
  <div class="max-w-7xl mx-auto px-8">
    <!-- 144 Launch -->
    <div class="group relative flex items-center mb-48">
      <div class="absolute top-0 left-1/2 w-px h-full bg-gradient-to-b from-yellow-400 via-cyan-400 to-transparent"></div>
      <div class="w-full max-w-3xl mx-auto">
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

    <!-- 233 Second Venture -->
    <div class="group relative flex items-center mb-48">
      <div class="absolute top-0 left-1/2 w-px h-full bg-gradient-to-b from-yellow-400 via-cyan-400 to-transparent"></div>
      <div class="w-full max-w-4xl mx-auto">
        <div class="relative bg-slate-900/50 backdrop-blur-xl rounded-3xl border border-cyan-500/20 p-12 hover:border-cyan-400/40 transition-all duration-500 scale-105">
          <div class="absolute -top-6 left-1/2 -translate-x-1/2">
            <div class="flex -space-x-2">
              <Avatar seed="voter1" />
              <Avatar seed="voter2" />
              <Avatar seed="voter3" />
              <div class="w-14 h-14 rounded-full bg-gradient-to-r from-yellow-400 to-cyan-400 flex items-center justify-center text-black font-bold text-lg">
                233
              </div>
            </div>
          </div>
          <div class="text-center space-y-6">
            <h3 class="text-5xl font-bold text-yellow-400">Second Venture</h3>
            <p class="text-xl text-cyan-100">Our community grows stronger</p>
            <div class="flex justify-center gap-4">
              <span class="px-6 py-3 rounded-full bg-cyan-400/10 text-cyan-100 text-lg">€85k VisionCreator Pool</span>
              <span class="px-6 py-3 rounded-full bg-yellow-400/10 text-yellow-400 text-lg">233 Visionaries</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Community Growth -->
    <div class="group relative flex items-center mb-48">
      <div class="absolute top-0 left-1/2 w-px h-full bg-gradient-to-b from-yellow-400 via-cyan-400 to-transparent"></div>
      <div class="w-full max-w-5xl mx-auto">
        <div class="relative bg-slate-900/50 backdrop-blur-xl rounded-3xl border border-cyan-500/20 p-16 hover:border-cyan-400/40 transition-all duration-500 scale-110">
          <div class="absolute -top-8 left-1/2 -translate-x-1/2">
            <div class="flex -space-x-2">
              <Avatar seed="dev1" />
              <Avatar seed="designer1" />
              <Avatar seed="marketer1" />
              <div class="w-16 h-16 rounded-full bg-gradient-to-r from-yellow-400 to-cyan-400 flex items-center justify-center text-black font-bold text-xl">
                10k+
              </div>
            </div>
          </div>
          <div class="text-center space-y-8">
            <h3 class="text-6xl font-bold text-yellow-400">Growing Impact</h3>
            <p class="text-2xl text-cyan-100">Thousands join our vision</p>
            <div class="flex justify-center gap-6">
              <span class="px-8 py-4 rounded-full bg-cyan-400/10 text-cyan-100 text-xl">€3.6M VisionCreator Pool</span>
              <span class="px-8 py-4 rounded-full bg-yellow-400/10 text-yellow-400 text-xl">10,000 Visionaries</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Million Strong -->
    <div class="group relative flex items-center">
      <div class="w-full max-w-6xl mx-auto">
        <div class="relative bg-slate-900/50 backdrop-blur-xl rounded-3xl border border-cyan-500/20 p-20 hover:border-cyan-400/40 transition-all duration-500 scale-115">
          <div class="absolute -top-10 left-1/2 -translate-x-1/2">
            <div class="flex -space-x-2">
              <Avatar seed="eco1" />
              <Avatar seed="eco2" />
              <Avatar seed="eco3" />
              <div class="w-20 h-20 rounded-full bg-gradient-to-r from-yellow-400 to-cyan-400 flex items-center justify-center text-black font-bold text-2xl">
                1M+
              </div>
            </div>
          </div>
          <div class="text-center space-y-10">
            <h3 class="text-7xl font-bold text-yellow-400">Million Strong</h3>
            <p class="text-3xl text-cyan-100">A community that moves markets</p>
            <div class="flex justify-center gap-8">
              <span class="px-10 py-5 rounded-full bg-cyan-400/10 text-cyan-100 text-2xl">€365M VisionCreator Pool</span>
              <span class="px-10 py-5 rounded-full bg-yellow-400/10 text-yellow-400 text-2xl">1,000,000 Visionaries</span>
            </div>
            <p class="text-xl text-cyan-100/80 mt-8">Together we fund ventures that change the world</p>
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
