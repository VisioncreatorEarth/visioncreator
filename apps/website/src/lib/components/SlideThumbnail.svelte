<script lang="ts">
  export let title: string = '';
  export let index: number = 0;
  export let slideType: string = 'default';
  
  // Determine background gradient based on slide index and type
  let bgGradient = "";
  if (index === 0) {
    bgGradient = "from-cyan-400 to-blue-600 border-cyan-500"; // HelloEarth
  } else if (index === 1) {
    bgGradient = "from-indigo-400 to-purple-600 border-indigo-500"; // HumanQuestion
  } else if (index === 2) {
    bgGradient = "from-orange-400 to-red-500 border-orange-500"; // AutonomyAnswer
  } else if (index === 3) {
    bgGradient = "from-purple-400 to-indigo-500 border-purple-500"; // FalseBinary
  } else if (index === 4) {
    bgGradient = "from-blue-400 to-cyan-500 border-blue-500"; // FreedomDimensions
  } else if (index === 5) {
    bgGradient = "from-blue-400 to-teal-500 border-blue-500"; // DAOIntro
  } else if (index === 6) {
    bgGradient = "from-blue-500 to-indigo-500 border-blue-500"; // DAOExplained
  } else if (index === 7) {
    bgGradient = "from-teal-400 to-emerald-500 border-teal-500"; // TokenSystem
  } else if (index === 8) {
    bgGradient = "from-emerald-400 to-green-500 border-emerald-500"; // VisionCreatorPool
  } else if (index === 9) {
    bgGradient = "from-purple-400 to-blue-500 border-purple-500"; // ProposalSystem
  } else if (index === 10) {
    bgGradient = "from-amber-400 to-orange-500 border-amber-500"; // AutonomousLife
  } else if (index === 11) {
    bgGradient = "from-blue-400 to-indigo-500 border-blue-500"; // Interdependence
  } else if (index === 12) {
    bgGradient = "from-green-400 to-teal-500 border-green-500"; // PathToFreedom
  } else if (index === 13) {
    bgGradient = "from-cyan-400 to-emerald-500 border-cyan-500"; // ReclaimWork
  } else {
    bgGradient = "from-slate-400 to-slate-600 border-slate-500"; // Default
  }
</script>

