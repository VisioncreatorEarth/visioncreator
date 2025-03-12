<script lang="ts">
  import Avatar from '$lib/Avatar.svelte';
  import { onMount } from 'svelte';
  
  // Seeds for generating consistent avatars
  const seeds = [
    'alice', 'bob', 'charlie', 'david', 'eve', 
    'frank', 'grace', 'henry'
  ];
  
  let mounted = false;
  let memberCount = 27;
  
  // Animated counter for member count
  function animateCounter(element: HTMLElement | null, targetValue: number, duration: number): void {
    const startValue = 0;
    const startTime = Date.now();
    
    function updateCounter() {
      const currentTime = Date.now();
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function for smoother animation
      const easeOutQuad = progress * (2 - progress);
      const currentValue = Math.floor(startValue + (targetValue - startValue) * easeOutQuad);
      
      if (element) {
        element.textContent = String(currentValue);
      }
      
      if (progress < 1) {
        requestAnimationFrame(updateCounter);
      }
    }
    
    updateCounter();
  }
  
  onMount(() => {
    // Trigger the entry animation sequence
    setTimeout(() => {
      mounted = true;
      
      // Animate member counter after fade-in
      setTimeout(() => {
        const counterElement = document.getElementById('memberCounter');
        if (counterElement) {
          animateCounter(counterElement, memberCount, 2000);
        }
      }, 1000);
    }, 100);
  });
</script>

<!-- Main Content Wrapper with scrolling enabled -->
<div class="bg-black min-h-screen text-white overflow-y-auto">

<!-- Entry Animation Overlay -->
<div class="fixed inset-0 z-[100] pointer-events-none {mounted ? 'opacity-0 scale-110' : 'opacity-100 scale-100'} transition-all duration-1500 transform-gpu">
  <div class="absolute inset-0 bg-black flex items-center justify-center">
    <div class="text-center space-y-8 transform-gpu">
      <div class="text-8xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-cyan-400 to-cyan-600 animate-pulse relative">
        VisionCreator
      </div>
      <div class="text-3xl text-cyan-100/80 animate-fade-in-delayed mt-4">
        Create Through Voice. Own What You Build.
      </div>
      
      <!-- Loading spinner -->
      <div class="w-16 h-16 mx-auto mt-8 border-t-4 border-r-4 border-yellow-400 rounded-full animate-spin"></div>
    </div>
  </div>
</div>

<!-- Hero Section - Simplified in style of email app landing page -->
<section class="min-h-screen flex flex-col justify-center items-center p-8 relative overflow-hidden bg-black">
  <!-- Subtle background glow -->
  <div class="absolute inset-0 overflow-hidden pointer-events-none">
    <div class="absolute top-1/4 -left-48 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl"></div>
    <div class="absolute bottom-1/4 -right-48 w-96 h-96 bg-yellow-500/5 rounded-full blur-3xl"></div>
  </div>

  <div class="max-w-3xl mx-auto text-center space-y-8 relative z-10">
    <!-- Main Headline - WHO/WHY/WHAT Framework -->
    <h1 class="text-6xl sm:text-7xl font-bold text-white leading-tight animate-title-rise">
      The future of <span class="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-cyan-400">creation</span> is here
    </h1>
    
    <p class="text-xl text-gray-300 max-w-2xl mx-auto animate-slide-up">
      Experience ownership the way you want with VisionCreator — the first community-powered platform that puts your voice and ownership first.
    </p>
    
    <!-- Email/Signup Form -->
    <div class="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8 animate-fade-in-delayed">
      <input 
        type="email" 
        placeholder="you@example.com" 
        class="px-6 py-4 bg-gray-800/50 border border-gray-700 rounded-full text-white w-full sm:w-auto focus:outline-none focus:ring-2 focus:ring-cyan-400"
      />
      
      <button class="px-8 py-4 bg-gradient-to-r from-yellow-400 to-cyan-400 rounded-full text-black font-bold hover:scale-105 transition-all duration-300 shadow-lg shadow-cyan-500/20 w-full sm:w-auto">
        Join waitlist
      </button>
    </div>
    
    <!-- Social Proof -->
    <p class="text-2xl font-bold text-white animate-fade-in-delayed">
      <span id="memberCounter" class="text-cyan-400">0</span> people have already joined the waitlist
    </p>
  </div>
  
  <!-- App Preview - Added product visual -->
  <div class="w-full max-w-4xl mx-auto mt-16 px-4 animate-fade-in-delayed-2">
    <div class="relative bg-gray-900/70 backdrop-blur-md rounded-2xl overflow-hidden border border-gray-800 shadow-2xl shadow-cyan-500/10">
      <div class="aspect-video p-4">
        <div class="bg-gray-800 rounded-lg p-6 h-full flex flex-col">
          <div class="flex items-center gap-3 mb-6">
            <div class="w-3 h-3 rounded-full bg-red-400"></div>
            <div class="w-3 h-3 rounded-full bg-yellow-400"></div>
            <div class="w-3 h-3 rounded-full bg-green-400"></div>
            <div class="text-sm text-gray-400 ml-2">VisionCreator Interface</div>
          </div>
          
          <div class="flex-1 flex items-center justify-center">
            <div class="text-center">
              <div class="text-cyan-400 text-4xl mb-4 font-mono">"Create a weather app"</div>
              <div class="text-sm text-gray-400 mb-8">Creating your app through simple voice commands...</div>
              <div class="flex items-center gap-3 justify-center">
                <div class="w-4 h-4 rounded-full bg-cyan-400 animate-pulse"></div>
                <div class="w-4 h-4 rounded-full bg-cyan-400 animate-pulse delay-100"></div>
                <div class="w-4 h-4 rounded-full bg-cyan-400 animate-pulse delay-200"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Problem, Agitation, Solution Section (PAS Framework) -->
