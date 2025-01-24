<!--
HOW THIS COMPONENT WORKS:

1. Overview:
   This is a Discord/Slack-like global chat system that:
   - Shows chat rooms based on proposal states
   - Provides a familiar messaging interface
   - Supports dark/light mode
   - Handles modal display and animations
   - Mocks channel/room structure

2. Props:
   - show: Boolean to control modal visibility
   - onClose: Function to handle modal closing

3. Features:
   - Channel list by proposal states
   - Message input with emoji support
   - User presence indicators
   - Channel categories
   - Responsive layout
-->

<script lang="ts">
	import { fade, scale } from 'svelte/transition';
	import Icon from '@iconify/svelte';
	import { getStateIcon, getStateLabel, type ProposalState } from '$lib/stores/proposalStore';

	export let show = false;
	export let onClose: () => void;

	const PROPOSAL_STATES: ProposalState[] = [
		'idea',
		'offer',
		'pending',
		'in_progress',
		'review',
		'completed',
		'rejected'
	];

	let selectedChannel: ProposalState = 'idea';
	let messageInput = '';

	function handleClose() {
		onClose();
	}

	function selectChannel(channel: ProposalState) {
		selectedChannel = channel;
	}
</script>

{#if show}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-surface-900/80 backdrop-blur-sm"
		transition:fade
		on:click={handleClose}
	>
		<!-- Modal -->
		<div
			class="relative flex w-[95%] h-[95%] bg-surface-900 rounded-xl shadow-2xl overflow-hidden"
			transition:scale
			on:click|stopPropagation
		>
			<!-- Close Button -->
			<button
				on:click={handleClose}
				class="absolute bottom-4 left-1/2 -translate-x-1/2 p-2.5 rounded-lg hover:bg-surface-700/50 text-tertiary-300"
			>
				<Icon icon="mdi:close" class="w-6 h-6" />
			</button>

			<!-- Sidebar -->
			<div class="w-64 border-r border-surface-700/50 bg-surface-800/50">
				<!-- Header -->
				<div class="p-4 border-b border-surface-700/50">
					<h2 class="text-lg font-semibold text-tertiary-100">Visioncreator Chat</h2>
					<p class="text-sm text-tertiary-300">Community Channels</p>
				</div>

				<!-- Channel List -->
				<div class="p-2">
					<div class="mb-4">
						<div class="px-2 py-1 text-xs font-semibold text-tertiary-400 uppercase">
							Proposal Channels
						</div>
						{#each PROPOSAL_STATES as state}
							<button
								class="flex items-center w-full gap-2 px-2 py-1.5 rounded-lg text-sm {selectedChannel ===
								state
									? 'bg-tertiary-500/20 text-tertiary-100'
									: 'hover:bg-surface-700/50 text-tertiary-300'}"
								on:click={() => selectChannel(state)}
							>
								<Icon icon={getStateIcon(state)} class="w-4 h-4" />
								<span># {getStateLabel(state).toLowerCase()}</span>
							</button>
						{/each}
					</div>
				</div>
			</div>

			<!-- Main Chat Area -->
			<div class="flex flex-col flex-grow">
				<!-- Channel Header -->
				<div class="flex items-center h-16 px-4 border-b border-surface-700/50 bg-surface-800/50">
					<div class="flex items-center gap-2">
						<Icon icon={getStateIcon(selectedChannel)} class="w-5 h-5 text-tertiary-300" />
						<h3 class="text-lg font-semibold text-tertiary-100">
							# {getStateLabel(selectedChannel).toLowerCase()}
						</h3>
					</div>
				</div>

				<!-- Messages Area -->
				<div class="flex-grow p-4 overflow-y-auto">
					<div class="text-sm text-tertiary-400 text-center">
						Welcome to #{getStateLabel(selectedChannel).toLowerCase()}
					</div>
				</div>

				<!-- Message Input -->
				<div class="p-4 border-t border-surface-700/50">
					<div class="flex items-center gap-2">
						<input
							type="text"
							bind:value={messageInput}
							placeholder="Message #{getStateLabel(selectedChannel).toLowerCase()}"
							class="flex-grow px-4 py-2 text-sm rounded-lg bg-surface-700/30 text-tertiary-100 placeholder:text-tertiary-400 focus:ring-2 focus:ring-tertiary-500/50 focus:outline-none"
						/>
						<button
							class="p-2 text-tertiary-300 hover:text-tertiary-100 hover:bg-surface-700/50 rounded-lg"
						>
							<Icon icon="mdi:emoticon-outline" class="w-6 h-6" />
						</button>
						<button
							disabled={!messageInput.trim()}
							class="px-4 py-2 font-medium rounded-lg bg-tertiary-500 text-tertiary-50 hover:bg-tertiary-600 disabled:opacity-50 disabled:cursor-not-allowed"
						>
							Send
						</button>
					</div>
				</div>
			</div>
		</div>
	</div>
{/if}
