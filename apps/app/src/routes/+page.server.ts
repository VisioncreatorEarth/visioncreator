// src/routes/+page.server.ts
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url, locals: { safeGetSession } }) => {
	const { session } = await safeGetSession();

	// if the user is already logged in return them to the account page
	if (session) {
		// Preserve the URL parameters when redirecting
		const searchParams = new URLSearchParams(url.search);
		const redirectUrl = searchParams.get('open')
			? `/me?${searchParams.toString()}`
			: '/me';

		throw redirect(303, redirectUrl);
	}

	return { url: url.origin };
};
