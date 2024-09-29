import { z } from 'zod';

const EmailSchema = z.object({
	subject: z
		.string()
		.min(3, 'Please share a topic for your message, min 3 characters')
		.max(40, "Let's keep the subject concise, max 40 characters"),
	body: z
		.string()
		.min(10, 'Your message is important to us, min 10 characters')
		.max(
			2000,
			"We appreciate your detailed thoughts, but let's keep it a bit shorter, max 2000 characters"
		)
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
							title: "What's the topic?",
							description: 'Share are short title about the topic you want to talk to us'
						},
						{
							name: 'body',
							type: 'textarea',
							title: 'Your message',
							description: 'Paint us a picture with your words'
						}
					],
					validators: EmailSchema,
					submitAction: 'sendMail'
				}
			}
		}
	]
};
