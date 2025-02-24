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
<section class="min-h-screen flex flex-col justify-center items-center p-8 pt-32 relative">
  <!-- Animated Background Elements -->
  <div class="absolute inset-0 overflow-hidden pointer-events-none">
    <div class="absolute top-1/4 -left-48 w-96 h-96 bg-yellow-400/10 rounded-full blur-3xl animate-pulse"></div>
    <div class="absolute bottom-1/4 -right-48 w-96 h-96 bg-cyan-400/10 rounded-full blur-3xl animate-pulse"></div>
    <!-- 3D-like floating elements -->
    <div class="absolute top-1/3 left-1/4 w-24 h-24 bg-gradient-to-r from-yellow-400/20 to-cyan-400/20 rounded-xl rotate-12 animate-float-slow"></div>
    <div class="absolute bottom-1/3 right-1/4 w-32 h-32 bg-gradient-to-r from-cyan-400/20 to-yellow-400/20 rounded-xl -rotate-12 animate-float-delayed"></div>
  </div>

  <div class="space-y-16 text-center relative z-10">
    <div class="space-y-8">
      <!-- Enhanced WHO -->
      <div class="flex justify-center gap-4 animate-fade-in">
        <span class="px-4 py-2 rounded-full bg-yellow-400/10 text-yellow-400 text-sm">For Builders</span>
        <span class="px-4 py-2 rounded-full bg-cyan-400/10 text-cyan-400 text-sm">For Creators</span>
        <span class="px-4 py-2 rounded-full bg-yellow-400/10 text-yellow-400 text-sm">For Visionaries</span>
      </div>
      
      <h1 class="text-[14rem] font-bold bg-gradient-to-r from-yellow-400 via-cyan-400 to-cyan-600 text-transparent bg-clip-text leading-none tracking-tight animate-title-rise">
        RISE
    </h1>
    
      <!-- Enhanced WHY/WHAT -->
      <div class="space-y-6">
        <p class="text-4xl font-light text-cyan-100/90 animate-slide-up">The New Era of Work is Here</p>
        <p class="text-2xl text-cyan-100/70 animate-slide-up-delayed">Where Builders Become Owners</p>
      </div>
    </div>

    <!-- Enhanced PAS Framework -->
    <div class="max-w-2xl mx-auto space-y-8">
      <div class="space-y-6">
        <!-- Problem & Agitation -->
        <div class="space-y-4 animate-fade-in-delayed">
          <div class="flex flex-col items-center gap-2">
            <p class="text-xl text-cyan-100/80">Traditional work keeps builders as employees</p>
            <p class="text-2xl text-yellow-400">But what if you could own what you create?</p>
          </div>
        </div>
        
        <!-- Solution -->
        <div class="bg-gradient-to-r from-yellow-400/5 to-cyan-400/5 rounded-xl p-6 animate-fade-in-delayed-2">
          <p class="text-2xl text-cyan-100">Join a community where your skills build your ownership</p>
          <p class="text-lg text-cyan-100/70 mt-2">Start with just €1 daily, become a co-owner in every project</p>
        </div>
      </div>
      
      <!-- Enhanced CTV Buttons -->
      <div class="flex justify-center items-center space-x-6 animate-fade-in-up">
        <button class="group px-8 py-4 bg-gradient-to-r from-yellow-400 to-cyan-400 rounded-full text-black font-bold hover:scale-105 transition-all duration-300 relative overflow-hidden">
          <div class="absolute inset-0 bg-gradient-to-r from-yellow-400/50 to-cyan-400/50 blur-xl group-hover:animate-pulse"></div>
          <div class="relative">
            <span class="text-xl">Begin Your Ownership Journey</span>
            <p class="text-sm opacity-70">€1 Daily Builds Your Future</p>
          </div>
        </button>
        <a href="#how-it-works" class="px-6 py-4 border border-cyan-400/20 rounded-full text-cyan-100 hover:bg-cyan-400/10 transition-all duration-300 hover:border-cyan-400/40">
          See How It Works →
        </a>
      </div>
    </div>

    <!-- Enhanced Social Proof -->
    <div class="flex flex-col items-center space-y-8 animate-fade-in-up-delayed">
      <!-- Community Stats -->
      <div class="grid grid-cols-3 gap-8 w-full max-w-2xl">
        <div class="text-center">
          <p class="text-2xl font-bold text-yellow-400 animate-number">21</p>
          <p class="text-sm text-cyan-100/70">Active Founders</p>
        </div>
        <div class="text-center">
          <p class="text-2xl font-bold text-yellow-400 animate-number">€75K+</p>
          <p class="text-sm text-cyan-100/70">Pool Value</p>
        </div>
        <div class="text-center">
          <p class="text-2xl font-bold text-yellow-400 animate-number">100%</p>
          <p class="text-sm text-cyan-100/70">Community Owned</p>
        </div>
      </div>

      <!-- Testimonial -->
      <div class="bg-slate-900/50 backdrop-blur-xl rounded-2xl p-6 max-w-xl">
        <div class="flex items-center gap-4 mb-4">
          <Avatar seed="founder1" />
          <div>
            <p class="text-yellow-400 font-semibold">Sarah K.</p>
            <p class="text-sm text-cyan-100/70">Full-Stack Developer</p>
          </div>
        </div>
        <p class="text-cyan-100/80 italic">"From freelancer to startup co-owner. RISE transformed how I think about my career - now I build real value for myself, not just clients."</p>
      </div>

      <!-- Trust Indicators -->
      <div class="flex items-center gap-6">
        <div class="px-4 py-2 rounded-full bg-cyan-400/10 backdrop-blur-sm border border-cyan-400/20">
          <span class="text-cyan-100 text-sm">🔒 Secure GmbH Structure</span>
        </div>
        <div class="px-4 py-2 rounded-full bg-yellow-400/10 backdrop-blur-sm border border-yellow-400/20">
          <span class="text-yellow-400 text-sm">⚡ Daily Rewards</span>
        </div>
        <div class="px-4 py-2 rounded-full bg-cyan-400/10 backdrop-blur-sm border border-cyan-400/20">
          <span class="text-cyan-100 text-sm">🌟 Community Driven</span>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Features & Benefits -->
