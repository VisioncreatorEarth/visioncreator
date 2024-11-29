import { client } from '$lib/wundergraph';
import { get } from 'svelte/store';
import { Me } from '$lib/stores';
import { eventBus } from '$lib/composables/eventBus';

interface SubmitFormParams {
	operation: string;
	input: Record<string, unknown>;
	view?: unknown;
}

export async function submitForm({ operation, input, view = null }: SubmitFormParams) {
	try {
		let fullInput = { ...input };

		// Get the current user ID from the Me store only if 'id' is not provided in the input
		if (!('id' in fullInput)) {
			const currentUser = get(Me);
			if (typeof currentUser === 'object' && currentUser && 'id' in currentUser) {
				const userId = currentUser.id;
				if (userId) {
					fullInput.id = userId;
				}
			}
		}

		const result = await client.mutate({
			operationName: operation,
			input: fullInput
		});

		// Check for proper success conditions
		if (!result.error && result.data) {
			// Emit event
			eventBus.emit(operation);

			return {
				success: true,
				message: result.data.message || `Operation ${operation} completed successfully!`,
				data: result.data
			};
		} else {
			throw new Error(result.error?.message || `Operation ${operation} failed`);
		}
	} catch (error) {
		console.error(`[Error] Operation ${operation} failed:`, error);

		return {
			success: false,
			message: error instanceof Error ? error.message : `An error occurred during ${operation}`,
			error: error instanceof Error ? error : new Error(`Unknown error during ${operation}`)
		};
	}
}
