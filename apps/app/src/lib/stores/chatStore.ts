/*
HOW THIS STORE WORKS:

1. Overview:
   This store manages the global chat modal state:
   - Controls visibility of the chat modal
   - Provides toggle and close functions
   - Uses Svelte's writable store

2. Usage:
   - Import { chatStore, toggleChat, closeChat } from this file
   - Use $chatStore to access the current state
   - Call toggleChat() to toggle visibility
   - Call closeChat() to explicitly close the modal
*/

import { writable } from 'svelte/store';

export const chatStore = writable<boolean>(false);

export function toggleChat(): void {
    chatStore.update((state) => !state);
}

export function closeChat(): void {
    chatStore.set(false);
} 