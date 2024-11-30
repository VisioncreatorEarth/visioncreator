<script lang="ts">
	import Icon from '@iconify/svelte';
	export let me;
	const query = $me.query;

	$: mode = $query.data?.mode || 'info';

	// Default texts for each mode, can be overridden by query.data.text
	$: defaultText =
		mode === 'alpha'
			? 'This potential future Skill is just one of many mockup ideas: Voting for new skills opens soon!'
			: mode === 'beta'
			? 'Things can break anytime. We love to hear your feedback! "Message Us" via clicking on Hominio at the bottom'
			: 'Set Your Message Here';

	$: text = $query.data?.text || defaultText;

	$: bannerClass =
		mode === 'alpha'
			? 'bg-error-600 text-error-100'
			: mode === 'beta'
			? 'bg-primary-600 text-primary-900'
			: 'bg-secondary-900 text-secondary-200';

	$: icon =
		mode === 'alpha'
			? 'mdi:alert-decagram'
			: mode === 'beta'
			? 'mdi:information-outline'
			: 'mdi:lightbulb-outline';

	$: label = mode === 'alpha' ? 'ALPHA' : mode === 'beta' ? 'BETA' : 'INFO';
</script>

<div class="flex justify-left items-start p-2 sm:p-4 w-full {bannerClass} font-semibold shadow-lg">
	<div class="flex gap-1 items-start w-full sm:gap-2 sm:items-center">
		<!-- Mobile: Stack vertically, Desktop: Stay horizontal -->
		<div class="flex flex-col gap-1 items-center w-full sm:gap-2 sm:flex-row sm:items-start">
			<!-- Text centered and smaller on mobile -->
			<p class="text-xs text-center sm:text-left sm:text-sm">
				<span class="text-xs font-bold sm:text-sm">{label} -</span>
				{text}
			</p>
		</div>
	</div>
</div>
