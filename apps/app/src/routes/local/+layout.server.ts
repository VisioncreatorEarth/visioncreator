import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { dev } from '$app/environment';

export const load: LayoutServerLoad = async ({ locals: { safeGetSession }, url }) => {
    if (!dev) {
        throw redirect(307, '/');
    }

    // Only check for auth if NOT accessing the roadmap_animated route
    if (!url.pathname.includes('/roadmap_animated')) {
        const { session } = await safeGetSession();
        if (!session) {
            throw redirect(303, '/');
        }
        return { session };
    }
    
    // For roadmap_animated, return an empty session to bypass auth check
    return { session: {} };
};