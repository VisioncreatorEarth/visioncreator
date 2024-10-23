<script lang="ts">
	import { ListBox, ListBoxItem } from '@skeletonlabs/skeleton';
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

	function handleLinkClick(event: Event, href: string) {
		event.preventDefault();
		dispatch('navigate', { href });
	}
</script>

<div class="flex flex-col items-start justify-center w-full h-full">
	<ListBox class="w-full max-w-sm">
		<ListBoxItem value="privacy" on:click={(e) => handleLinkClick(e, '/en/privacy-policy')}>
			Privacy Policy
		</ListBoxItem>
		<ListBoxItem value="imprint" on:click={(e) => handleLinkClick(e, '/en/imprint')}>
			Site Notice
		</ListBoxItem>
	</ListBox>
</div>
