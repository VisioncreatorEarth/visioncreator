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
	console.log(`Submitting form for operation: ${operation}`, input);
	try {
		let fullInput = { ...input };

		// Get the current user ID from the Me store only if 'id' is not provided in the input
		if (!('id' in fullInput)) {
			const currentUser = get(Me);
			console.log('Current user:', currentUser);
			if (typeof currentUser === 'object' && currentUser && 'id' in currentUser) {
				const userId = currentUser.id;
				if (userId) {
					fullInput.id = userId;
					console.log('Added user ID to input:', userId);
				}
			}
		}

		console.log('Full input before mutation:', fullInput);

		const result = await client.mutate({
			operationName: operation,
			input: fullInput
		});

		console.log('Mutation result:', result);

		if (!result.data || !result.data.success) {
			throw new Error(result.data?.message || `An error occurred during ${operation}`);
		}

		// Add Walter's response to conversation
		console.log('Adding Walter response with payloads:', {
			message: result.data.message,
			viewPayload: {
				type: 'view',
				content: { view }
			},
			responsePayload: {
				type: 'response',
				content: result.data
			}
		});

		conversationManager.addMessage(
			result.data.message || `${operation} completed successfully`,
			'agent',
			'complete',
			'walter',
			[
				{
					type: 'view',
					content: view // Simplified - remove the extra nesting
				},
				{
					type: 'response',
					content: result.data // The API response data
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
		console.error(`Error in submitForm for operation ${operation}:`, error);

		// Add error message from Walter
		conversationManager.addMessage(
			error instanceof Error
				? error.message
				: `An error occurred during ${operation}`,
			'agent',
			'error',
			'walter'  // Ensure errors also come from Walter
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
