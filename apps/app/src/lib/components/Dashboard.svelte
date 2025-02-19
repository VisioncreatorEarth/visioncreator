<script lang="ts">
	import { createMutation, createQuery } from '$lib/wundergraph';
	import { onMount } from 'svelte';
	import Avatar from './Avatar.svelte';

	export let me;
	const query = $me.query;

	interface NotificationData {
		notifications: Array<{
			id: string;
			message: {
				id: string;
				content: string;
				created_at: string;
			};
			sender: {
				id: string;
				name: string | null;
				avatar_url: string | null;
			};
			proposal: {
				id: string;
				title: string;
			};
			is_read: boolean;
			read_at: string | null;
			created_at: string;
		}>;
	}

	// Setup notifications query
	const notificationsQuery = createQuery({
		operationName: 'queryUserNotifications' as const,
		enabled: true,
		refetchInterval: 5000
	});

	// Debug logging for notifications query state
	$: console.log('Notifications Query State:', {
		isLoading: $notificationsQuery.isLoading,
		isError: !!$notificationsQuery.error,
		error: $notificationsQuery.error,
		data: $notificationsQuery.data
	});

	// Debug logging for notifications data
	$: if ($notificationsQuery.data) {
		console.log('Received notifications:', {
			count: $notificationsQuery.data.notifications?.length,
			notifications: $notificationsQuery.data.notifications
		});
	}

	const FIBONACCI_MILESTONES = [1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144];
	const TOTAL_FOUNDERS = 144;
	const CURRENT_FOUNDERS = 21;

	// Setup updateMe mutation
	const updateMeMutation = createMutation({
		operationName: 'updateMe'
	});

	// Check for null username and trigger update if needed
	onMount(() => {
		setTimeout(async () => {
			// Only update if name is strictly null or undefined
			if ($query.data?.name === null || $query.data?.name === undefined) {
				console.log('Detected missing/null username, triggering updateMe');
				try {
					await $updateMeMutation.mutateAsync({
						// Don't pass name at all to ensure random name generation
						name: undefined
					});
					console.log('Username updated successfully');
					// Optionally refresh the query to show new name
					await query.refetch();
				} catch (error) {
					console.error('Failed to update null username:', error);
				}
			} else {
				console.log('Username already set:', $query.data?.name);
			}
		}, 5000); // 5 second delay
	});

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

	// Add markNotificationsRead mutation
	const markNotificationsReadMutation = createMutation({
		operationName: 'markNotificationsRead'
	});

	// Add function to handle notification click
	async function handleNotificationClick(notification: any) {
		if (!notification.is_read) {
			try {
				await $markNotificationsReadMutation.mutateAsync({
					notificationIds: [notification.id]
				});
				// Refetch notifications to update UI
				await $notificationsQuery.refetch();
			} catch (error) {
				console.error('Error marking notification as read:', error);
			}
		}
	}

	// Helper function to get avatar props
	function getAvatarProps(seed: string, highlight = false) {
		return {
			data: { seed },
			design: { highlight },
			size: 'sm' as const
		};
	}

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
						Welcome {$query.data?.name ? $query.data.name : ''} <br />
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
							class="btn bg-gradient-to-br variant-gradient-secondary-primary btn-md"
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

					<!-- Notifications Section -->
					<div class="w-full max-w-2xl mt-8">
						<div class="space-y-4">
							<h3 class="text-xl font-semibold text-tertiary-100 dark:text-surface-100">
								Recent Notifications
							</h3>

							<!-- Notifications Query -->
							{#if $notificationsQuery.isLoading}
								<div class="flex items-center justify-center p-4">
									<div class="text-tertiary-200 dark:text-surface-200">
										Loading notifications...
									</div>
								</div>
							{:else if $notificationsQuery.error}
								<div class="p-4 border rounded-lg bg-red-500/10 border-red-500/20">
									<p class="text-red-500">
										Failed to load notifications: {$notificationsQuery.error.message}
									</p>
								</div>
							{:else if !$notificationsQuery.data?.notifications?.length}
								<div
									class="p-4 text-center border rounded-lg bg-tertiary-500/10 dark:bg-surface-800/50 border-tertiary-500/20 dark:border-surface-600/20"
								>
									<p class="text-tertiary-200 dark:text-surface-200">No notifications yet</p>
								</div>
							{:else}
								<div class="space-y-2">
									{#each $notificationsQuery.data.notifications as notification}
										<div
											class="p-4 transition-colors border rounded-lg hover:bg-tertiary-500/5 dark:hover:bg-surface-800/50 bg-tertiary-500/10 dark:bg-surface-800/30 border-tertiary-500/20 dark:border-surface-600/20 cursor-pointer"
											class:opacity-75={notification.is_read}
											on:click={() => handleNotificationClick(notification)}
										>
											<div class="flex items-start gap-4">
												<!-- Avatar -->
												<div class="flex-shrink-0">
													<Avatar me={getAvatarProps(notification.sender.id)} />
												</div>

												<!-- Content -->
												<div class="flex-1 min-w-0">
													<div class="flex items-baseline justify-between gap-2">
														<p class="text-sm font-medium text-tertiary-100 dark:text-surface-100">
															{notification.sender.name || 'Unknown User'}
														</p>
														<span class="text-xs text-tertiary-300 dark:text-surface-300">
															{new Date(notification.created_at).toLocaleString()}
														</span>
													</div>

													<p class="mt-1 text-sm text-tertiary-200 dark:text-surface-200">
														{notification.message.content}
													</p>

													<div class="mt-2">
														<span
															class="text-xs font-medium text-tertiary-300 dark:text-surface-300"
														>
															in proposal: {notification.proposal.title}
														</span>
													</div>
												</div>

												<!-- Unread indicator -->
												{#if !notification.is_read}
													<div class="flex-shrink-0">
														<div class="w-2 h-2 rounded-full bg-tertiary-300 dark:bg-surface-200" />
													</div>
												{/if}
											</div>
										</div>
									{/each}
								</div>
							{/if}
						</div>
					</div>
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
