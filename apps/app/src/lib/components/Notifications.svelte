<!--
HOW THIS COMPONENT WORKS:

1. Overview:
   This component handles the notification system:
   - Displays unread notifications in a Tinder-like carousel
   - Shows different types of notifications (messages, votes)
   - Swipe right to mark as read
   - Swipe left to view later (skip)
   - Shows newest notifications first
   - Real-time updates via polling

2. Features:
   - Tinder-style card interface
   - Different icons for different notification types
   - Swipe/button interactions
   - Real-time notification updates (5s polling)
   - Avatar integration
   - Responsive design
-->

<script lang="ts">
	import { createQuery, createMutation } from '$lib/wundergraph';
	import Avatar from './Avatar.svelte';
	import Icon from '@iconify/svelte';
	import { fade, fly } from 'svelte/transition';

	interface NotificationData {
		notifications: Array<{
			id: string;
			content: string;
			type: 'message' | 'vote_up' | 'vote_down';
			sender: {
				id: string;
				name: string | null;
			};
			proposal: {
				id: string;
				title: string;
			};
			is_read: boolean;
			read_at: string | null;
			created_at: string;
			metadata: {
				transaction_type?: string;
				amount?: number;
				proposal_id?: string;
			};
		}>;
	}

	// Setup notifications query
	const notificationsQuery = createQuery({
		operationName: 'queryUserNotifications' as const,
		enabled: true,
		refetchInterval: 5000
	});

	// Add markNotificationsRead mutation
	const markNotificationsReadMutation = createMutation({
		operationName: 'markNotificationsRead'
	});

	let currentIndex = 0;

	// Add function to handle mark as read
	async function handleMarkAsRead(notification: any) {
		if (!notification.is_read) {
			try {
				await $markNotificationsReadMutation.mutateAsync({
					notificationIds: [notification.id]
				});
				// Move to next notification
				currentIndex++;
				// Immediately refetch notifications
				await $notificationsQuery.refetch();
			} catch (error) {
				console.error('Error marking notification as read:', error);
			}
		}
	}

	// Add function to handle skip
	function handleSkip() {
		currentIndex++;
	}

	// Helper function to get avatar props
	function getAvatarProps(seed: string, highlight = false) {
		return {
			data: { seed },
			design: { highlight },
			size: 'sm' as const
		};
	}

	// Helper function to get notification icon
	function getNotificationIcon(type: 'message' | 'vote_up' | 'vote_down') {
		switch (type) {
			case 'message':
				return 'heroicons:chat-bubble-left-text';
			case 'vote_up':
				return 'heroicons:arrow-up-circle';
			case 'vote_down':
				return 'heroicons:arrow-down-circle';
			default:
				return 'heroicons:bell';
		}
	}

	// Helper function to get notification icon color class
	function getNotificationIconColor(type: 'message' | 'vote_up' | 'vote_down') {
		switch (type) {
			case 'message':
				return 'text-primary-400';
			case 'vote_up':
				return 'text-success-400';
			case 'vote_down':
				return 'text-warning-400';
			default:
				return 'text-tertiary-400';
		}
	}

	$: notifications = $notificationsQuery.data?.notifications || [];
	$: currentNotification = notifications[currentIndex];
	$: hasMore = currentIndex < notifications.length;
</script>

<section
	class="w-full p-6 space-y-4 border rounded-lg bg-tertiary-500/10 dark:bg-surface-800/50 border-tertiary-500/20 dark:border-surface-600/20"
>
	<header class="flex items-center justify-between">
		<h3 class="text-xl font-semibold text-tertiary-100 dark:text-surface-100">
			Recent Notifications
		</h3>
		<div class="text-sm text-tertiary-300 dark:text-surface-300">
			{#if notifications.length > 0}
				{currentIndex + 1} of {notifications.length}
			{/if}
		</div>
	</header>

	<!-- Notifications Content -->
	<div class="relative min-h-[200px]">
		{#if $notificationsQuery.isLoading}
			<div class="flex items-center justify-center p-4">
				<div class="text-tertiary-200 dark:text-surface-200">Loading notifications...</div>
			</div>
		{:else if $notificationsQuery.error}
			<div class="p-4 border rounded-lg bg-red-500/10 border-red-500/20">
				<p class="text-red-500">
					Failed to load notifications: {$notificationsQuery.error.message}
				</p>
			</div>
		{:else if !notifications.length}
			<div class="p-4 text-center">
				<p class="text-tertiary-200 dark:text-surface-200">No unread notifications</p>
			</div>
		{:else if hasMore}
			<div class="relative" in:fly={{ x: 300, duration: 300 }} out:fly={{ x: -300, duration: 300 }}>
				<div
					class="p-6 transition-all duration-300 border rounded-lg bg-tertiary-500/10 dark:bg-surface-800/30 border-tertiary-500/20 dark:border-surface-600/20"
				>
					<div class="flex items-start gap-4">
						<!-- Avatar -->
						<div class="flex-shrink-0">
							<Avatar me={getAvatarProps(currentNotification.sender.id)} />
						</div>

						<!-- Content -->
						<div class="flex-1 min-w-0">
							<div class="flex items-baseline justify-between gap-2">
								<div class="flex items-center gap-2">
									<p class="text-sm font-medium text-tertiary-100 dark:text-surface-100">
										{currentNotification.sender.name || 'Unknown User'}
									</p>
									<Icon
										icon={getNotificationIcon(currentNotification.type)}
										class="w-4 h-4 {getNotificationIconColor(currentNotification.type)}"
									/>
								</div>
								<span class="text-xs text-tertiary-300 dark:text-surface-300">
									{new Date(currentNotification.created_at).toLocaleString()}
								</span>
							</div>

							<p class="mt-3 text-sm text-tertiary-200 dark:text-surface-200">
								{currentNotification.content}
							</p>

							<div class="mt-4">
								<span class="text-xs font-medium text-tertiary-300 dark:text-surface-300">
									in proposal: {currentNotification.proposal.title}
								</span>
							</div>
						</div>
					</div>

					<!-- Action Buttons -->
					<div class="flex justify-center gap-4 mt-6">
						<button
							class="flex items-center justify-center w-12 h-12 transition-all duration-200 border rounded-full hover:scale-110 bg-warning-500/10 border-warning-500/20 hover:bg-warning-500/20"
							on:click={handleSkip}
						>
							<Icon icon="heroicons:clock" class="w-6 h-6 text-warning-400" />
						</button>

						<button
							class="flex items-center justify-center w-12 h-12 transition-all duration-200 border rounded-full hover:scale-110 bg-success-500/10 border-success-500/20 hover:bg-success-500/20"
							on:click={() => handleMarkAsRead(currentNotification)}
						>
							<Icon icon="heroicons:check" class="w-6 h-6 text-success-400" />
						</button>
					</div>
				</div>
			</div>
		{:else}
			<div class="p-4 text-center" in:fade>
				<p class="text-tertiary-200 dark:text-surface-200">No more notifications</p>
			</div>
		{/if}
	</div>
</section>
