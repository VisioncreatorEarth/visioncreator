import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { dev } from '$app/environment';

export const load: LayoutServerLoad = async ({ locals: { safeGetSession } }) => {
    if (!dev) {
        throw redirect(307, '/');
    }

    const { session } = await safeGetSession();
    if (!session) {
        throw redirect(303, '/');
    }

    return { session };
};