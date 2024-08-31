<script>
	import { Autocomplete } from '@skeletonlabs/skeleton';
	import { futureMe } from '$lib/stores';
	import { onMount } from 'svelte';

	let countries = [];
	let selectedCountry = '';

	onMount(async () => {
		const response = await fetch('https://restcountries.com/v3.1/all');
		const data = await response.json();
		countries = data.map((country) => ({
			value: country.cca2,
			label: country.name.common
		}));
	});

	function handleCountryChange(event) {
		const countryCode = event.detail.value;
		futureMe.update((current) => ({
			...current,
			country_code: countryCode
		}));
	}
</script>

<div class="flex flex-col md:flex-row gap-4 w-full max-w-6xl mt-4">
	<Autocomplete
		class="w-full md:w-1/2"
		input$class="px-4 py-3 @md:px-6 @md:py-4 text-lg @md:text-2xl text-white transition-all duration-300 ease-in-out bg-white border-2 rounded-full outline-none bg-opacity-20 border-primary-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
		options={countries}
		bind:value={selectedCountry}
		on:selection={handleCountryChange}
	/>
</div>
