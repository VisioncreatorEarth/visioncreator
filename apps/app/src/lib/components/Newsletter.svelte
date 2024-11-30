<script lang="ts">
	import { createQuery, createMutation } from '$lib/wundergraph';
	import { SlideToggle } from '@skeletonlabs/skeleton';

	export let me: { email: string; id: string };

	const newsletterStatus = createQuery({
		operationName: 'MyNewsletterStatus',
		input: {
			id: me.id,
			email: me.email
		}
	});

	const toggleNewsletterMutation = createMutation({
		operationName: 'NewsletterToggle'
	});

	const handleToggleNewsletter = async () => {
		try {
			const response = await $toggleNewsletterMutation.mutateAsync({
				id: me.id,
				email: me.email
			});
			console.log('Toggle newsletter response:', response);
			await $newsletterStatus.refetch();
		} catch (error) {
			console.error('Detailed error during newsletter toggle process:', error);
			console.error('Error during newsletter toggle process:', error);
		}
	};
</script>

<div class="flex items-center px-2 py-2 space-x-3">
	{#if $newsletterStatus.isLoading}
		<span class="text-sm sm:text-base text-surface-400">Loading...</span>
	{:else if $newsletterStatus.isError}
		<span class="text-sm sm:text-base text-error-400">Error loading status</span>
	{:else}
		<SlideToggle
			name="newsletter-toggle"
			checked={$newsletterStatus.data}
			on:change={handleToggleNewsletter}
			active="bg-tertiary-500"
			background="bg-surface-700/50"
			size="sm"
			class="scale-90 sm:scale-100 md:scale-110"
		/>
		<span class="text-sm sm:text-base text-surface-200">Newsletter</span>
	{/if}
</div>