<section class="py-24 bg-gray-950 relative overflow-hidden">
  <div class="absolute inset-0 pointer-events-none">
    <div class="absolute top-1/4 -left-48 w-96 h-96 bg-yellow-500/5 rounded-full blur-3xl"></div>
    <div class="absolute bottom-1/4 -right-48 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl"></div>
  </div>

  <div class="max-w-5xl mx-auto px-8">
    <div class="text-center mb-16">
      <h2 class="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-cyan-400">
        Key Problems & Our Solutions
      </h2>
      <p class="text-xl text-gray-300 mt-4 max-w-2xl mx-auto">
        We've identified three core challenges in digital creation and developed direct solutions for each
      </p>
    </div>

    <!-- Problem-Solution Pairs -->
    <!-- Problem 1: Technical Creation Barrier -->
    <div class="mb-20">
      <div class="flex items-center justify-center gap-4 mb-8">
        <div class="h-px bg-red-500/30 flex-1"></div>
        <h3 class="text-2xl font-bold text-red-400 px-4">Problem 1: The Technical Creation Barrier</h3>
        <div class="h-px bg-red-500/30 flex-1"></div>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-12">
        <!-- Problem Statement -->
        <div class="bg-gray-900/30 backdrop-blur-xl rounded-3xl border border-red-500/20 p-8">
          <h4 class="text-xl font-bold text-red-400 mb-4">The Problem Staked:</h4>
          <p class="text-gray-300 mb-6 italic">
            "The tools to build valuable digital assets exist, but they're locked behind technical barriers most people can't overcome."
          </p>
          
          <p class="text-gray-300 mb-4">
            Most people have ideas for apps that could solve problems and generate income, but turning those ideas into reality requires:
          </p>
          
          <ul class="space-y-2 mb-6">
            <li class="flex items-start gap-2">
              <span class="text-red-400">•</span>
              <p class="text-gray-300">Programming knowledge across multiple languages</p>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-red-400">•</span>
              <p class="text-gray-300">Understanding of complex development environments</p>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-red-400">•</span>
              <p class="text-gray-300">Expertise in deploying and maintaining applications</p>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-red-400">•</span>
              <p class="text-gray-300">Costly developers or years of learning</p>
            </li>
          </ul>
          
          <!-- Code snippet to make problem visceral -->
          <div class="bg-gray-950 border border-red-500/20 rounded-lg p-4 text-xs font-mono text-gray-400 overflow-x-auto">
            <pre>const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

