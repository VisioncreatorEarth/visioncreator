<script>
  import PolarCheckout from '$lib/components/PolarCheckout.svelte';
</script>

<div class="container mx-auto p-4">
  <div class="max-w-2xl mx-auto">
    <header class="text-center mb-10">
      <h1 class="h1 mb-4">Choose Your Plan</h1>
      <p class="text-surface-400">Get access to all premium features and support our development</p>
    </header>
    
    <PolarCheckout />
    
    <footer class="mt-8">
      <div class="grid grid-cols-3 gap-4 text-center text-sm text-surface-400">
        <div class="flex flex-col items-center">
          <span class="material-icons mb-2">lock</span>
          <p>Secure Payment</p>
        </div>
        <div class="flex flex-col items-center">
          <span class="material-icons mb-2">support_agent</span>
          <p>24/7 Support</p>
        </div>
        <div class="flex flex-col items-center">
          <span class="material-icons mb-2">update</span>
          <p>Cancel Anytime</p>
        </div>
      </div>
    </footer>
  </div>
</div>
