<script lang="ts">
	import { goto } from '$app/navigation';
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
		dispatch('close');
	}

	async function handleNavigation(e: Event, path: string) {
		e.preventDefault();

		// Close modal first
		closeModal();

		try {
			// Small delay to ensure modal is closed
			await new Promise((resolve) => setTimeout(resolve, 100));

			// Navigate using goto with specific options
			await goto(path, {
				replaceState: false,
				noScroll: true,
				invalidateAll: true
			});
		} catch (error) {
			// Fallback to direct navigation if goto fails
			console.error('Navigation failed, using fallback:', error);
			window.location.href = path;
		}
	}
</script>

<div class="p-4 space-y-2">
	<header class="p-4 text-center">
		<h2 class="text-2xl text-tertiary-50 h1">Legal Documents</h2>
		<p class="text-tertiary-300">Important information about us, your rights and our policies</p>
	</header>
	<div class="grid grid-cols-2 gap-4">
		{#each legalLinks as link}
			<!-- English Version -->
			<a
				href={link.en.link}
				data-sveltekit-preload-data="hover"
				class="px-3 py-2 rounded-xl bg-surface-800/50 border border-surface-700 hover:bg-surface-700/50 transition-colors flex items-center justify-center min-h-[2.5rem]"
				on:click={(e) => handleNavigation(e, link.en.link)}
			>
				<span class="block text-sm text-center break-words text-tertiary-100">
					{link.en.title}
				</span>
			</a>
			<!-- German Version -->
			<a
				href={link.de.link}
				data-sveltekit-preload-data="hover"
				class="px-3 py-2 rounded-xl bg-surface-800/50 border border-surface-700 hover:bg-surface-700/50 transition-colors flex items-center justify-center min-h-[2.5rem]"
				on:click={(e) => handleNavigation(e, link.de.link)}
			>
				<span class="block text-sm text-center break-words text-tertiary-300">
					{link.de.title}
				</span>
			</a>
		{/each}
	</div>
</div>
