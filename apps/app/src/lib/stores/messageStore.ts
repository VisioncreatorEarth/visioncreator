/*
HOW THIS MESSAGING SYSTEM WORKS:

1. Overview:
   This is a flexible messaging system that can be attached to any object in the platform:
   - Messages can be attached to any entity (proposals, tasks, projects, etc.)
   - Each message thread is identified by a unique contextId
   - Messages are stored with metadata about sender, timestamp, and context
   - Real-time updates are handled through Svelte stores
   - Messages can include rich text, mentions, and reactions (future features)

2. State Management:
   - Messages are stored by contextId in a Map
   - Each context has its own message thread
   - Messages are sorted by timestamp
   - Unread counts and notifications are tracked
   - Message status (sent, delivered, read) is managed

3. Usage:
   - Import the messageStore where needed
   - Create a new thread with createThread()
   - Add messages with sendMessage()
   - Subscribe to messages for a specific context
   - Handle real-time updates automatically
*/

import { writable, derived } from 'svelte/store';
import type { Writable } from 'svelte/store';

export interface Message {
    id: string;
    contextId: string;  // ID of the entity this message belongs to (proposal ID, task ID, etc.)
    contextType: string; // Type of entity (proposal, task, etc.)
    content: string;
    sender: {
        id: string;
        name: string;
        avatar?: string;
    };
    timestamp: Date;
    status: 'sent' | 'delivered' | 'read';
    replyTo?: string; // ID of message being replied to
    metadata?: Record<string, any>; // Additional context-specific data
}

export interface MessageThread {
    contextId: string;
    contextType: string;
    messages: Message[];
    participants: Set<string>;
    lastActivity: Date;
    unreadCount: number;
}

interface MessageStore {
    threads: Map<string, MessageThread>;
}

// Create the main message store
const createMessageStore = () => {
    const { subscribe, set, update }: Writable<MessageStore> = writable({
        threads: new Map()
    });

    return {
        subscribe,

        // Initialize a new message thread
        createThread: (contextId: string, contextType: string) => {
            update(store => {
                if (!store.threads.has(contextId)) {
                    store.threads.set(contextId, {
                        contextId,
                        contextType,
                        messages: [],
                        participants: new Set(),
                        lastActivity: new Date(),
                        unreadCount: 0
                    });
                }
                return store;
            });
        },

        // Send a new message
        sendMessage: (message: Omit<Message, 'id' | 'timestamp' | 'status'>) => {
            update(store => {
                const thread = store.threads.get(message.contextId);
                if (!thread) return store;

                const newMessage: Message = {
                    ...message,
                    id: crypto.randomUUID(),
                    timestamp: new Date(),
                    status: 'sent'
                };

                thread.messages.push(newMessage);
                thread.lastActivity = new Date();
                thread.participants.add(newMessage.sender.id);

                return store;
            });
        },

        // Mark messages as read
        markAsRead: (contextId: string, userId: string) => {
            update(store => {
                const thread = store.threads.get(contextId);
                if (!thread) return store;

                thread.messages.forEach(message => {
                    if (message.sender.id !== userId) {
                        message.status = 'read';
                    }
                });
                thread.unreadCount = 0;

                return store;
            });
        },

        // Get messages for a specific context
        getThreadMessages: (contextId: string) => {
            return derived({ subscribe }, ($store) => {
                const thread = $store.threads.get(contextId);
                return thread?.messages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime()) || [];
            });
        },

        // Get unread count for a specific context
        getUnreadCount: (contextId: string) => {
            return derived({ subscribe }, ($store) => {
                return $store.threads.get(contextId)?.unreadCount || 0;
            });
        },

        // Delete a message
        deleteMessage: (contextId: string, messageId: string) => {
            update(store => {
                const thread = store.threads.get(contextId);
                if (!thread) return store;

                thread.messages = thread.messages.filter(m => m.id !== messageId);
                return store;
            });
        },

        // Edit a message
        editMessage: (contextId: string, messageId: string, newContent: string) => {
            update(store => {
                const thread = store.threads.get(contextId);
                if (!thread) return store;

                const message = thread.messages.find(m => m.id === messageId);
                if (message) {
                    message.content = newContent;
                    message.metadata = {
                        ...message.metadata,
                        edited: true,
                        editedAt: new Date()
                    };
                }
                return store;
            });
        },

        // Clear a thread
        clearThread: (contextId: string) => {
            update(store => {
                store.threads.delete(contextId);
                return store;
            });
        }
    };
};

// Export the message store instance
export const messageStore = createMessageStore(); 