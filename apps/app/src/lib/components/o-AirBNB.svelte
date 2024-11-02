<script lang="ts">
  import { onMount } from 'svelte';
  import { writable } from 'svelte/store';
  import Icon from '@iconify/svelte';

  interface Listing {
    id: number;
    title: string;
    location: string;
    price: number;
    rating: number;
    image: string;
    type: string;
    beds: number;
  }

  const listings = writable<Listing[]>([]);

  function generateListings(): Listing[] {
    const locations = ['Berlin', 'Hamburg', 'München', 'Köln', 'Frankfurt'];
    const types = ['Gesamte Wohnung', 'Privatzimmer', 'Gemeinsames Zimmer'];
    
    return Array.from({ length: 10 }, (_, i) => ({
      id: i + 1,
      title: `Gemütliche Unterkunft in ${locations[Math.floor(Math.random() * locations.length)]}`,
      location: locations[Math.floor(Math.random() * locations.length)],
      price: Math.floor(Math.random() * 150) + 50,
      rating: (Math.random() * 2 + 3).toFixed(2),
      image: `https://picsum.photos/seed/${i + 1}/400/300`, // Using Picsum for random images
      type: types[Math.floor(Math.random() * types.length)],
      beds: Math.floor(Math.random() * 3) + 1
    }));
  }

  onMount(() => {
    listings.set(generateListings());
  });

  function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(amount);
  }
</script>

<div class="w-full h-full bg-surface-800 text-white p-6 overflow-auto">
  <h1 class="text-3xl font-bold mb-6">Unterkünfte in Deutschland</h1>
  
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {#each $listings as listing (listing.id)}
      <div class="bg-surface-700 rounded-lg shadow-md overflow-hidden">
        <img src={listing.image} alt={listing.title} class="w-full h-48 object-cover" />
        <div class="p-4">
          <div class="flex justify-between items-center mb-2">
            <span class="text-sm font-semibold">{listing.type}</span>
            <div class="flex items-center">
              <Icon icon="mdi:star" class="text-yellow-500 mr-1" />
              <span class="text-sm">{listing.rating}</span>
            </div>
          </div>
          <h2 class="text-lg font-bold mb-2">{listing.title}</h2>
          <div class="flex items-center mb-2">
            <Icon icon="mdi:map-marker" class="mr-1" />
            <span class="text-sm">{listing.location}</span>
          </div>
          <div class="flex items-center mb-4">
            <Icon icon="mdi:bed" class="mr-1" />
            <span class="text-sm">{listing.beds} Bett{listing.beds > 1 ? 'en' : ''}</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="font-bold">{formatCurrency(listing.price)} / Nacht</span>
            <button class="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors duration-200">
              Buchen
            </button>
          </div>
        </div>
      </div>
    {/each}
  </div>
</div>