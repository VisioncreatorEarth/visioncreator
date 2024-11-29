<script lang="ts">
	import Icon from '@iconify/svelte';
	export let me;
	const query = $me.query;

	$: mode = $query.data?.mode || 'info';

	// Default texts for each mode, can be overridden by query.data.text
	$: defaultText =
		mode === 'alpha'
			? 'This potential future Skill is just on of many mockup ideas: Voting for new skills opens soon!'
			: mode === 'beta'
			? 'Things can break anytime. We love to hear your feedback! Open the "Message Us" form by clicking on Hominio at the bottom'
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

	$: label = mode === 'alpha' ? 'PRE-ALPHA' : mode === 'beta' ? 'BETA' : 'INFO';
</script>

<div class="flex justify-left items-start p-4 w-full {bannerClass} font-semibold shadow-lg">
	<div class="flex gap-2 items-start w-full sm:items-center">
		<!-- Mobile: Stack vertically, Desktop: Stay horizontal -->
		<div class="flex flex-col gap-2 items-center w-full sm:flex-row sm:items-start">
			<!-- Label always centered on mobile -->
			<div class="flex gap-2 justify-center items-center w-full sm:w-auto sm:justify-start">
				<Icon {icon} class="w-5 h-5 sm:w-6 sm:h-6" />
				<span class="text-sm font-bold sm:text-base">{label}</span>
			</div>
			<!-- Text centered and smaller on mobile -->
			<p class="text-sm text-center sm:text-left sm:text-base">
				{text}
			</p>
		</div>
	</div>
</div>