const userSchema = &#123;
  username: &#123; type: String, required: true, unique: true &#125;,
  passwordHash: &#123; type: String, required: true &#125;,
  // And dozens more lines of complex code...</pre>
          </div>
          <p class="text-sm text-gray-500 mt-2 text-center">Just a glimpse of what's required to build even a simple app today</p>
        </div>
        
        <!-- Solution -->
        <div class="bg-gray-900/30 backdrop-blur-xl rounded-3xl border border-cyan-500/20 p-8 md:translate-y-8">
          <h4 class="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-cyan-400 mb-4">Our Direct Solution:</h4>
          <p class="text-gray-300 mb-6">
            VisionCreator's Voice-Command Creation Platform eliminates these barriers by allowing anyone to create functional mini-apps through simple voice instructions:
          </p>
          
          <div class="space-y-6 mb-8">
            <div class="flex items-start gap-4">
              <div class="w-8 h-8 rounded-full bg-gradient-to-r from-yellow-400/20 to-cyan-400/20 flex items-center justify-center">
                1
              </div>
              <p class="text-gray-300">Describe what you want your app to do</p>
            </div>
            <div class="flex items-start gap-4">
              <div class="w-8 h-8 rounded-full bg-gradient-to-r from-yellow-400/20 to-cyan-400/20 flex items-center justify-center">
                2
              </div>
              <p class="text-gray-300">Our AI interprets your instructions and builds the application</p>
            </div>
            <div class="flex items-start gap-4">
              <div class="w-8 h-8 rounded-full bg-gradient-to-r from-yellow-400/20 to-cyan-400/20 flex items-center justify-center">
                3
              </div>
              <p class="text-gray-300">No coding required - just clear communication of your vision</p>
            </div>
            <div class="flex items-start gap-4">
              <div class="w-8 h-8 rounded-full bg-gradient-to-r from-yellow-400/20 to-cyan-400/20 flex items-center justify-center">
                4
              </div>
              <p class="text-gray-300">Launch your creation on our marketplace where others can discover and use it</p>
            </div>
          </div>
          
          <!-- Voice command example -->
          <div class="bg-gray-950 border border-cyan-500/20 rounded-lg p-6 text-center">
            <p class="text-cyan-400 text-xl mb-2 font-mono">"Create a weather app that shows the forecast and sends alerts when it's going to rain"</p>
            <p class="text-sm text-gray-400">With VisionCreator, this single voice command can replace hundreds of lines of code</p>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Problem 2: AI Wealth Concentration -->
    <div class="mb-20">
      <div class="flex items-center justify-center gap-4 mb-8">
        <div class="h-px bg-red-500/30 flex-1"></div>
        <h3 class="text-2xl font-bold text-red-400 px-4">Problem 2: The AI Wealth Concentration</h3>
        <div class="h-px bg-red-500/30 flex-1"></div>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-12">
        <!-- Problem Statement -->
        <div class="bg-gray-900/30 backdrop-blur-xl rounded-3xl border border-red-500/20 p-8">
          <h4 class="text-xl font-bold text-red-400 mb-4">The Problem Staked:</h4>
          <p class="text-gray-300 mb-6 italic">
            "AI is creating the next wave of digital wealth, but without technical skills, you're relegated to being a consumer rather than a creator."
          </p>
          
          <p class="text-gray-300 mb-4">
            As AI rapidly transforms the economy:
          </p>
          
          <ul class="space-y-2 mb-6">
            <li class="flex items-start gap-2">
              <span class="text-red-400">•</span>
              <p class="text-gray-300">Technical specialists are capturing massive value</p>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-red-400">•</span>
              <p class="text-gray-300">The wealth gap between creators and consumers is widening</p>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-red-400">•</span>
              <p class="text-gray-300">Most people can only consume AI tools, not leverage them for creation</p>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-red-400">•</span>
              <p class="text-gray-300">The economic benefits of AI are concentrating among a small percentage of the population</p>
            </li>
          </ul>
          
          <!-- Wealth distribution visualization -->
          <div class="bg-gray-950 border border-red-500/20 rounded-lg p-6">
            <h5 class="text-sm text-gray-400 mb-4 text-center">AI Wealth Distribution</h5>
            <div class="h-6 bg-gray-800 rounded-full overflow-hidden mb-3">
              <div class="h-full bg-red-500 rounded-full" style="width: 10%;"></div>
            </div>
            <div class="flex justify-between text-xs text-gray-500">
              <span>10% of people</span>
              <span>90% of AI-generated wealth</span>
            </div>
          </div>
        </div>
        
        <!-- Solution -->
        <div class="bg-gray-900/30 backdrop-blur-xl rounded-3xl border border-cyan-500/20 p-8 md:translate-y-8">
          <h4 class="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-cyan-400 mb-4">Our Direct Solution:</h4>
          <p class="text-gray-300 mb-6">
            VisionCreator democratizes AI-powered creation through:
          </p>
          
          <div class="space-y-6 mb-8">
            <div class="flex items-start gap-4">
              <div class="w-8 h-8 rounded-full bg-gradient-to-r from-yellow-400/20 to-cyan-400/20 flex items-center justify-center">
                1
              </div>
              <p class="text-gray-300">Our AI-powered platform that turns your voice instructions into working applications</p>
            </div>
            <div class="flex items-start gap-4">
              <div class="w-8 h-8 rounded-full bg-gradient-to-r from-yellow-400/20 to-cyan-400/20 flex items-center justify-center">
                2
              </div>
              <p class="text-gray-300">A marketplace where your creations can generate income 24/7</p>
            </div>
            <div class="flex items-start gap-4">
              <div class="w-8 h-8 rounded-full bg-gradient-to-r from-yellow-400/20 to-cyan-400/20 flex items-center justify-center">
                3
              </div>
              <p class="text-gray-300">Community support to help refine and improve your ideas</p>
            </div>
            <div class="flex items-start gap-4">
              <div class="w-8 h-8 rounded-full bg-gradient-to-r from-yellow-400/20 to-cyan-400/20 flex items-center justify-center">
                4
              </div>
              <p class="text-gray-300">Educational resources that help you understand what's possible without needing to understand how it works</p>
            </div>
          </div>
          
          <p class="text-xl text-center text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-cyan-400 font-bold mb-2">
            We're putting AI in service of everyone, not just technical specialists
          </p>
        </div>
      </div>
    </div>
    
    <!-- Problem 3: The Ownership Disconnect -->
    <div>
      <div class="flex items-center justify-center gap-4 mb-8">
        <div class="h-px bg-red-500/30 flex-1"></div>
        <h3 class="text-2xl font-bold text-red-400 px-4">Problem 3: The Ownership Disconnect</h3>
        <div class="h-px bg-red-500/30 flex-1"></div>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-12">
        <!-- Problem Statement -->
        <div class="bg-gray-900/30 backdrop-blur-xl rounded-3xl border border-red-500/20 p-8">
          <h4 class="text-xl font-bold text-red-400 mb-4">The Problem Staked:</h4>
          <p class="text-gray-300 mb-6 italic">
            "In today's digital economy, you build value for platforms but own nothing of what you create."
          </p>
          
          <p class="text-gray-300 mb-4">
            Traditional platforms:
          </p>
          
          <ul class="space-y-2 mb-6">
            <li class="flex items-start gap-2">
              <span class="text-red-400">•</span>
              <p class="text-gray-300">Extract value from user contributions</p>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-red-400">•</span>
              <p class="text-gray-300">Keep all upside for shareholders</p>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-red-400">•</span>
              <p class="text-gray-300">Offer temporary compensation, not lasting ownership</p>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-red-400">•</span>
              <p class="text-gray-300">Can change terms at any time, leaving creators vulnerable</p>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-red-400">•</span>
              <p class="text-gray-300">Create digital sharecroppers, not digital owners</p>
            </li>
          </ul>
          
          <!-- Platform vs. Creator visualization -->
          <div class="bg-gray-950 border border-red-500/20 rounded-lg p-6">
            <div class="grid grid-cols-2 gap-6">
              <div class="text-center">
                <p class="text-sm text-gray-400 mb-2">Hours You Spend Building</p>
                <p class="text-2xl text-red-400 font-bold">1000+</p>
              </div>
              <div class="text-center">
                <p class="text-sm text-gray-400 mb-2">Ownership You Receive</p>
                <p class="text-2xl text-red-400 font-bold">0%</p>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Solution -->
        <div class="bg-gray-900/30 backdrop-blur-xl rounded-3xl border border-cyan-500/20 p-8 md:translate-y-8">
          <h4 class="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-cyan-400 mb-4">Our Direct Solution:</h4>
          <p class="text-gray-300 mb-6 italic">
            "VCR tokens aren't just governance rights—they're actual ownership in a platform being built by and for its users."
          </p>
          
          <p class="text-gray-300 mb-4">
            VisionCreator's ownership model ensures:
          </p>
          
          <div class="space-y-6 mb-8">
            <div class="flex items-start gap-4">
              <div class="w-8 h-8 rounded-full bg-gradient-to-r from-yellow-400/20 to-cyan-400/20 flex items-center justify-center">
                1
              </div>
              <p class="text-gray-300">Your one-time €365 investment provides permanent ownership through VCR tokens</p>
            </div>
            <div class="flex items-start gap-4">
              <div class="w-8 h-8 rounded-full bg-gradient-to-r from-yellow-400/20 to-cyan-400/20 flex items-center justify-center">
                2
              </div>
              <p class="text-gray-300">30% of platform ownership is distributed to our first 10,000 members</p>
            </div>
            <div class="flex items-start gap-4">
              <div class="w-8 h-8 rounded-full bg-gradient-to-r from-yellow-400/20 to-cyan-400/20 flex items-center justify-center">
                3
              </div>
              <p class="text-gray-300">The 50/50 split between platform development and community pool ensures balanced growth</p>
            </div>
            <div class="flex items-start gap-4">
              <div class="w-8 h-8 rounded-full bg-gradient-to-r from-yellow-400/20 to-cyan-400/20 flex items-center justify-center">
                4
              </div>
              <p class="text-gray-300">When we reach 10,000 members, we transform into a full DAO where token holders control the platform's future</p>
            </div>
            <div class="flex items-start gap-4">
              <div class="w-8 h-8 rounded-full bg-gradient-to-r from-yellow-400/20 to-cyan-400/20 flex items-center justify-center">
                5
              </div>
              <p class="text-gray-300">You own a share of everything built on the platform</p>
            </div>
          </div>
          
          <p class="text-xl text-center text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-cyan-400 font-bold">
            Perfect alignment between platform success and member success
          </p>
        </div>
      </div>
    </div>
    
    <!-- Integrated Solution Summary -->
    <div class="mt-20 bg-gray-900/30 backdrop-blur-xl rounded-3xl border border-cyan-500/20 p-8 text-center">
      <h3 class="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-cyan-400 mb-6">
        The Integrated Solution: Create, Earn, Own
      </h3>
      <p class="text-gray-300 mb-8 max-w-3xl mx-auto">
        VisionCreator integrates these solutions into a single platform with a three-phase roadmap that solves the fundamental problems of digital creation and ownership.
      </p>
      
      <div class="flex justify-center items-center">
        <button class="px-10 py-5 bg-gradient-to-r from-yellow-400 to-cyan-400 rounded-full text-black text-xl font-bold hover:scale-105 transition-all duration-300">
          Join the 10,000 Pioneers
        </button>
      </div>
    </div>
  </div>
