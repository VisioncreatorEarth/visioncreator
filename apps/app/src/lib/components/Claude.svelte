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
	const bannerImage = writable('');

	function generateListings(): Listing[] {
		const locations = ['Berlin', 'Hamburg', 'München', 'Köln', 'Frankfurt'];
		const types = ['Gesamte Wohnung', 'Privatzimmer', 'Gemeinsames Zimmer'];

		return Array.from({ length: 10 }, (_, i) => ({
			id: i + 1,
			title: `Gemütliche Unterkunft in ${locations[Math.floor(Math.random() * locations.length)]}`,
			location: locations[Math.floor(Math.random() * locations.length)],
			price: Math.floor(Math.random() * 150) + 50,
			rating: Number((Math.random() * 2 + 3).toFixed(2)),
			image: `https://picsum.photos/seed/${i + 1}/400/300`,
			type: types[Math.floor(Math.random() * types.length)],
			beds: Math.floor(Math.random() * 3) + 1,
		}));
	}

	function getRandomBannerImage() {
		const imageId = Math.floor(Math.random() * 1000);
		return `https://picsum.photos/seed/${imageId}/1600/400`;
	}

	onMount(() => {
		listings.set(generateListings());
		bannerImage.set(getRandomBannerImage());
	});

	function formatCurrency(amount: number): string {
		return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(amount);
	}
</script>

<div class="flex flex-col w-full h-full overflow-hidden bg-surface-900 text-surface-50">
	<!-- Sticky banner -->
	<div class="sticky top-0 z-50 bg-surface-800">
		<div class="relative flex items-center justify-center h-40 overflow-hidden">
			<img
				src={$bannerImage}
				alt="Banner"
				class="absolute inset-0 object-cover w-full h-full opacity-30"
			/>
			<div class="relative z-10 text-center">
				<h1 class="mb-2 text-3xl font-bold text-white">Willkommen bei Ihrem Traumurlaub</h1>
				<p class="text-lg text-white">Entdecken Sie die besten Unterkünfte in ganz Deutschland</p>
			</div>
		</div>
	</div>

	<!-- Scrollable content -->
	<div class="flex-grow overflow-auto">
		<!-- Listing View -->
		<div class="p-6">
			<h2 class="mb-6 text-3xl font-bold">Unterkünfte in Deutschland</h2>

			<div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
				{#each $listings as listing (listing.id)}
					<div class="overflow-hidden rounded-lg shadow-md bg-surface-700">
						<img src={listing.image} alt={listing.title} class="object-cover w-full h-48" />
						<div class="p-4">
							<div class="flex items-center justify-between mb-2">
								<span class="text-sm font-semibold">{listing.type}</span>
								<div class="flex items-center">
									<Icon icon="mdi:star" class="mr-1 text-yellow-500" />
									<span class="text-sm">{listing.rating}</span>
								</div>
							</div>
							<h3 class="mb-2 text-lg font-bold">{listing.title}</h3>
							<div class="flex items-center mb-2">
								<Icon icon="mdi:map-marker" class="mr-1" />
								<span class="text-sm">{listing.location}</span>
							</div>
							<div class="flex items-center mb-4">
								<Icon icon="mdi:bed" class="mr-1" />
								<span class="text-sm">{listing.beds} Bett{listing.beds > 1 ? 'en' : ''}</span>
							</div>
							<div class="flex items-center justify-between">
								<span class="font-bold">{formatCurrency(listing.price)} / Nacht</span>
								<button
									class="px-4 py-2 text-white transition-colors duration-200 rounded-lg bg-primary-500 hover:bg-primary-600"
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
</div>