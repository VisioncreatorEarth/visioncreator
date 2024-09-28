import { z } from 'zod';

const EmailSchema = z.object({
	subject: z
		.string()
		.min(1, 'Subject is required')
		.max(40, 'Subject must not exceed 40 characters'),
	body: z
		.string()
		.min(1, 'Message body is required')
		.max(10000, 'Message body must not exceed 10,000 characters')
});

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