</section>

<!-- Three-Phase Roadmap Section (Features/Benefits Framework) -->
<section class="py-24 bg-black relative overflow-hidden">
  <div class="absolute inset-0 pointer-events-none">
    <div class="absolute top-1/4 -left-48 w-96 h-96 bg-yellow-400/5 rounded-full blur-3xl"></div>
    <div class="absolute bottom-1/4 -right-48 w-96 h-96 bg-cyan-400/5 rounded-full blur-3xl"></div>
  </div>

  <div class="max-w-5xl mx-auto px-8">
    <div class="text-center mb-16">
      <h2 class="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-cyan-400">
        Our Three-Phase Strategy
      </h2>
      <p class="text-xl text-gray-300 mt-4 max-w-2xl mx-auto">
        Not sequential phases—but a strategic roadmap where building and ownership converge
      </p>
    </div>
    
    <!-- Phases Timeline -->
    <div class="relative mx-auto max-w-4xl mb-20">
      <div class="absolute top-0 left-1/2 h-full w-1 bg-gradient-to-b from-yellow-400/50 to-cyan-400/50 transform -translate-x-1/2"></div>
      
      <!-- Phase 1 -->
      <div class="relative z-10 mb-16">
        <div class="flex items-center">
          <div class="w-16 h-16 rounded-full bg-gradient-to-r from-yellow-400 to-cyan-400 flex items-center justify-center text-2xl text-black font-bold shadow-lg">
            1
          </div>
          <div class="ml-8 bg-gray-900/50 backdrop-blur-xl rounded-xl border border-yellow-500/20 p-6 flex-1">
            <h3 class="text-xl font-bold text-yellow-400 mb-2">Voice-Command Platform Development</h3>
            <p class="text-gray-300">
              We're building a revolutionary platform where anyone can create mini apps through simple voice commands. Your investment is split between platform development (50%) and our community contribution pool (50%).
            </p>
            <div class="mt-4 grid grid-cols-2 gap-4">
              <div class="bg-gray-800/50 p-3 rounded-lg">
                <p class="text-sm text-yellow-300 font-medium">Feature</p>
                <p class="text-xs text-gray-400">Voice-to-app technology</p>
              </div>
              <div class="bg-gray-800/50 p-3 rounded-lg">
                <p class="text-sm text-cyan-300 font-medium">Benefit</p>
                <p class="text-xs text-gray-400">Create without coding skills</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Phase 2 -->
      <div class="relative z-10 mb-16 ml-24">
        <div class="flex items-center">
          <div class="w-16 h-16 rounded-full bg-gradient-to-r from-yellow-400 to-cyan-400 flex items-center justify-center text-2xl text-black font-bold shadow-lg">
            2
          </div>
          <div class="ml-8 bg-gray-900/50 backdrop-blur-xl rounded-xl border border-yellow-500/20 p-6 flex-1">
            <h3 class="text-xl font-bold text-yellow-400 mb-2">Marketplace Creation</h3>
            <p class="text-gray-300">
              Once our core platform is built, we expand to create a comprehensive marketplace where VisionCreators can build and distribute mini apps within our framework. This marketplace becomes the ecosystem where digital assets are created, shared, and monetized.
            </p>
            <div class="mt-4 grid grid-cols-2 gap-4">
              <div class="bg-gray-800/50 p-3 rounded-lg">
                <p class="text-sm text-yellow-300 font-medium">Feature</p>
                <p class="text-xs text-gray-400">AI-powered marketplace</p>
              </div>
              <div class="bg-gray-800/50 p-3 rounded-lg">
                <p class="text-sm text-cyan-300 font-medium">Benefit</p>
                <p class="text-xs text-gray-400">Monetize your creations</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Phase 3 -->
      <div class="relative z-10">
        <div class="flex items-center">
          <div class="w-16 h-16 rounded-full bg-gradient-to-r from-yellow-400 to-cyan-400 flex items-center justify-center text-2xl text-black font-bold shadow-lg">
            3
          </div>
          <div class="ml-8 bg-gray-900/50 backdrop-blur-xl rounded-xl border border-yellow-500/20 p-6 flex-1">
            <h3 class="text-xl font-bold text-yellow-400 mb-2">Community Exit & DAO Transformation</h3>
            <p class="text-gray-300">
              Upon reaching our milestone of 10,000 members—both passive investors and active contributors holding VCR tokens—we execute our community exit and transform into a full DAO. At this point, governance transfers completely to token holders.
            </p>
            <div class="mt-4 grid grid-cols-2 gap-4">
              <div class="bg-gray-800/50 p-3 rounded-lg">
                <p class="text-sm text-yellow-300 font-medium">Feature</p>
                <p class="text-xs text-gray-400">Complete DAO governance</p>
              </div>
              <div class="bg-gray-800/50 p-3 rounded-lg">
                <p class="text-sm text-cyan-300 font-medium">Benefit</p>
                <p class="text-xs text-gray-400">Full community control</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Value Proposition (Using Social Proof) -->
