import { writable, get } from 'svelte/store';
import { persist, createIndexedDBStorage } from '@macfja/svelte-persistent-store';
import type { AgentType, AgentPayload } from '../types/agent.types';
import { agentLogger } from '$lib/utils/logger';

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

    addMessage(message: Partial<Message> & { agent: AgentType; content: string }) {
        const fullMessage = {
            id: message.id || crypto.randomUUID(),
            timestamp: message.timestamp || new Date().toISOString(),
            status: message.status || 'complete',
            ...message
        };

        agentLogger.log(fullMessage.agent, 'New message', {
            content: fullMessage.content,
            payload: fullMessage.payload
        });

        conversationStore.update(state => {
            const currentConversation = this.getCurrentConversation(state);
            if (!currentConversation) return state;

            const updatedConversation = {
                ...currentConversation,
                messages: [...currentConversation.messages, fullMessage],
                updatedAt: new Date().toISOString()
            };

            return {
                ...state,
                conversations: state.conversations.map(conv =>
                    conv.id === currentConversation.id ? updatedConversation : conv
                )
            };
        });

        return fullMessage;
    }

    updateMessage(messageId: string, updates: Partial<Message>) {
        conversationStore.update(state => {
            const currentConversation = this.getCurrentConversation(state);
            if (!currentConversation) return state;

            const messageIndex = currentConversation.messages.findIndex(m => m.id === messageId);
            if (messageIndex === -1) return state;

            const updatedMessage = {
                ...currentConversation.messages[messageIndex],
                ...updates
            };

            agentLogger.log(updatedMessage.agent, 'Updated message', {
                content: updatedMessage.content,
                payload: updatedMessage.payload,
                status: updatedMessage.status
            });

            const updatedMessages = currentConversation.messages.map(msg =>
                msg.id === messageId ? updatedMessage : msg
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
