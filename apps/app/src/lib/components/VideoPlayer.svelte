<script lang="ts">
	export let videoId: string;
</script>

<div class="video-container">
	<iframe
		class="video-player"
		src={`https://peertube.visioncreator.earth/videos/embed/${videoId}?title=0&warningTitle=0&peertubeLink=0&p2p=0`}
		frameborder="0"
		allowfullscreen
		sandbox="allow-same-origin allow-scripts allow-popups"
		title="PeerTube video player"
	/>
</div>

<style>
	.video-container {
		position: relative;
		width: 100%;
		padding-top: 56.25%; /* 16:9 Aspect Ratio */
		background: black;
		overflow: hidden;
		border-radius: 1rem;
	}

	.video-player {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		border: none;
		border-radius: 1rem;
	}
</style>
