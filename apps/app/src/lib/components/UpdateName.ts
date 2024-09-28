import { EmailSchema } from '$lib/composables/EmailSchema';

export const view = {
	id: 'SendMailContainer',
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
							name: 'subject',
							type: 'text',
							title: 'Subject',
							description: 'Enter the email subject (max 40 characters)'
						},
						{
							name: 'body',
							type: 'textarea',
							title: 'Message',
							description: 'Enter your message (max 10,000 characters)'
						}
					],
					validators: EmailSchema,
					submitAction: 'sendMail'
				}
			}
		}
	]
};
