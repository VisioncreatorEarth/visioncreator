<script lang="ts">
	import { onMount } from 'svelte';

	interface Point {
		x: number;
		y: number;
		pressure: number;
		timestamp: number;
	}

	interface Stroke {
		points: Point[];
		color: string;
		width: number;
	}

	let canvas: HTMLCanvasElement;
	let ctx: CanvasRenderingContext2D;
	let isDrawing = false;
	let currentStroke: Stroke | null = null;
	let strokes: Stroke[] = [];
	let currentColor = '#000000';
	let currentWidth = 2;

	$: canvasWidth = 0;
	$: canvasHeight = 0;

	let container: HTMLDivElement;

	function resizeCanvas() {
		if (container && canvas) {
			const rect = container.getBoundingClientRect();
			canvasWidth = rect.width;
			canvasHeight = rect.height;
			canvas.width = canvasWidth * window.devicePixelRatio;
			canvas.height = canvasHeight * window.devicePixelRatio;
			ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
			redrawCanvas();
		}
	}

	onMount(() => {
		ctx = canvas.getContext('2d')!;
		ctx.lineCap = 'round';
		ctx.lineJoin = 'round';
		
		const resizeObserver = new ResizeObserver(() => {
			resizeCanvas();
		});
		
		resizeObserver.observe(container);
		resizeCanvas();

		return () => {
			resizeObserver.disconnect();
		};
	});

	function startDrawing(event: MouseEvent | TouchEvent) {
		isDrawing = true;
		const point = getPoint(event);
		currentStroke = {
			points: [point],
			color: currentColor,
			width: currentWidth
		};
	}

	function draw(event: MouseEvent | TouchEvent) {
		if (!isDrawing || !currentStroke) return;
		event.preventDefault();
		
		const point = getPoint(event);
		currentStroke.points.push(point);
		
		const lastPoint = currentStroke.points[currentStroke.points.length - 2] || point;
		
		ctx.beginPath();
		ctx.strokeStyle = currentStroke.color;
		ctx.lineWidth = currentStroke.width;
		ctx.moveTo(lastPoint.x, lastPoint.y);
		ctx.lineTo(point.x, point.y);
		ctx.stroke();
	}

	function stopDrawing() {
		if (currentStroke) {
			strokes.push(currentStroke);
			strokes = strokes;
		}
		isDrawing = false;
		currentStroke = null;
	}

	function getPoint(event: MouseEvent | TouchEvent): Point {
		let clientX: number;
		let clientY: number;
		let pressure = 1;

		if (event instanceof MouseEvent) {
			clientX = event.clientX;
			clientY = event.clientY;
		} else {
			clientX = event.touches[0].clientX;
			clientY = event.touches[0].clientY;
			pressure = event.touches[0].force || 1;
		}

		const rect = canvas.getBoundingClientRect();
		return {
			x: clientX - rect.left,
			y: clientY - rect.top,
			pressure,
			timestamp: Date.now()
		};
	}

	function redrawCanvas() {
		if (!ctx) return;
		ctx.clearRect(0, 0, canvasWidth, canvasHeight);
		
		strokes.forEach(stroke => {
			if (stroke.points.length < 2) return;
			
			ctx.beginPath();
			ctx.strokeStyle = stroke.color;
			ctx.lineWidth = stroke.width;
			
			ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
			
			for (let i = 1; i < stroke.points.length; i++) {
				ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
			}
			
			ctx.stroke();
		});
	}

	function clearCanvas() {
		strokes = [];
		ctx.clearRect(0, 0, canvasWidth, canvasHeight);
	}
</script>

<div class="w-full h-full @container" bind:this={container}>
	<div class="w-full h-full flex flex-col gap-4 p-4 bg-surface-100-800-token">
		<div class="flex justify-between items-center">
			<h2 class="h2">Xiaomi Canvas</h2>
			<div class="flex gap-2 items-center">
				<input
					type="color"
					bind:value={currentColor}
					class="w-8 h-8 rounded cursor-pointer"
				/>
				<input
					type="range"
					bind:value={currentWidth}
					min="1"
					max="20"
					class="range"
				/>
				<button class="btn variant-filled-error" on:click={clearCanvas}>
					Clear
				</button>
			</div>
		</div>
		
		<div class="relative flex-grow card variant-filled">
			<canvas
				bind:this={canvas}
				style="width: 100%; height: 100%; touch-action: none;"
				on:mousedown={startDrawing}
				on:mousemove={draw}
				on:mouseup={stopDrawing}
				on:mouseleave={stopDrawing}
				on:touchstart={startDrawing}
				on:touchmove={draw}
				on:touchend={stopDrawing}
				class="cursor-crosshair"
			/>
		</div>
	</div>
</div>