<section class="min-h-screen flex items-center py-32">
  <div class="max-w-7xl mx-auto px-8">
    <div class="grid grid-cols-2 gap-16">
      <!-- Features Column -->
      <div class="space-y-8">
        <h3 class="text-2xl font-bold text-yellow-400">How It Works</h3>
        <div class="space-y-6">
          <div class="flex items-start space-x-4">
            <div class="w-8 h-8 rounded-full bg-cyan-400/10 flex items-center justify-center mt-1">1</div>
            <div class="flex-1">
              <h4 class="text-xl font-semibold text-cyan-100">Daily Investment</h4>
              <p class="text-cyan-100/70">Invest €1 daily into the community pool</p>
            </div>
          </div>
          <div class="flex items-start space-x-4">
            <div class="w-8 h-8 rounded-full bg-cyan-400/10 flex items-center justify-center mt-1">2</div>
            <div class="flex-1">
              <h4 class="text-xl font-semibold text-cyan-100">Community Voting</h4>
              <p class="text-cyan-100/70">Vote on which projects to fund next</p>
            </div>
          </div>
          <div class="flex items-start space-x-4">
            <div class="w-8 h-8 rounded-full bg-cyan-400/10 flex items-center justify-center mt-1">3</div>
            <div class="flex-1">
              <h4 class="text-xl font-semibold text-cyan-100">Digital GmbH Shares</h4>
              <p class="text-cyan-100/70">Get real ownership through legal shares</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Benefits Column -->
      <div class="space-y-8">
        <h3 class="text-2xl font-bold text-yellow-400">Why It Matters</h3>
        <div class="space-y-6">
          <div class="p-6 rounded-xl bg-cyan-400/5 border border-cyan-400/10">
            <h4 class="text-xl font-semibold text-cyan-100 mb-2">Build Real Wealth</h4>
            <p class="text-cyan-100/70">Your contributions earn both immediate income and long-term ownership</p>
          </div>
          <div class="p-6 rounded-xl bg-cyan-400/5 border border-cyan-400/10">
            <h4 class="text-xl font-semibold text-cyan-100 mb-2">Work With Purpose</h4>
            <p class="text-cyan-100/70">Choose projects you believe in, work with like-minded visionaries</p>
          </div>
          <div class="p-6 rounded-xl bg-cyan-400/5 border border-cyan-400/10">
            <h4 class="text-xl font-semibold text-cyan-100 mb-2">Grow Together</h4>
            <p class="text-cyan-100/70">Be part of a community that supports and elevates each other</p>
          </div>
        </div>
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
              <span class="text-3xl ml-4 text-cyan-100">Daily Into</span>
            </h2>
            <div class="mt-4">
              <h2 class="text-8xl font-bold">
                <span class="relative inline-block">
                  <span class="bg-gradient-to-r from-cyan-400 to-cyan-300 text-transparent bg-clip-text">Your Future</span>
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

