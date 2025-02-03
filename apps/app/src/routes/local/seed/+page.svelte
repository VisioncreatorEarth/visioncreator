<script lang="ts">
	import * as bip39 from 'bip39';
	import { bytesToHex, privateToAddress, hexToBytes } from '@ethereumjs/util';
	import { Buffer } from 'buffer';

	// Add Buffer to window object for browser environment
	if (typeof window !== 'undefined') {
		window.Buffer = Buffer;
	}

	let privateKey = '';
	let seedPhrase = '';
	let error = '';
	let copySuccess = false;

	// Convert hex string to Buffer
	const toBuffer = (hex: string): Uint8Array => {
		const cleanHex = hex.startsWith('0x') ? hex.slice(2) : hex;
		return hexToBytes('0x' + cleanHex);
	};

	async function copySeedPhrase() {
		try {
			await navigator.clipboard.writeText(seedPhrase);
			copySuccess = true;
			setTimeout(() => {
				copySuccess = false;
			}, 2000);
		} catch (err) {
			console.error('Failed to copy:', err);
		}
	}

	function convertPrivateKeyToSeedPhrase() {
		try {
			// Clear previous error
			error = '';

			// Remove '0x' prefix if present
			const cleanPrivateKey = privateKey.replace('0x', '');

			// Validate private key format
			if (!/^[0-9a-fA-F]{64}$/.test(cleanPrivateKey)) {
				throw new Error(
					'Invalid private key format. Please enter a valid 64-character hex string.'
				);
			}

			// Convert private key to Buffer
			const privateKeyBuffer = toBuffer(cleanPrivateKey);

			// Generate entropy from private key and convert to hex string
			const entropy = Buffer.from(privateKeyBuffer.slice(0, 32)).toString('hex');

			// Generate mnemonic from entropy
			seedPhrase = bip39.entropyToMnemonic(entropy);

			// Validate the generated mnemonic
			if (!bip39.validateMnemonic(seedPhrase)) {
				throw new Error('Generated mnemonic validation failed.');
			}

			// Get Ethereum address from private key for verification using newer API
			const address = bytesToHex(privateToAddress(privateKeyBuffer));
			console.log('Corresponding ETH address: 0x' + address);
		} catch (e: unknown) {
			error =
				e instanceof Error ? e.message : 'An error occurred while converting the private key.';
			seedPhrase = '';
		}
	}
</script>

<div class="p-4 space-y-6">
	<div class="p-4 card bg-surface-800">
		<h2 class="mb-4 h2">Private Key to Seed Phrase Converter</h2>

		<div class="space-y-4">
			<div class="form-control">
				<label class="label" for="privateKey">
					<span class="font-medium text-surface-200"
						>Enter Private Key (64 characters, hex format)</span
					>
				</label>
				<input
					type="text"
					id="privateKey"
					bind:value={privateKey}
					class="input bg-surface-700 border-surface-500"
					placeholder="Enter your private key (without 0x prefix)"
				/>
			</div>

			<button
				class="w-full btn variant-filled-primary"
				on:click={convertPrivateKeyToSeedPhrase}
				disabled={!privateKey}
			>
				Convert to Seed Phrase
			</button>

			{#if error}
				<div class="alert variant-filled-error">
					<span>{error}</span>
				</div>
			{/if}

			{#if seedPhrase}
				<div class="p-4 space-y-2 card bg-surface-700">
					<div class="flex items-center justify-between">
						<h3 class="h3 text-surface-200">Your Seed Phrase:</h3>
						<button
							class="btn variant-soft-secondary btn-sm"
							on:click={copySeedPhrase}
							title="Copy seed phrase to clipboard"
						>
							{#if copySuccess}
								✓ Copied!
							{:else}
								📋 Copy
							{/if}
						</button>
					</div>
					<div class="grid grid-cols-6 gap-2">
						{#each seedPhrase.split(' ') as word, i}
							<div class="p-2 text-center rounded bg-surface-600">
								<span class="text-xs text-surface-400">{i + 1}</span>
								<div class="font-mono text-sm">{word}</div>
							</div>
						{/each}
					</div>
					<p class="mt-4 text-xs text-warning-500">
						⚠️ Never share your seed phrase with anyone. Store it securely offline.
					</p>
				</div>
			{/if}
		</div>
	</div>
</div>

<style>
	.form-control {
		@apply flex flex-col gap-2;
	}

	.label {
		@apply text-sm;
	}

	.input {
		@apply p-2 rounded-lg;
	}
</style>
