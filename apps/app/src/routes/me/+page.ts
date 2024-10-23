import type { PageLoad } from './$types';
import { browser } from '$app/environment';
import { dynamicView, futureMe } from '$lib/stores';

export const load: PageLoad = async ({ parent }) => {
    const { supabase } = await parent();

    if (browser) {
        // Handle view updates
        window.addEventListener('updateView', ((event: CustomEvent) => {
            const view = event.detail;
            if (view) {
                dynamicView.update(store => ({ ...store, view }));
            }
        }) as EventListener);

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

    return {
        supabase
    };
};