<div class="slide-thumbnail relative bg-slate-800 rounded-lg overflow-hidden shadow-lg">
  <div class="aspect-video bg-slate-700 flex items-center justify-center overflow-hidden">
    <div class="absolute inset-0 opacity-20 bg-gradient-to-br {bgGradient}"></div>
    
    <!-- Different layout for each slide type -->
    {#if index === 0}
      <!-- Hello Earth slide -->
      <div class="relative z-10 text-center px-4">
        <div class="text-xs uppercase tracking-wider text-slate-400 mb-1">Welcome</div>
        <div class="text-sm font-bold text-white">
          Freedom to Create,<br>Right to Own
        </div>
      </div>
    {:else if index === 1}
      <!-- Human question slide -->
      <div class="relative z-10 text-center px-4">
        <div class="text-xs uppercase tracking-wider text-slate-400 mb-1">Question</div>
        <div class="text-sm font-medium text-white">
          What do humans<br>fundamentally need?
        </div>
      </div>
    {:else if index === 2}
      <!-- Autonomy answer slide -->
      <div class="relative z-10 text-center px-4">
        <div class="text-xs uppercase tracking-wider text-slate-400 mb-1">Answer</div>
        <div class="text-sm font-bold text-white">
          AUTONOMY
        </div>
      </div>
    {:else if index === 3}
      <!-- False Binary slide -->
      <div class="relative z-10 text-center px-4">
        <div class="text-xs uppercase tracking-wider text-slate-400 mb-1">Beyond</div>
        <div class="text-sm font-medium text-white">
          Employee to Owner-Contributor
        </div>
      </div>
    {:else if index === 4}
      <!-- Freedom Dimensions slide -->
      <div class="relative z-10 text-center px-4">
        <div class="text-xs uppercase tracking-wider text-slate-400 mb-1">Dimensions</div>
        <div class="text-sm font-medium text-white">
          Five Dimensions of Freedom
        </div>
      </div>
    {:else if index === 5}
      <!-- DAO Intro slide -->
      <div class="relative z-10 text-center px-4">
        <div class="text-xs uppercase tracking-wider text-slate-400 mb-1">Ownership</div>
        <div class="text-sm font-medium text-white">
          Own What You Help Build
        </div>
      </div>
    {:else if index === 6}
      <!-- DAO Explained slide -->
      <div class="relative z-10 text-center px-4">
        <div class="text-xs uppercase tracking-wider text-slate-400 mb-1">DAO</div>
        <div class="text-sm font-medium text-white">
          Decentralized Autonomous<br>Organization
        </div>
      </div>
    {:else if index === 7}
      <!-- Token System slide -->
      <div class="relative z-10 text-center px-4">
        <div class="text-xs uppercase tracking-wider text-slate-400 mb-1">Tokens</div>
        <div class="text-sm font-medium text-white">
          VCR Token System
        </div>
      </div>
    {:else if index === 8}
      <!-- VisionCreator Pool slide -->
      <div class="relative z-10 text-center px-4">
        <div class="text-xs uppercase tracking-wider text-slate-400 mb-1">Funding</div>
        <div class="text-sm font-bold text-white">
          75% Community Pool
        </div>
      </div>
    {:else if index === 9}
      <!-- Proposal System slide -->
      <div class="relative z-10 text-center px-4">
        <div class="text-xs uppercase tracking-wider text-slate-400 mb-1">Governance</div>
        <div class="text-sm font-medium text-white">
          Your Voice, Your Vote
        </div>
      </div>
    {:else if index === 10}
      <!-- Autonomous Life slide -->
      <div class="relative z-10 text-center px-4">
        <div class="text-xs uppercase tracking-wider text-slate-400 mb-1">Life</div>
        <div class="text-sm font-medium text-white">
          Elena's Autonomous Journey
        </div>
      </div>
    {:else if index === 11}
      <!-- Interdependence slide -->
      <div class="relative z-10 text-center px-4">
        <div class="text-xs uppercase tracking-wider text-slate-400 mb-1">Journey</div>
        <div class="text-sm font-medium text-white">
          From Dependence to<br>Interdependence
        </div>
      </div>
    {:else if index === 12}
      <!-- Path to Freedom slide -->
      <div class="relative z-10 text-center px-4">
        <div class="text-xs uppercase tracking-wider text-slate-400 mb-1">Path</div>
        <div class="text-sm font-medium text-white">
          5-Step Journey to Freedom
        </div>
      </div>
    {:else if index === 13}
      <!-- Reclaim Work slide -->
      <div class="relative z-10 text-center px-4">
        <div class="text-xs uppercase tracking-wider text-slate-400 mb-1">Reclaim</div>
        <div class="text-sm font-medium text-white">
          Your Work, Your Life
        </div>
      </div>
    {:else}
      <!-- Generic slide layout with text only -->
      <div class="relative z-10 text-center px-4">
        <div class="text-xs uppercase tracking-wider text-slate-400 mb-1">{title.split(' ')[0]}</div>
        <div class="text-sm font-medium text-white">{title}</div>
      </div>
    {/if}
    
    <!-- Slide number -->
    <div class="absolute bottom-2 right-2 text-xs font-bold text-white/50 bg-black/20 px-2 py-1 rounded-full">
      {index + 1}
    </div>
  </div>
  
  <div class="p-3">
    <h3 class="text-sm font-medium text-slate-200 truncate" title={title}>{title}</h3>
  </div>
</div>

<style>
  .slide-thumbnail {
    transition: all 0.2s ease-in-out;
  }
  
  .slide-thumbnail:hover {
    transform: translateY(-4px);
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
  }
</style> 