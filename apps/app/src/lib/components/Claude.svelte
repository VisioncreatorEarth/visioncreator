<script lang="ts">
	import { writable } from 'svelte/store';

	interface Tweet {
		id: number;
		username: string;
		handle: string;
		content: string;
		likes: number;
		retweets: number;
		replies: number;
		timestamp: string;
		avatar: string;
	}

	const tweets = writable<Tweet[]>([
		{
			id: 1,
			username: 'John Doe',
			handle: '@johndoe',
			content: 'Just setting up my Twitter clone! 🚀 #svelte #development',
			likes: 42,
			retweets: 12,
			replies: 5,
			timestamp: '2h',
			avatar: 'https://source.unsplash.com/random/100x100?face,1'
		},
		{
			id: 2,
			username: 'Jane Smith',
			handle: '@janesmith',
			content: 'Loving the new Svelte Twitter clone interface! The dark mode looks amazing. 😍',
			likes: 24,
			retweets: 8,
			replies: 3,
			timestamp: '4h',
			avatar: 'https://source.unsplash.com/random/100x100?face,2'
		}
	]);

	let newTweetContent = '';

	function addTweet() {
		if (newTweetContent.trim()) {
			tweets.update((currentTweets) => [
				{
					id: Date.now(),
					username: 'Current User',
					handle: '@currentuser',
					content: newTweetContent,
					likes: 0,
					retweets: 0,
					replies: 0,
					timestamp: 'now',
					avatar: 'https://source.unsplash.com/random/100x100?face,3'
				},
				...currentTweets
			]);
			newTweetContent = '';
		}
	}

	function likeTweet(tweetId: number) {
		tweets.update((currentTweets) =>
			currentTweets.map((tweet) =>
				tweet.id === tweetId ? { ...tweet, likes: tweet.likes + 1 } : tweet
			)
		);
	}
</script>

<div class="w-full h-full @container">
	<div class="flex flex-col h-full bg-surface-100-800-token">
		<!-- Header -->
		<header class="p-4 border-b border-surface-300-600-token">
			<h1 class="h2 text-xl @sm:text-2xl @lg:text-3xl">Home</h1>
		</header>

		<!-- Tweet Composer -->
		<div class="p-4 border-b border-surface-300-600-token">
			<div class="flex gap-4">
				<img
					src="https://source.unsplash.com/random/100x100?face,3"
					alt="User avatar"
					class="w-12 h-12 rounded-full"
				/>
				<div class="flex-grow">
					<textarea
						bind:value={newTweetContent}
						placeholder="What's happening?"
						class="w-full h-24 p-2 bg-surface-200-700-token rounded-lg resize-none textarea"
					/>
					<div class="flex justify-end mt-2">
						<button
							on:click={addTweet}
							disabled={!newTweetContent.trim()}
							class="btn variant-filled-primary"
						>
							Tweet
						</button>
					</div>
				</div>
			</div>
		</div>

		<!-- Tweet Feed -->
		<div class="flex-grow overflow-y-auto">
			{#each $tweets as tweet (tweet.id)}
				<article class="p-4 border-b border-surface-300-600-token hover:bg-surface-200-700-token">
					<div class="flex gap-4">
						<img
							src={tweet.avatar}
							alt="{tweet.username}'s avatar"
							class="w-12 h-12 rounded-full"
						/>
						<div class="flex-grow">
							<div class="flex items-center gap-2">
								<span class="font-bold">{tweet.username}</span>
								<span class="text-surface-400-500-token">{tweet.handle}</span>
								<span class="text-surface-400-500-token">· {tweet.timestamp}</span>
							</div>
							<p class="my-2">{tweet.content}</p>
							<div class="flex justify-between max-w-md">
								<button class="btn btn-sm variant-soft">
									<i class="fas fa-comment mr-2" />
									{tweet.replies}
								</button>
								<button class="btn btn-sm variant-soft">
									<i class="fas fa-retweet mr-2" />
									{tweet.retweets}
								</button>
								<button class="btn btn-sm variant-soft" on:click={() => likeTweet(tweet.id)}>
									<i class="fas fa-heart mr-2" />
									{tweet.likes}
								</button>
								<button class="btn btn-sm variant-soft">
									<i class="fas fa-share" />
								</button>
							</div>
						</div>
					</div>
				</article>
			{/each}
		</div>
	</div>
</div>