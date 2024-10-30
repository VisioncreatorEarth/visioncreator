<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	const dispatch = createEventDispatcher();

	const legalLinks = [
		{
			en: {
				title: 'Site Notice',
				link: '/en/legal-notice'
			},
			de: {
				title: 'Impressum',
				link: '/de/impressum'
			}
		},
		{
			en: {
				title: 'Privacy Policy',
				link: '/en/privacy-policy'
			},
			de: {
				title: 'Datenschutz',
				link: '/de/datenschutz'
			}
		},
		{
			en: {
				title: 'Social Media Privacy Policy',
				link: '/en/social-media-privacy-policy'
			},
			de: {
				title: 'Social Media Datenschutz',
				link: '/de/social-media-datenschutz'
			}
		}
	];

	function closeModal() {
		window.dispatchEvent(new CustomEvent('closeModal'));
	}
</script>

<div class="p-4 space-y-2">
	<header class="text-center p-4">
		<h2 class="text-2xl text-tertiary-50 h1">Legal Documents</h2>
		<p class="text-tertiary-300">Important information about your rights and our policies</p>
	</header>
	<div class="grid grid-cols-2 gap-4">
		{#each legalLinks as link}
			<!-- English Version -->
			<a
				href={link.en.link}
				class="px-3 py-2 rounded-xl bg-surface-800/50 border border-surface-700 hover:bg-surface-700/50 transition-colors flex items-center justify-center min-h-[2.5rem]"
				on:click={closeModal}
			>
				<span class="block text-sm text-tertiary-100 break-words text-center">
					{link.en.title}
				</span>
			</a>
			<!-- German Version -->
			<a
				href={link.de.link}
				class="px-3 py-2 rounded-xl bg-surface-800/50 border border-surface-700 hover:bg-surface-700/50 transition-colors flex items-center justify-center min-h-[2.5rem]"
				on:click={closeModal}
			>
				<span class="block text-sm text-tertiary-300 break-words text-center">
					{link.de.title}
				</span>
			</a>
		{/each}
	</div>
</div>
