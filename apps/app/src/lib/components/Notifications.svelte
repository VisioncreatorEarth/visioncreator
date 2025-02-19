<!--
HOW THIS COMPONENT WORKS:

1. Overview:
   This component handles the notification system:
   - Displays unread notifications from the database
   - Handles real-time updates via polling
   - Manages read/unread state
   - Shows avatars and message details
   - Provides immediate UI feedback

2. Features:
   - Real-time notification updates (5s polling)
   - Click to mark as read with immediate refetch
   - Avatar integration
   - Responsive design
-->

<script lang="ts">
	import { createQuery, createMutation } from '$lib/wundergraph';
	import Avatar from './Avatar.svelte';

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

				// Immediately refetch notifications
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
</script>

<section
	class="w-full space-y-4 bg-tertiary-500/10 dark:bg-surface-800/50 rounded-lg p-6 border border-tertiary-500/20 dark:border-surface-600/20"
>
	<header>
		<h3 class="text-xl font-semibold text-tertiary-100 dark:text-surface-100">
			Recent Notifications
		</h3>
	</header>

	<!-- Notifications Content -->
	<div class="space-y-4">
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
		{:else if !$notificationsQuery.data?.notifications?.length}
			<div class="p-4 text-center">
				<p class="text-tertiary-200 dark:text-surface-200">No unread notifications</p>
			</div>
		{:else}
			<div class="space-y-2">
				{#each $notificationsQuery.data.notifications as notification}
					<div
						class="p-4 transition-colors border rounded-lg hover:bg-tertiary-500/5 dark:hover:bg-surface-800/50 bg-tertiary-500/10 dark:bg-surface-800/30 border-tertiary-500/20 dark:border-surface-600/20 cursor-pointer"
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
									<span class="text-xs font-medium text-tertiary-300 dark:text-surface-300">
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
</section>
