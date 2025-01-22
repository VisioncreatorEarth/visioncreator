<script lang="ts">
	import { writable } from 'svelte/store';
	import type { Writable } from 'svelte/store';

	interface Proposal {
		id: string;
		title: string;
		author: string;
		requestedAmount: number;
		dreamOutcome: string;
		votes: number;
		description: string;
	}

	const userVotesLeft: Writable<number> = writable(10);
	const proposals: Writable<Proposal[]> = writable([
		{
			id: '1',
			title: 'AI-Powered Market Research Tool',
			author: 'Sarah Chen',
			requestedAmount: 5000,
			dreamOutcome: 'Reduce market research time by 80% for all community ventures',
			votes: 24,
			description:
				'Building a specialized AI tool that automates competitor analysis and market sizing for our ventures.'
		},
		{
			id: '2',
			title: 'Community Growth Framework',
			author: 'Marcus Wright',
			requestedAmount: 3000,
			dreamOutcome: 'Triple our community engagement metrics within 6 months',
			votes: 18,
			description:
				'Implementing proven growth strategies to exponentially increase our community reach and engagement.'
		},
		{
			id: '3',
			title: 'Venture Launch Playbook',
			author: 'Elena Rodriguez',
			requestedAmount: 4500,
			dreamOutcome: 'Reduce venture launch time from 6 months to 6 weeks',
			votes: 31,
			description:
				'Creating a comprehensive playbook for rapidly launching and scaling community ventures.'
		}
	]);

	let showNewProposalModal = false;
	let newProposal: Partial<Proposal> = {};

	function vote(proposalId: string): void {
		if ($userVotesLeft > 0) {
			$userVotesLeft--;
			$proposals = $proposals.map((p) => (p.id === proposalId ? { ...p, votes: p.votes + 1 } : p));
		}
	}

	function createProposal(): void {
		showNewProposalModal = true;
		newProposal = {
			id: Math.random().toString(36).substr(2, 9),
			votes: 0
		};
	}

	function submitProposal(): void {
		if (newProposal.title && newProposal.requestedAmount) {
			$proposals = [...$proposals, newProposal as Proposal];
			showNewProposalModal = false;
			newProposal = {};
		}
	}
</script>

<div class="container p-6 mx-auto space-y-8">
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-2xl font-bold text-tertiary-100">Community Proposals</h1>
			<p class="text-tertiary-200">Votes remaining: {$userVotesLeft}</p>
		</div>
		<button
			on:click={createProposal}
			class="btn bg-gradient-to-br variant-gradient-secondary-primary"
		>
			Create Proposal
		</button>
	</div>

	<div class="grid gap-6">
		{#each $proposals as proposal}
			<div class="p-6 border card bg-surface-800/50 border-surface-700/50 rounded-xl">
				<div class="flex items-start justify-between">
					<div>
						<h3 class="text-xl font-semibold text-tertiary-100">{proposal.title}</h3>
						<p class="text-sm text-tertiary-300">by {proposal.author}</p>
					</div>
					<div class="text-right">
						<p class="text-xl font-bold text-tertiary-100">{proposal.requestedAmount}€</p>
						<p class="text-sm text-tertiary-300">requested</p>
					</div>
				</div>

				<div class="mt-4 space-y-4">
					<div>
						<h4 class="font-semibold text-tertiary-200">Dream Outcome</h4>
						<p class="text-sm text-tertiary-300">{proposal.dreamOutcome}</p>
					</div>
					<div>
						<h4 class="font-semibold text-tertiary-200">Description</h4>
						<p class="text-sm text-tertiary-300">{proposal.description}</p>
					</div>
				</div>

				<div class="flex justify-between items-center mt-4">
					<p class="text-xl font-bold text-tertiary-100">{proposal.votes} votes</p>
					<button
						on:click={() => vote(proposal.id)}
						disabled={$userVotesLeft === 0}
						class="btn variant-ghost-tertiary"
					>
						Vote
					</button>
				</div>
			</div>
		{/each}
	</div>
</div>

{#if showNewProposalModal}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
		<div class="w-full max-w-2xl p-6 card bg-surface-800">
			<h2 class="mb-4 text-xl font-bold text-tertiary-100">Create New Proposal</h2>
			<div class="grid gap-4">
				<div>
					<label class="label">Title</label>
					<input
						type="text"
						bind:value={newProposal.title}
						class="input bg-surface-900"
						placeholder="Proposal title"
					/>
				</div>
				<div>
					<label class="label">Requested Amount (€)</label>
					<input
						type="number"
						bind:value={newProposal.requestedAmount}
						class="input bg-surface-900"
						placeholder="Amount in euros"
					/>
				</div>
				<div>
					<label class="label">Dream Outcome</label>
					<textarea
						bind:value={newProposal.dreamOutcome}
						class="textarea bg-surface-900"
						placeholder="What's the big dream outcome?"
					/>
				</div>
				<div>
					<label class="label">Description</label>
					<textarea
						bind:value={newProposal.description}
						class="textarea bg-surface-900"
						placeholder="Describe your proposal in detail"
					/>
				</div>
			</div>
			<div class="flex justify-end gap-4 mt-6">
				<button on:click={() => (showNewProposalModal = false)} class="btn variant-ghost-surface">
					Cancel
				</button>
				<button
					on:click={submitProposal}
					class="btn bg-gradient-to-br variant-gradient-secondary-primary"
				>
					Submit Proposal
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.card {
		transition: transform 0.2s;
	}
	.card:hover {
		transform: translateY(-2px);
	}
</style>
