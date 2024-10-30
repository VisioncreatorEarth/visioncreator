<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	const dispatch = createEventDispatcher();

	const legalLinks = [
		{
			title: 'Terms of Service',
			content: 'These Terms of Service ("Terms") govern your access to and use of our services...',
			lastUpdated: '2024-03-15'
		},
		{
			title: 'Privacy Policy',
			content:
				'At our company, we take your privacy seriously. This Privacy Policy explains how we collect...',
			lastUpdated: '2024-03-10'
		},
		{
			title: 'Cookie Policy',
			content: 'Our Cookie Policy explains how we use cookies and similar tracking technologies...',
			lastUpdated: '2024-03-01'
		},
		{
			title: 'Data Processing Agreement',
			content: 'This Data Processing Agreement ("DPA") forms part of the Agreement between...',
			lastUpdated: '2024-02-28'
		}
	];
</script>

<div class="p-4 space-y-6">
	<header class="text-center mb-8">
		<h2 class="text-2xl font-bold text-tertiary-50">Legal Documents</h2>
		<p class="text-tertiary-300">Important information about your rights and our policies</p>
	</header>

	<div class="space-y-6">
		{#each legalLinks as link}
			<div class="p-4 rounded-lg bg-surface-800 border border-surface-700">
				<h3 class="text-lg font-semibold text-tertiary-100 mb-2">{link.title}</h3>
				<p class="text-tertiary-300 text-sm mb-3">{link.content}</p>
				<div class="flex justify-between items-center text-xs">
					<span class="text-tertiary-400">Last updated: {link.lastUpdated}</span>
					<button class="btn btn-sm variant-ghost-tertiary">Read More</button>
				</div>
			</div>
		{/each}
	</div>
</div>
