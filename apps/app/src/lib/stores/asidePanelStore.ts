import { derived } from 'svelte/store';
import { page } from '$app/stores';

export const asidePanels = derived(page, ($page) => {
    const url = $page.url;
    return {
        left: url.searchParams.get('asideLeft'),
        right: url.searchParams.get('asideRight'),
        props: parseAsideProps(url.searchParams.get('asideProps')),
        isOpen: (side: 'left' | 'right') =>
            url.searchParams.get(`aside${side.charAt(0).toUpperCase() + side.slice(1)}`) !== null,
        getComponent: (side: 'left' | 'right') =>
            url.searchParams.get(`aside${side.charAt(0).toUpperCase() + side.slice(1)}`),
    };
});

function parseAsideProps(propsString: string | null): Record<string, string> {
    if (!propsString) return {};
    try {
        return propsString.split(',').reduce((acc, pair) => {
            const [key, value] = pair.split('=');
            acc[key] = value;
            return acc;
        }, {} as Record<string, string>);
    } catch (e) {
        console.error('Failed to parse aside props:', e);
        return {};
    }
} 