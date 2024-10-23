import type { PageLoad } from './$types';
import { browser } from '$app/environment';
import { dynamicView } from '$lib/stores';

export const load: PageLoad = async ({ parent }) => {
    const { supabase } = await parent();

    if (browser) {
        window.addEventListener('updateView', ((event: CustomEvent) => {
            const view = event.detail;
            if (view) {
                dynamicView.update(store => ({ ...store, view }));
            }
        }) as EventListener);
    }

    return {
        supabase
    };
};
