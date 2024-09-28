import { client } from '$lib/wundergraph';
import { get } from 'svelte/store';
import { Me } from '$lib/stores';
import { eventBus } from '$lib/composables/eventBus';

interface SubmitFormParams {
	operation: string;
	input: Record<string, unknown>;
}

export async function submitForm({ operation, input }: SubmitFormParams) {
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

		eventBus.emit(operation);

		return {
			success: true,
			message: result.data.message || `${operation} completed successfully`,
			data: result.data
		};
	} catch (error) {
		console.error(`Error in submitForm for operation ${operation}:`, error);
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