<section class="py-24 bg-gray-950 relative overflow-hidden">
  <div class="absolute inset-0 pointer-events-none">
    <div class="absolute top-1/4 -left-48 w-96 h-96 bg-yellow-500/5 rounded-full blur-3xl"></div>
    <div class="absolute bottom-1/4 -right-48 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl"></div>
  </div>

  <div class="max-w-5xl mx-auto px-8">
    <div class="text-center mb-16">
      <h2 class="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-cyan-400">
        The Value Proposition
      </h2>
    </div>
    
    <!-- User Stories - Social Proof -->
    <div class="grid gap-8 md:grid-cols-3">
      <!-- Creators -->
      <div class="bg-gray-900/30 backdrop-blur-xl rounded-3xl border border-yellow-500/20 p-8 transition-all duration-300 hover:border-yellow-500/40">
        <div class="flex items-start gap-6 mb-8">
          <Avatar seed="creator" size="56" />
          <div>
            <h3 class="text-xl font-bold text-yellow-400 mb-1">For Creators</h3>
            <p class="text-sm text-gray-400">Tech enthusiasts & builders</p>
          </div>
        </div>
        
        <div class="space-y-4">
          <div class="flex items-start gap-3">
            <div class="text-yellow-400">•</div>
            <p class="text-gray-300 text-sm">Create mini apps through voice commands without technical skills</p>
          </div>
          <div class="flex items-start gap-3">
            <div class="text-yellow-400">•</div>
            <p class="text-gray-300 text-sm">Earn VCR tokens through platform contributions</p>
          </div>
          <div class="flex items-start gap-3">
            <div class="text-yellow-400">•</div>
            <p class="text-gray-300 text-sm">Build ownership in a growing AI marketplace ecosystem</p>
          </div>
        </div>
        
        <div class="mt-8 bg-gray-800/50 rounded-xl p-4">
          <p class="text-gray-300 text-sm italic">
            "I always had app ideas but couldn't code. Now I just describe my vision through voice and it becomes reality."
          </p>
          <p class="text-right text-xs text-gray-400 mt-2">— Alex, Graphic Designer</p>
        </div>
      </div>
      
      <!-- Investors -->
      <div class="bg-gray-900/30 backdrop-blur-xl rounded-3xl border border-cyan-500/20 p-8 transition-all duration-300 hover:border-cyan-500/40">
        <div class="flex items-start gap-6 mb-8">
          <Avatar seed="investor" size="56" />
          <div>
            <h3 class="text-xl font-bold text-cyan-400 mb-1">For Investors</h3>
            <p class="text-sm text-gray-400">Forward-thinking individuals</p>
          </div>
        </div>
        
        <div class="space-y-4">
          <div class="flex items-start gap-3">
            <div class="text-cyan-400">•</div>
            <p class="text-gray-300 text-sm">One-time €365 investment for lifetime participation</p>
          </div>
          <div class="flex items-start gap-3">
            <div class="text-cyan-400">•</div>
            <p class="text-gray-300 text-sm">Clear exit strategy at 10,000 member milestone</p>
          </div>
          <div class="flex items-start gap-3">
            <div class="text-cyan-400">•</div>
            <p class="text-gray-300 text-sm">30% ownership distributed through VCR tokens</p>
          </div>
        </div>
        
        <div class="mt-8 bg-gray-800/50 rounded-xl p-4">
          <p class="text-gray-300 text-sm italic">
            "I've invested in traditional startups before, but never had true ownership or governance rights like with VisionCreator."
          </p>
          <p class="text-right text-xs text-gray-400 mt-2">— Maria, Angel Investor</p>
        </div>
      </div>
      
      <!-- Partners -->
      <div class="bg-gray-900/30 backdrop-blur-xl rounded-3xl border border-purple-500/20 p-8 transition-all duration-300 hover:border-purple-500/40">
        <div class="flex items-start gap-6 mb-8">
          <Avatar seed="partner" size="56" />
          <div>
            <h3 class="text-xl font-bold text-purple-400 mb-1">For Partners</h3>
            <p class="text-sm text-gray-400">Businesses & service providers</p>
          </div>
        </div>
        
        <div class="space-y-4">
          <div class="flex items-start gap-3">
            <div class="text-purple-400">•</div>
            <p class="text-gray-300 text-sm">Join an ecosystem with built-in distribution channel</p>
          </div>
          <div class="flex items-start gap-3">
            <div class="text-purple-400">•</div>
            <p class="text-gray-300 text-sm">Leverage community resources for development</p>
          </div>
          <div class="flex items-start gap-3">
            <div class="text-purple-400">•</div>
            <p class="text-gray-300 text-sm">Align with next-generation ownership model</p>
          </div>
        </div>
        
        <div class="mt-8 bg-gray-800/50 rounded-xl p-4">
          <p class="text-gray-300 text-sm italic">
            "We integrated our API with VisionCreator's marketplace and saw a 3x increase in developer adoption."
          </p>
          <p class="text-right text-xs text-gray-400 mt-2">— Carlos, API Provider</p>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- The Numbers (Visuals to Tell the Story) -->
