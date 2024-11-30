import type { PageLoad } from './$types';
import { browser } from '$app/environment';
import { dynamicView, futureMe } from '$lib/stores';

export const ssr = false; // Disable SSR for this route to prevent redirect issues

export const load: PageLoad = async ({ parent }) => {
    const { supabase } = await parent();

    if (browser) {

        // Get initial auth data
        const { data: { user } } = await supabase.auth.getUser();

        // If we have user metadata, ensure futureMe is in sync
        if (user?.user_metadata) {
            futureMe.update(current => ({
                ...current,
                name: user.user_metadata.name || current.name,
                visionid: user.user_metadata.visionid || current.visionid
            }));
        }
    }

    return { supabase };
};
