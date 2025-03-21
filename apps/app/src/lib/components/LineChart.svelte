<script lang="ts">
	// LineChart.svelte - A reusable line chart component
	
	// Props
	export let height = 260; // Chart height
	export let width = 500;  // Chart width
	export let showNegativeValues = true; // Whether to show negative values on y-axis
	export let data = [
		{ month: 'Sep', value: 6000 },
		{ month: 'Oct', value: 9000 },
		{ month: 'Nov', value: 13000 },
		{ month: 'Dec', value: 17000 },
		{ month: 'Jan', value: 22000 },
		{ month: 'Feb', value: 28000 }
	]; // Default data if none provided
	
	// Chart dimensions
	$: chartHeight = height;
	$: chartWidth = width;
	
	// Generate more detailed data points for a smoother line
	function generateDetailedData() {
		const result = [];
		// Create 10 points between each month for a smoother curve
		for (let i = 0; i < data.length - 1; i++) {
			const startPoint = data[i];
			const endPoint = data[i + 1];
			const startValue = startPoint.value;
			const endValue = endPoint.value;
			
			// Add the start point
			result.push({
				x: i * 100,
				y: startValue,
				isMainPoint: true,
				month: startPoint.month
			});
			
			// Add intermediate points
			for (let j = 1; j < 10; j++) {
				const progress = j / 10;
				// Base interpolation between months
				const baseValue = startValue + (endValue - startValue) * progress;
				
				// Add some natural variation
				const variation = Math.sin(progress * Math.PI) * (Math.random() * 800 - 400);
				const value = baseValue + variation;
				
				result.push({
					x: i * 100 + progress * 100,
					y: value,
					isMainPoint: false
				});
			}
		}
		
		// Add the final point
		result.push({
			x: (data.length - 1) * 100,
			y: data[data.length - 1].value,
			isMainPoint: true,
			month: data[data.length - 1].month
		});
		
		return result;
	}
	
	// Generate detailed data points
	$: detailedData = generateDetailedData();
	
	// Pre-calculate the line points for main month markers
	$: linePoints = detailedData.filter(point => point.isMainPoint).map(point => {
		return {
			x: point.x,
			y: chartHeight - ((point.y + (showNegativeValues ? 10000 : 0)) / 150) // Adjusted scale for taller chart with optional offset
		};
	});
	
	// Pre-calculate detailed line segments for the smooth curve
	interface LineSegment {
		x1: number;
		y1: number;
		x2: number;
		y2: number;
	}
	
	// Pre-calculate the line segments
	$: lineSegments = (() => {
		const segments: LineSegment[] = [];
		for (let i = 0; i < detailedData.length - 1; i++) {
			segments.push({
				x1: detailedData[i].x,
				y1: chartHeight - ((detailedData[i].y + (showNegativeValues ? 10000 : 0)) / 150), // Adjusted scale with offset
				x2: detailedData[i + 1].x,
				y2: chartHeight - ((detailedData[i + 1].y + (showNegativeValues ? 10000 : 0)) / 150) // Adjusted scale with offset
			});
		}
		return segments;
	})();
	
	// Pre-calculate the area path
	$: areaPathString = (() => {
		let path = `M 0 ${chartHeight} L ${detailedData[0].x} ${chartHeight - ((detailedData[0].y + (showNegativeValues ? 10000 : 0)) / 150)}`;
		
		// Add points for each data point
		for (let i = 1; i < detailedData.length; i++) {
			path += ` L ${detailedData[i].x} ${chartHeight - ((detailedData[i].y + (showNegativeValues ? 10000 : 0)) / 150)}`;
		}
		
		// Close the path
		path += ` L ${detailedData[detailedData.length - 1].x} ${chartHeight} Z`;
		
		return path;
	})();
	
	// Y-axis ticks with more values for the taller chart, including negative values if needed
	$: yTicks = showNegativeValues 
		? [-10000, -5000, 0, 5000, 10000, 15000, 20000, 25000, 30000]
		: [0, 5000, 10000, 15000, 20000, 25000, 30000];
</script>

<div class="line-chart h-full w-full flex justify-center">
	<svg width="100%" height="100%" viewBox="0 0 600 {chartHeight + 40}" preserveAspectRatio="xMidYMid meet">
		<g transform="translate(50, 20)">
			<!-- Static chart with hardcoded values -->
			<line x1="0" y1="0" x2="0" y2="{chartHeight}" stroke="#ffffff" stroke-opacity="0.8" stroke-width="1.5" />
			<line x1="0" y1="{chartHeight}" x2="520" y2="{chartHeight}" stroke="#ffffff" stroke-opacity="0.8" stroke-width="1.5" />
			
			<!-- Y-axis ticks and labels -->
			{#each yTicks as value}
				<line 
					x1="0" 
					y1="{chartHeight - ((value + (showNegativeValues ? 10000 : 0)) / 150)}" 
					x2="520" 
					y2="{chartHeight - ((value + (showNegativeValues ? 10000 : 0)) / 150)}" 
					stroke="#ffffff" 
					stroke-opacity="0.15" 
					stroke-dasharray="2,2"
				/>
				<text 
					x="-10" 
					y="{chartHeight - ((value + (showNegativeValues ? 10000 : 0)) / 150)}" 
					text-anchor="end" 
					dominant-baseline="middle"
					fill="#ffffff"
					font-size="12px"
					font-weight="600"
				>
					€{value/1000}K
				</text>
			{/each}
			
			<!-- Zero line highlighted -->
			<line 
				x1="0" 
				y1="{chartHeight - ((0 + (showNegativeValues ? 10000 : 0)) / 150)}" 
				x2="520" 
				y2="{chartHeight - ((0 + (showNegativeValues ? 10000 : 0)) / 150)}" 
				stroke="#ffffff" 
				stroke-opacity="0.4" 
				stroke-width="1.5"
			/>
			
			<!-- Simplified X-axis -->
			{#each data as point, i}
				<text 
					x="{i * 100}" 
					y="{chartHeight + 20}" 
					text-anchor="middle" 
					fill="#ffffff" 
					font-size="14px"
					font-weight="600"
				>
					{point.month}
				</text>
			{/each}
			
			<!-- Fill area under the line -->
			<path 
				d={areaPathString}
				fill="#6366f1"
				fill-opacity="0.15"
				class="filter-glow"
			/>
			
			<!-- Detailed line segments for smoother curve -->
			{#each lineSegments as segment}
				<line 
					x1="{segment.x1}" 
					y1="{segment.y1}" 
					x2="{segment.x2}" 
					y2="{segment.y2}" 
					stroke="#6366f1" 
					stroke-width="2"
					class="filter-glow"
				/>
			{/each}
			
			<!-- Only show circles for main month points -->
			{#each linePoints as point, i}
				<circle 
					cx="{point.x}" 
					cy="{point.y}" 
					r="4" 
					fill="#ffffff"
					stroke="#6366f1"
					stroke-width="2"
					class="filter-glow"
				/>
			{/each}
		</g>
	</svg>
</div>

<style>
	/* Add glow effect for the chart line */
	.filter-glow {
		filter: drop-shadow(0 0 6px rgba(99, 102, 241, 0.8)); /* Stronger glow */
	}

	/* Set a general stroke width for the chart */
	:global(.line-chart svg line) {
		stroke-width: 1.2px;
	}
	
	/* Ensure text is visible with proper sizing */
	:global(.line-chart svg text) {
		font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
		font-size: 12px;
		font-weight: 600;
		fill: #ffffff;
	}
</style> 