<!-- Vision Story -->
<section class="min-h-screen py-32 relative overflow-hidden">
  <div class="max-w-5xl mx-auto px-8">
    <!-- Transform Work -->
    <div class="group space-y-8 bg-slate-900/50 backdrop-blur-xl rounded-3xl p-12 border border-cyan-500/20 hover:border-cyan-400/40 transition-all duration-500 mb-24">
      <div class="flex items-center space-x-6">
        <div class="w-16 h-16 rounded-full bg-gradient-to-r from-yellow-400 to-cyan-400 flex items-center justify-center text-2xl">
          💫
        </div>
        <h3 class="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-cyan-400">
          Transform Purpose Into Prosperity
        </h3>
      </div>
      <div class="space-y-4 text-xl text-cyan-100/80">
        <p class="group-hover:translate-x-2 transition-transform duration-300">Own what you build, multiply your income streams</p>
        <p class="group-hover:translate-x-4 transition-transform duration-500">Your expertise becomes your investment</p>
        <p class="group-hover:translate-x-6 transition-transform duration-700">Work from anywhere, own everywhere</p>
      </div>
    </div>

    <!-- The Wall -->
    <div class="group relative mb-24">
      <div class="absolute inset-0 bg-gradient-to-br from-yellow-400/5 to-cyan-400/5 rounded-3xl transition-all duration-700 blur-xl"></div>
      <div class="relative grid grid-cols-2 gap-8 bg-slate-900/50 backdrop-blur-xl rounded-3xl p-12 border border-cyan-500/20">
        <div class="space-y-6 p-8 bg-slate-900/50 rounded-2xl border border-red-500/20">
          <div class="flex items-center space-x-4">
            <div class="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center text-xl">
              🧱
            </div>
            <h4 class="text-2xl font-bold text-red-400">The Wall</h4>
          </div>
          <ul class="space-y-4 text-cyan-100/70">
            <li class="flex items-center space-x-2 group-hover:translate-x-2 transition-transform duration-300">
              <span class="text-red-400">×</span>
              <span>Investment restricted to the wealthy</span>
            </li>
            <li class="flex items-center space-x-2 group-hover:translate-x-4 transition-transform duration-500">
              <span class="text-red-400">×</span>
              <span>Power concentrated at the top</span>
            </li>
            <li class="flex items-center space-x-2 group-hover:translate-x-6 transition-transform duration-700">
              <span class="text-red-400">×</span>
              <span>Builders lack real ownership</span>
            </li>
          </ul>
        </div>
        <div class="space-y-6 p-8 bg-slate-900/50 rounded-2xl border border-cyan-500/20">
          <div class="flex items-center space-x-4">
            <div class="w-10 h-10 rounded-full bg-gradient-to-r from-yellow-400 to-cyan-400 flex items-center justify-center text-xl">
              🔨
            </div>
            <h4 class="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-cyan-400">Breaking Through</h4>
          </div>
          <ul class="space-y-4 text-cyan-100/70">
            <li class="flex items-center space-x-2 group-hover:translate-x-2 transition-transform duration-300">
              <span class="text-yellow-400">✓</span>
              <span>Start with just €1 daily</span>
            </li>
            <li class="flex items-center space-x-2 group-hover:translate-x-4 transition-transform duration-500">
              <span class="text-yellow-400">✓</span>
              <span>Community-driven decisions</span>
            </li>
            <li class="flex items-center space-x-2 group-hover:translate-x-6 transition-transform duration-700">
              <span class="text-yellow-400">✓</span>
              <span>Real ownership in every venture</span>
            </li>
          </ul>
        </div>
      </div>
    </div>

    <!-- The Ecosystem -->
    <div class="group bg-slate-900/50 backdrop-blur-xl rounded-3xl p-12 border border-cyan-500/20 hover:border-cyan-400/40 transition-all duration-500">
      <div class="text-center mb-12">
        <h3 class="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-cyan-400">
          A New Way of Working Together
        </h3>
      </div>
      <div class="grid grid-cols-3 gap-8">
        <div class="group/card p-6 rounded-2xl bg-cyan-400/5 border border-cyan-400/10 hover:border-cyan-400/30 transition-all duration-300">
          <div class="flex flex-col items-center text-center space-y-4">
            <div class="w-16 h-16 rounded-full bg-gradient-to-r from-yellow-400 to-cyan-400 flex items-center justify-center text-2xl group-hover/card:scale-110 transition-transform duration-300">
              💰
            </div>
            <h4 class="text-xl font-bold text-yellow-400">Community Investment</h4>
            <p class="text-cyan-100/80">Pool resources & decide together</p>
          </div>
        </div>
        <div class="group/card p-6 rounded-2xl bg-cyan-400/5 border border-cyan-400/10 hover:border-cyan-400/30 transition-all duration-300">
          <div class="flex flex-col items-center text-center space-y-4">
            <div class="w-16 h-16 rounded-full bg-gradient-to-r from-yellow-400 to-cyan-400 flex items-center justify-center text-2xl group-hover/card:scale-110 transition-transform duration-300">
              🏛️
            </div>
            <h4 class="text-xl font-bold text-yellow-400">Hybrid Structure</h4>
            <p class="text-cyan-100/80">German GmbH + Community Power</p>
          </div>
        </div>
        <div class="group/card p-6 rounded-2xl bg-cyan-400/5 border border-cyan-400/10 hover:border-cyan-400/30 transition-all duration-300">
          <div class="flex flex-col items-center text-center space-y-4">
            <div class="w-16 h-16 rounded-full bg-gradient-to-r from-yellow-400 to-cyan-400 flex items-center justify-center text-2xl group-hover/card:scale-110 transition-transform duration-300">
              🌟
            </div>
            <h4 class="text-xl font-bold text-yellow-400">Fair Distribution</h4>
            <p class="text-cyan-100/80">Multiple ways to earn & own</p>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Decorative Elements -->
    <div class="absolute top-1/4 -left-48 w-96 h-96 bg-yellow-400/10 rounded-full blur-3xl"></div>
    <div class="absolute bottom-1/4 -right-48 w-96 h-96 bg-cyan-400/10 rounded-full blur-3xl"></div>
  </div>
