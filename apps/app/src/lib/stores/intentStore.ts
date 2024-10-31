import { writable, get } from 'svelte/store';
import { persist, createIndexedDBStorage } from '@macfja/svelte-persistent-store';
import type { AgentType, AgentPayload } from '../types/agent.types';

export interface Message {
    id: string;
    agent: AgentType;
    content: string;
    timestamp: string;
    status: 'pending' | 'complete' | 'error';
    payload?: AgentPayload;
    context?: MessageContext;
}

export const messageStyleConfig = {
    user: {
        bgColor: 'bg-primary-500',
        textColor: 'text-white'
    },
    bert: {
        bgColor: 'bg-surface-700',
        textColor: 'text-tertiary-200'
    },
    hominio: {
        bgColor: 'bg-surface-700',
        textColor: 'text-tertiary-200'
    },
    lena: {
        bgColor: 'bg-surface-700',
        textColor: 'text-tertiary-200'
    },
    ali: {
        bgColor: 'bg-surface-700',
        textColor: 'text-tertiary-200'
    },
    walter: {
        bgColor: 'bg-surface-700',
        textColor: 'text-tertiary-200'
    },
    system: {
        bgColor: 'bg-surface-800',
        textColor: 'text-tertiary-300'
    }
} as const;

export interface AgentConversation {
    id: string;
    messages: Message[];
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface ConversationState {
    currentConversationId: string | null;
    conversations: AgentConversation[];
}

const defaultConversationState: ConversationState = {
    currentConversationId: null,
    conversations: []
};

const storage = createIndexedDBStorage('intentDB', 'conversations');

// Add a debug logging function
export function logDebug(component: string, message: string, data?: any) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}][${component}] ${message}`;
    if (data) {
        console.log(logMessage, data);
    } else {
        console.log(logMessage);
    }
}

export interface MessageContext {
    previousMessages: Message[];
    currentView?: string;
    activeDrafts?: any;
    userPreferences?: any;
}

export class ConversationManager {
    private store = conversationStore;
    private currentState: ConversationState;

    constructor() {
        this.store.subscribe(state => {
            this.currentState = state;
        });
    }

    getMessageContext() {
        const currentConversation = this.getCurrentConversation();
        return {
            previousMessages: currentConversation?.messages || [],
            currentView: currentConversation?.currentView,
            activeDrafts: currentConversation?.activeDrafts,
            userPreferences: currentConversation?.userPreferences
        };
    }

    getCurrentConversation() {
        if (!this.currentState.currentConversationId) {
            // Create new conversation if none exists
            const newConversation = {
                id: crypto.randomUUID(),
                messages: [],
                isActive: true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            this.store.update(state => ({
                ...state,
                currentConversationId: newConversation.id,
                conversations: [...state.conversations, newConversation]
            }));

            return newConversation;
        }

        return this.currentState.conversations.find(
            conv => conv.id === this.currentState.currentConversationId
        );
    }

    addMessage(messageData: Partial<Message>) {
        const message: Message = {
            id: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
            ...messageData
        };

        this.store.update(state => {
            const currentConversation = this.getCurrentConversation();
            if (!currentConversation) return state;

            const updatedConversation = {
                ...currentConversation,
                messages: [...currentConversation.messages, message],
                updatedAt: new Date().toISOString()
            };

            return {
                ...state,
                conversations: state.conversations.map(conv =>
                    conv.id === currentConversation.id ? updatedConversation : conv
                )
            };
        });

        return message;
    }

    updateMessage(messageId: string, updates: Partial<Message>) {
        this.store.update(state => {
            const currentConversation = this.getCurrentConversation();
            if (!currentConversation) return state;

            const updatedMessages = currentConversation.messages.map(msg =>
                msg.id === messageId ? { ...msg, ...updates } : msg
            );

            const updatedConversation = {
                ...currentConversation,
                messages: updatedMessages,
                updatedAt: new Date().toISOString()
            };

            return {
                ...state,
                conversations: state.conversations.map(conv =>
                    conv.id === currentConversation.id ? updatedConversation : conv
                )
            };
        });
    }

    startNewConversation() {
        const newConversation: AgentConversation = {
            id: crypto.randomUUID(),
            messages: [],
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        const currentState = get(conversationStore) || defaultConversationState;
        const updatedState = {
            currentConversationId: newConversation.id,
            conversations: [...(currentState.conversations || []), newConversation]
        };

        conversationStore.set(updatedState);
        return newConversation.id;
    }

    endCurrentConversation() {
        const currentState = get(conversationStore);
        const updatedState = {
            ...currentState,
            currentConversationId: null,
            conversations: currentState.conversations.map(conv =>
                conv.isActive ? { ...conv, isActive: false } : conv
            )
        };
        conversationStore.set(updatedState);
    }

    resetAll() {
        conversationStore.set(defaultConversationState);
    }
}

export const conversationStore = persist(
    writable<ConversationState>(defaultConversationState),
    storage,
    'conversations'
);

export const conversationManager = new ConversationManager();
