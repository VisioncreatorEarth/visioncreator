import { client } from '$lib/wundergraph';
import { get } from 'svelte/store';
import { Me } from '$lib/stores';
import { eventBus } from '$lib/composables/eventBus';
import { conversationManager } from '$lib/stores/intentStore';

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

		if (!result.data || !result.data.success) {
			throw new Error(result.data?.message || `An error occurred during ${operation}`);
		}

		conversationManager.addMessage(
			result.data.message || `${operation} completed successfully`,
			'agent',
			'complete',
			'walter',
			[
				{
					type: 'response',
					content: result.data
				}
			]
		);

		// Emit original event
		eventBus.emit(operation);

		return {
			success: true,
			message: result.data.message || `${operation} completed successfully`,
			data: result.data
		};
	} catch (error) {
		console.error(`[Error] Operation ${operation} failed:`, error);

		conversationManager.addMessage(
			error instanceof Error
				? error.message
				: `An error occurred during ${operation}`,
			'agent',
			'error',
			'walter'
		);

		if (error instanceof Error) {
			return {
				success: false,
				message: error.message || `An error occurred during ${operation}`,
				error: error
			};
		}
		return {
			success: false,
			message: `An unknown error occurred during ${operation}`,
			error: new Error('Unknown error')
		};
	}
}
