import { UserSchema } from '$lib/composables/UserSchema';

export const view = {
	id: 'FormContainer',
	layout: {
		rows: '1fr auto',
		areas: `
            "main"
        `
	},
	children: [
		{
			id: 'ComposerForm',
			component: 'ComposerForm',
			slot: 'main',
			data: {
				form: {
					fields: [
						{
							name: 'name',
							type: 'text',
							title: 'What is your name?',
							description: 'Please enter your first name'
						}
					],
					validators: UserSchema,
					submitAction: 'updateMe'
				}
			}
		}
	]
};
