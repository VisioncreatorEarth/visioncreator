import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals: { supabase } }) => {
	try {
		const formData = await request.formData();
		const email = formData.get('email') as string;
		const validEmail = /^[\w-.+]+@([\w-]+\.)+[\w-]{2,8}$/.test(email);

		if (!validEmail) {
			return json(
				{
					success: false,
					errors: { email: 'Please enter a valid email address' },
					email
				},
				{ status: 400 }
			);
		}

		const { error } = await supabase.auth.signInWithOtp({ email });

		if (error) {
			console.error('Supabase OTP error:', error);
			return json(
				{
					success: false,
					email,
					message: error.message || 'There was an issue. Please try again.'
				},
				{ status: 400 }
			);
		}

		return json({
			success: true,
			message: 'Please check your email for a magic link to log into the website.'
		});
	} catch (error) {
		console.error('Server error:', error);
		return json(
			{
				success: false,
				message: 'An unexpected error occurred. Please try again.'
			},
			{ status: 500 }
		);
	}
};