</section>

<!-- Investment Journey -->
<section class="min-h-screen py-64">
  <div class="max-w-7xl mx-auto px-8">
    <div class="text-center space-y-12">
      <h2 class="text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-cyan-400">
        Our Investment Journey
      </h2>
      <div class="h-8"></div>
      <p class="text-3xl font-light text-cyan-100">
        From Ideas to Ownership: <span class="text-yellow-400 font-bold">€1 Daily</span>
      </p>
    </div>

    <div class="h-32"></div>

    <!-- Journey Flow -->
    <div class="relative">
      <!-- Center Line -->
      <div class="absolute left-1/2 h-full w-px bg-gradient-to-b from-yellow-400/50 via-cyan-400/50 to-transparent"></div>

      <div class="grid grid-cols-2 gap-24">
        <!-- Together We Vote -->
        <div class="flex items-center justify-end space-x-8">
          <div class="text-right">
            <h3 class="text-2xl font-bold text-yellow-400 mb-2">Together We Vote</h3>
            <p class="text-cyan-100 mb-4">Every milestone starts with your startup ideas</p>
            <div class="flex justify-end space-x-2">
              <span class="px-3 py-1 rounded-full bg-cyan-400/10 text-cyan-100 text-sm">Submit Ideas</span>
              <span class="px-3 py-1 rounded-full bg-yellow-400/10 text-yellow-400 text-sm">Vote Together</span>
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

        <!-- Together We Invest -->
        <div class="flex items-center space-x-8 pl-24">
          <div class="bg-gradient-to-br from-cyan-900/20 to-cyan-900/5 rounded-2xl p-6 backdrop-blur-xl border border-cyan-500/20">
            <h3 class="text-xl font-bold text-yellow-400 mb-2">Together We Invest</h3>
            <p class="text-cyan-100">Pool our €1 daily into chosen startups</p>
          </div>
        </div>

        <!-- Together We Build -->
        <div class="flex items-center justify-end space-x-8 mt-24">
          <div class="text-right space-y-6">
            <div>
              <h3 class="text-2xl font-bold text-yellow-400 mb-2">Together We Build</h3>
              <p class="text-cyan-100">Contribute skills & earn rewards</p>
            </div>
            <div class="flex justify-end gap-2 flex-wrap">
              <span class="px-3 py-1 rounded-full bg-yellow-400/10 text-yellow-400 text-sm">Development</span>
              <span class="px-3 py-1 rounded-full bg-cyan-400/10 text-cyan-400 text-sm">Marketing</span>
              <span class="px-3 py-1 rounded-full bg-yellow-400/10 text-yellow-400 text-sm">Design</span>
              <span class="px-3 py-1 rounded-full bg-cyan-400/10 text-cyan-400 text-sm">Strategy</span>
            </div>
          </div>
        </div>

        <!-- Together We Own -->
        <div class="flex items-center space-x-8 pl-24 mt-24">
          <div class="bg-gradient-to-br from-cyan-900/20 to-cyan-900/5 rounded-2xl p-8 backdrop-blur-xl border border-cyan-500/20 space-y-8">
            <div>
              <h3 class="text-xl font-bold text-yellow-400 mb-2">Together We Own</h3>
              <p class="text-cyan-100">Through Digital GmbH Shares</p>
            </div>
            <div class="flex flex-col gap-8">
              <div class="p-6 rounded-xl bg-cyan-400/5 border border-cyan-400/10">
                <p class="text-sm text-cyan-100 mb-4">Community Ownership</p>
                <div class="flex items-center justify-between space-x-8">
                  <span class="text-yellow-400 hover:scale-105 transition-transform duration-300">Every Startup</span>
                  <span class="text-cyan-100 animate-pulse">is</span>
                  <span class="text-yellow-400 hover:scale-105 transition-transform duration-300">Community Owned</span>
                </div>
              </div>
              <div class="p-6 rounded-xl bg-cyan-400/5 border border-cyan-400/10">
                <p class="text-sm text-cyan-100 mb-4">Digital GmbH Shares</p>
                <div class="flex items-center justify-between space-x-8">
                  <div class="flex flex-col items-center">
                    <span class="text-yellow-400 hover:scale-105 transition-transform duration-300">Contribute</span>
                    <span class="text-cyan-100/60 text-sm mt-1">Skills</span>
                  </div>
                  <span class="text-cyan-100 animate-pulse">→</span>
                  <div class="flex flex-col items-center">
                    <span class="text-yellow-400 hover:scale-105 transition-transform duration-300">Earn</span>
                    <span class="text-cyan-100/60 text-sm mt-1">Shares + €</span>
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

  @keyframes fade-in-delayed {
    0% { opacity: 0; }
    100% { opacity: 1; }
  }

  @keyframes fade-in-delayed-2 {
    0% { opacity: 0; }
    100% { opacity: 1; }
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

  .animate-number {
    @apply transition-all duration-300;
  }
  .animate-number:hover {
    @apply text-yellow-400 scale-110;
  }
</style>
