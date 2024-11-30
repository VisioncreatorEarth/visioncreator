<script lang="ts">
	import { onMount } from 'svelte';
	import { writable } from 'svelte/store';
	import Icon from '@iconify/svelte';
	import Banner from './Banner.svelte';

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
		const types = ['Gesamte Wohnung', 'Privatzimmer', 'Gemeinsches Zimmer'];

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

<div class="flex flex-col w-full">
	<div class="overflow-auto p-6 w-full h-full text-white bg-surface-800">
		<h1 class="mb-6 text-3xl font-bold">Unterkünfte in Deutschland</h1>

		<div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
			{#each $listings as listing (listing.id)}
				<div class="overflow-hidden rounded-lg shadow-md bg-surface-700">
					<img src={listing.image} alt={listing.title} class="object-cover w-full h-48" />
					<div class="p-4">
						<div class="flex justify-between items-center mb-2">
							<span class="text-sm font-semibold">{listing.type}</span>
							<div class="flex items-center">
								<Icon icon="mdi:star" class="mr-1 text-yellow-500" />
								<span class="text-sm">{listing.rating}</span>
							</div>
						</div>
						<h2 class="mb-2 text-lg font-bold">{listing.title}</h2>
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
							<button
								class="px-4 py-2 text-white rounded-lg transition-colors duration-200 bg-primary-500 hover:bg-primary-600"
							>
								Buchen
							</button>
						</div>
					</div>
				</div>
			{/each}
		</div>
	</div>
</div>
