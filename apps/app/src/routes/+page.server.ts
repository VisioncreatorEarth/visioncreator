// src/routes/+page.server.ts
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url, locals: { safeGetSession } }) => {
	const { session } = await safeGetSession();

	// Only redirect if user is logged in AND we're exactly at the root path
	if (session && url.pathname === '/') {
		const searchParams = new URLSearchParams(url.search);
		const redirectUrl = searchParams.get('open')
			? `/me?${searchParams.toString()}`
			: '/me';

		throw redirect(303, redirectUrl);
	}

	return { url: url.origin };
};
