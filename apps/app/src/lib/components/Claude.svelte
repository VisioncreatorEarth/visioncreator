<script lang="ts">
	import { writable } from 'svelte/store';

	interface Track {
		id: number;
		title: string;
		artist: string;
		artwork: string;
		duration: string;
		plays: number;
		likes: number;
		comments: number;
	}

	interface Artist {
		id: number;
		name: string;
		avatar: string;
		followers: number;
	}

	const currentTrack = writable<Track | null>(null);
	const isPlaying = writable(false);

	const tracks = writable<Track[]>([
		{
			id: 1,
			title: 'Summer Vibes',
			artist: 'Electronic Dreams',
			artwork: 'https://source.unsplash.com/random/800x400?music,1',
			duration: '3:45',
			plays: 15234,
			likes: 842,
			comments: 126
		},
		{
			id: 2,
			title: 'Midnight Drive',
			artist: 'Night Riders',
			artwork: 'https://source.unsplash.com/random/800x400?music,2',
			duration: '4:20',
			plays: 8976,
			likes: 567,
			comments: 89
		},
		{
			id: 3,
			title: 'Urban Dreams',
			artist: 'City Beats',
			artwork: 'https://source.unsplash.com/random/800x400?music,3',
			duration: '3:15',
			plays: 12543,
			likes: 934,
			comments: 167
		}
	]);

	const suggestedArtists = writable<Artist[]>([
		{
			id: 1,
			name: 'Electronic Dreams',
			avatar: 'https://source.unsplash.com/random/100x100?face,1',
			followers: 15234
		},
		{
			id: 2,
			name: 'Night Riders',
			avatar: 'https://source.unsplash.com/random/100x100?face,2',
			followers: 8976
		},
		{
			id: 3,
			name: 'City Beats',
			avatar: 'https://source.unsplash.com/random/100x100?face,3',
			followers: 12543
		}
	]);

	function togglePlay() {
		isPlaying.update((value) => !value);
	}

	function formatNumber(num: number): string {
		return num.toLocaleString();
	}
</script>

<div class="w-full h-full @container bg-surface-100-800-token">
	<!-- Header -->
	<header class="fixed top-0 w-full z-10 bg-surface-100-800-token border-b border-surface-300-600-token">
		<div class="container mx-auto px-4 h-14 flex items-center justify-between">
			<div class="flex items-center gap-8">
				<svg class="w-8 h-8 text-[#ff5500]" viewBox="0 0 24 24">
					<path
						fill="currentColor"
						d="M11.56,8.87V17h1.75V0.69c-3.75,0.38-6.63,3.44-6.63,7.19c0,0.92,0.19,1.79,0.5,2.59L11.56,8.87z"
					/>
				</svg>
				<nav class="hidden @md:flex gap-4">
					<button class="btn variant-ghost">Home</button>
					<button class="btn variant-ghost">Stream</button>
					<button class="btn variant-ghost">Library</button>
				</nav>
			</div>
			<div class="flex items-center gap-4">
				<input
					type="search"
					placeholder="Search tracks"
					class="input hidden @md:block"
				/>
				<button class="btn variant-filled-primary">Upload</button>
			</div>
		</div>
	</header>

	<!-- Main Content -->
	<main class="mt-14 mb-20 container mx-auto p-4">
		<!-- Featured Track -->
		<section class="mb-8">
			<div class="relative h-[300px] @lg:h-[400px] rounded-lg overflow-hidden">
				<img
					src="https://source.unsplash.com/random/1200x400?concert"
					alt="Featured"
					class="w-full h-full object-cover"
				/>
				<div class="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent">
					<h1 class="h1 text-white text-2xl @lg:text-4xl">Featured Track of the Week</h1>
				</div>
			</div>
		</section>

		<!-- Content Grid -->
		<div class="grid grid-cols-1 @lg:grid-cols-[1fr,300px] gap-8">
			<!-- Trending Tracks -->
			<section>
				<h2 class="h2 mb-4 text-xl @lg:text-2xl">Trending Tracks</h2>
				<div class="grid gap-4">
					{#each $tracks as track}
						<div class="card p-4 bg-surface-200-700-token hover:bg-surface-300-600-token">
							<div class="flex gap-4">
								<img
									src={track.artwork}
									alt={track.title}
									class="w-20 h-20 @md:w-32 @md:h-32 object-cover rounded"
								/>
								<div class="flex-1">
									<h3 class="h3 text-lg @md:text-xl">{track.title}</h3>
									<p class="text-surface-400-500-token">{track.artist}</p>
									<div class="flex gap-4 mt-2">
										<span class="badge variant-soft">{track.duration}</span>
										<span class="badge variant-soft">{formatNumber(track.plays)} plays</span>
										<span class="badge variant-soft">{formatNumber(track.likes)} likes</span>
									</div>
								</div>
							</div>
						</div>
					{/each}
				</div>
			</section>

			<!-- Sidebar -->
			<aside class="space-y-4">
				<h2 class="h2 text-xl @lg:text-2xl">Suggested Artists</h2>
				{#each $suggestedArtists as artist}
					<div class="card p-4 bg-surface-200-700-token">
						<div class="flex items-center gap-4">
							<img
								src={artist.avatar}
								alt={artist.name}
								class="w-12 h-12 rounded-full"
							/>
							<div>
								<h3 class="font-bold">{artist.name}</h3>
								<p class="text-sm text-surface-400-500-token">
									{formatNumber(artist.followers)} followers
								</p>
							</div>
						</div>
					</div>
				{/each}
			</aside>
		</div>
	</main>

	<!-- Playback Control -->
	<footer
		class="fixed bottom-0 left-0 right-0 h-20 bg-surface-100-800-token border-t border-surface-300-600-token"
	>
		<div class="container mx-auto h-full px-4 flex items-center justify-between">
			<div class="flex items-center gap-4">
				<button class="btn btn-icon variant-ghost">
					<i class="fas fa-step-backward" />
				</button>
				<button class="btn btn-icon variant-filled-primary" on:click={togglePlay}>
					<i class="fas {$isPlaying ? 'fa-pause' : 'fa-play'}" />
				</button>
				<button class="btn btn-icon variant-ghost">
					<i class="fas fa-step-forward" />
				</button>
			</div>
			<div class="flex-1 mx-4 hidden @md:block">
				<div class="h-2 rounded-full bg-surface-300-600-token">
					<div class="h-full w-1/3 rounded-full bg-[#ff5500]" />
				</div>
			</div>
			<div class="flex items-center gap-4">
				<button class="btn btn-icon variant-ghost">
					<i class="fas fa-volume-up" />
				</button>
				<button class="btn btn-icon variant-ghost">
					<i class="fas fa-random" />
				</button>
				<button class="btn btn-icon variant-ghost">
					<i class="fas fa-redo" />
				</button>
			</div>
		</div>
	</footer>
</div>