<section class="py-24 bg-black relative overflow-hidden">
  <div class="absolute inset-0 pointer-events-none">
    <div class="absolute top-1/4 -left-48 w-96 h-96 bg-yellow-500/5 rounded-full blur-3xl"></div>
    <div class="absolute bottom-1/4 -right-48 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl"></div>
  </div>

  <div class="max-w-5xl mx-auto px-8">
    <div class="text-center mb-16">
      <h2 class="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-cyan-400">
        The Numbers That Matter
      </h2>
    </div>
    
    <div class="grid grid-cols-1 md:grid-cols-5 gap-6">
      <div class="bg-gray-900/30 backdrop-blur-xl rounded-xl p-6 text-center transform transition hover:scale-105 duration-300">
        <div class="text-3xl font-bold text-yellow-400 mb-2">€365</div>
        <div class="text-sm text-gray-300">One-time Investment</div>
      </div>
      
      <div class="bg-gray-900/30 backdrop-blur-xl rounded-xl p-6 text-center transform transition hover:scale-105 duration-300">
        <div class="text-3xl font-bold text-cyan-400 mb-2">50/50</div>
        <div class="text-sm text-gray-300">Platform/Community Split</div>
      </div>
      
      <div class="bg-gray-900/30 backdrop-blur-xl rounded-xl p-6 text-center transform transition hover:scale-105 duration-300">
        <div class="text-3xl font-bold text-yellow-400 mb-2">30%</div>
        <div class="text-sm text-gray-300">Ownership Distribution</div>
      </div>
      
      <div class="bg-gray-900/30 backdrop-blur-xl rounded-xl p-6 text-center transform transition hover:scale-105 duration-300">
        <div class="text-3xl font-bold text-cyan-400 mb-2">€3.65M</div>
        <div class="text-sm text-gray-300">Community Treasury</div>
      </div>
      
      <div class="bg-gray-900/30 backdrop-blur-xl rounded-xl p-6 text-center transform transition hover:scale-105 duration-300">
        <div class="text-3xl font-bold text-yellow-400 mb-2">100%</div>
        <div class="text-sm text-gray-300">Community Governance</div>
      </div>
    </div>
    
    <!-- Conversion Funnel Visualization -->
    <div class="mt-20 bg-gray-900/30 backdrop-blur-xl rounded-3xl border border-cyan-500/20 p-8">
      <h3 class="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-cyan-400 mb-8 text-center">
        The Journey to Full DAO
      </h3>
      
      <div class="relative">
        <!-- Progress Bar -->
        <div class="h-3 bg-gray-800 rounded-full overflow-hidden mb-8">
          <div class="h-full bg-gradient-to-r from-yellow-400 to-cyan-400 rounded-full" style="width: 23%;"></div>
        </div>
        
        <!-- Milestones -->
        <div class="flex justify-between text-center">
          <div>
            <div class="w-8 h-8 rounded-full bg-gradient-to-r from-yellow-400 to-cyan-400 mx-auto mb-2 flex items-center justify-center text-black text-xs font-bold">1</div>
            <div class="text-sm text-gray-300">Early<br>Adopters</div>
            <div class="text-xs text-yellow-300 mt-1">Now</div>
          </div>
          
          <div>
            <div class="w-8 h-8 rounded-full bg-gray-700 mx-auto mb-2 flex items-center justify-center text-white text-xs font-bold">5K</div>
            <div class="text-sm text-gray-300">Platform<br>Launch</div>
          </div>
          
          <div>
            <div class="w-8 h-8 rounded-full bg-gray-700 mx-auto mb-2 flex items-center justify-center text-white text-xs font-bold">10K</div>
            <div class="text-sm text-gray-300">DAO<br>Transformation</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- CTA Section -->
