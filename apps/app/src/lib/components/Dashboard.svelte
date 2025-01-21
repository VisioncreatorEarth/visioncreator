<script lang="ts">
	import { createMutation } from '$lib/wundergraph';
	export let me;
	const query = $me.query;

	const FIBONACCI_MILESTONES = [1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144];
	const TOTAL_FOUNDERS = 144;
	const CURRENT_FOUNDERS = 16;

	// Calculate all milestone values
	$: currentCircle = FIBONACCI_MILESTONES.findIndex((n) => n > CURRENT_FOUNDERS) + 1;
	$: currentTarget = FIBONACCI_MILESTONES[currentCircle - 1];
	$: previousTotal = currentCircle > 1 ? FIBONACCI_MILESTONES[currentCircle - 2] : 0;
	$: seatsInCurrentCircle = currentTarget - previousTotal;
	$: spotsInCurrentCircle = CURRENT_FOUNDERS - previousTotal;
	$: remainingSeats = currentTarget - CURRENT_FOUNDERS;
	$: progressPercentage = (spotsInCurrentCircle / seatsInCurrentCircle) * 100;
	$: circles = FIBONACCI_MILESTONES.map((_, index) => index + 1);
	$: isCircleFilled = (circle: number) => circle < currentCircle;

	// Setup mail mutation
	const sendMailMutation = createMutation({
		operationName: 'sendMail'
	});

	let mailSent = false;

	async function handleRequestDetails() {
		try {
			const mailSubject = `${$query.data.name} wants to learn more about becoming a VC`;
			const mailBody = `Dear ${$query.data.name},

Thank you for your interest in becoming a Visioncreator founding member. We've received your information request.

Summary of Current Status:
• Circle: ${currentCircle}
• Available Seats: ${remainingSeats}
• Total Founders: ${CURRENT_FOUNDERS}

We'll contact you about:
• Founding member privileges
• Next steps

We are looking forward to talk to you,
Chielo, Yvonne and Samuel
`;

			await $sendMailMutation.mutateAsync({
				subject: mailSubject,
				body: mailBody
			});

			mailSent = true;
		} catch (error) {
			console.error('Failed to send mail:', error);
			alert('Failed to send request. Please try again later.');
		}
	}
</script>

<div class="@container fixed inset-0 overflow-hidden">
	<div class="relative w-full h-full">
		<!-- Background Image -->
		<div
			class="absolute inset-0 bg-center bg-no-repeat bg-cover"
			style="background-image: url('/dashboard.jpg');"
		>
			<div class="absolute inset-0 bg-black/20" />
		</div>

		<!-- Grid Layout -->
		<div class="relative grid h-full grid-rows-[auto]">
			<!-- Main Content -->
			<div class="z-10 flex flex-col items-center justify-center p-4 overflow-y-auto">
				<div
					class="flex flex-col items-center justify-center max-w-2xl mx-auto space-y-6 text-center"
				>
					<h2
						class="text-2xl font-bold sm:text-3xl md:text-4xl text-tertiary-100 dark:text-surface-100"
					>
						Welcome {$query.data.name} <br />
						<span class="text-2xl font-thin"
							>become part of our founding family of {TOTAL_FOUNDERS}</span
						>
					</h2>

					<!-- Milestone Progress -->
					<div
						class="w-full h-4 max-w-md mb-2 rounded-full bg-tertiary-200/20 dark:bg-surface-800/20"
					>
						<div
							class="h-full transition-all duration-500 rounded-full bg-tertiary-300 dark:bg-surface-200"
							style="width: {progressPercentage}%"
						/>
					</div>

					<div class="space-y-3">
						<p class="text-xl font-semibold text-tertiary-100 dark:text-surface-100">
							{remainingSeats} seats left in Circle {currentCircle}
						</p>
						<p class="text-base text-tertiary-200 dark:text-surface-200">
							Join the first <span class="font-bold text-tertiary-100 dark:text-surface-100"
								>{CURRENT_FOUNDERS}</span
							> Visioncreators building the future
						</p>
					</div>

					<!-- Circle Display -->
					<div class="w-full max-w-md space-y-2">
						<div class="flex justify-between w-full mt-2">
							{#each circles as circle}
								<div class="flex flex-col items-center">
									<div
										class={`w-2 h-2 rounded-full ${
											isCircleFilled(circle)
												? 'bg-tertiary-300 dark:bg-surface-200'
												: 'bg-tertiary-200/40 dark:bg-surface-800/40'
										}`}
									/>
									<span class="mt-1 text-xs font-medium text-tertiary-200 dark:text-surface-200">
										C{circle}
									</span>
								</div>
							{/each}
						</div>
					</div>

					{#if !mailSent}
						<!-- CTA Button -->
						<button
							class=" btn bg-gradient-to-br variant-gradient-secondary-primary btn-md"
							on:click={handleRequestDetails}
							disabled={$sendMailMutation.isLoading}
						>
							{#if $sendMailMutation.isLoading}
								<div class="flex items-center justify-center gap-2">
									<span>Processing...</span>
								</div>
							{:else}
								Request Details By Mail Now
							{/if}
						</button>
					{:else}
						<!-- Success Card -->
						<div
							class="p-6 mt-8 border rounded-lg bg-tertiary-500/10 dark:bg-surface-800/50 border-tertiary-500/20 dark:border-surface-600/20"
						>
							<div class="flex flex-col items-center gap-4">
								<!-- Success Icon -->
								<div
									class="flex items-center justify-center w-12 h-12 rounded-full bg-tertiary-500/20 dark:bg-surface-700/50"
								>
									<svg
										class="w-6 h-6 text-tertiary-500 dark:text-surface-200"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M5 13l4 4L19 7"
										/>
									</svg>
								</div>

								<!-- Success Message -->
								<div class="text-center">
									<h3 class="text-lg font-semibold text-tertiary-100 dark:text-surface-100">
										Request Sent Successfully
									</h3>
									<p class="mt-2 text-sm text-tertiary-200/90 dark:text-surface-200/90">
										Please check your email for a confirmation. Our team will reach out with
										detailed information within 2 business days.
									</p>
								</div>
							</div>
						</div>
					{/if}
				</div>
			</div>
		</div>
	</div>
</div>

<footer class="fixed bottom-0 right-0 py-2 @sm:py-2 text-white z-50">
	<div class="px-4 @sm:px-4">
		<a
			href="https://unsplash.com/de/fotos/lichtstrahl-in-der-nahe-des-gewassers--p-KCm6xB9I"
			target="_blank"
			rel="noopener noreferrer"
			class="transition-colors text-2xs text-tertiary-500/80 hover:text-tertiary-500"
		>
			Image by SpaceX
		</a>
	</div>
</footer>

<style>
	:global(body) {
		background-color: rgba(24, 25, 73, 1);
	}
</style>
