import { writable } from 'svelte/store';

type SidePanel = 'left' | 'right' | null;

const createSidePanelStore = () => {
    const { subscribe, set } = writable<SidePanel>(null);

    return {
        subscribe,
        openLeft: () => set('left'),
        openRight: () => set('right'),
        close: () => set(null)
    };
};

export const activeSidePanel = createSidePanelStore(); 