<section class="py-24 bg-gradient-to-b from-gray-950 to-black relative overflow-hidden">
  <div class="absolute inset-0 pointer-events-none">
    <div class="absolute top-1/2 -left-48 w-96 h-96 bg-yellow-400/10 rounded-full blur-3xl"></div>
  </div>

  <div class="max-w-3xl mx-auto px-8 text-center space-y-12">
    <h2 class="text-5xl font-bold">
      <span class="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-cyan-400">
        Join the future for €365
      </span>
    </h2>
    
    <p class="text-xl text-gray-300 max-w-xl mx-auto">
      Be among the first 10,000 members who will own and govern VisionCreator.
    </p>
    
    <!-- CTV instead of CTA -->
    <div class="flex flex-col sm:flex-row justify-center items-center space-y-6 sm:space-y-0 sm:space-x-6">
      <button class="px-10 py-5 bg-gradient-to-r from-yellow-400 to-cyan-400 rounded-full text-black text-xl font-bold hover:scale-105 transition-all duration-300 w-full sm:w-auto">
        Start My Ownership Journey
      </button>
      
      <a href="/roadmap" class="text-cyan-400 underline hover:text-cyan-300 transition-colors">
        See detailed roadmap
      </a>
    </div>
    
    <!-- Social Proof -->
    <div class="flex justify-center gap-4 mt-12">
      <div class="flex -space-x-3">
        <Avatar seed="member1" />
        <Avatar seed="member2" />
        <Avatar seed="member3" />
        <div class="w-12 h-12 rounded-full border-2 border-gray-900 bg-gradient-to-br from-gray-800 to-gray-900 backdrop-blur-xl flex items-center justify-center text-cyan-100 text-sm">
          +{memberCount - 3}
        </div>
      </div>
    </div>
  </div>
</section>

</div><!-- End of main wrapper -->

<style>
  @keyframes title-rise {
    0% { transform: translateY(30px); opacity: 0; }
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

  .animate-title-rise {
    animation: title-rise 1.2s ease-out forwards;
  }

  .animate-fade-in {
    animation: fade-in 1s ease-out forwards;
  }

  .animate-slide-up {
    animation: slide-up 1s ease-out forwards;
  }

  .animate-fade-in-delayed {
    animation: fade-in 1s ease-out 0.5s forwards;
    opacity: 0;
  }

  .animate-fade-in-delayed-2 {
    animation: fade-in 1s ease-out 1s forwards;
    opacity: 0;
  }

  .animate-slide-up-delayed {
    animation: slide-up 1s ease-out 0.3s forwards;
    opacity: 0;
  }
</style>
