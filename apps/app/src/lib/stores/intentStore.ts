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
            this.currentState = state || defaultConversationState;
        });
    }

    getMessageContext(): Message[] {
        const currentConversation = this.getCurrentConversation();
        if (!currentConversation) {
            return [];
        }

        return currentConversation.messages.filter(msg =>
            msg.status === 'complete' &&
            msg.agent !== 'system'
        );
    }

    getCurrentConversation(state = this.currentState): AgentConversation | undefined {
        // Ensure state and conversations exist
        if (!state || !state.conversations) {
            const newState = {
                ...defaultConversationState,
                conversations: []
            };
            this.store.set(newState);
            return this.startNewConversation();
        }

        // If no current conversation, start a new one
        if (!state.currentConversationId || !state.conversations.find(c => c.id === state.currentConversationId)) {
            return this.startNewConversation();
        }

        return state.conversations.find(conv => conv.id === state.currentConversationId);
    }

    addMessage(message: Partial<Message> & { agent: AgentType; content: string }) {
        const fullMessage = {
            id: message.id || crypto.randomUUID(),
            timestamp: message.timestamp || new Date().toISOString(),
            status: message.status || 'complete',
            ...message
        };

        // Ensure we have a valid conversation
        let currentConversation = this.getCurrentConversation();
        if (!currentConversation) {
            currentConversation = this.startNewConversation();
        }

        console.log(`[${fullMessage.agent}] ${fullMessage.content}${fullMessage.payload ?
                `\n<payload type="${fullMessage.payload.type}">${JSON.stringify(fullMessage.payload.data)}</payload>` :
                ''
            }`);

        this.store.update(state => {
            if (!state.conversations) {
                state.conversations = [];
            }

            const updatedConversation = {
                ...currentConversation!,
                messages: [...(currentConversation?.messages || []), fullMessage],
                updatedAt: new Date().toISOString()
            };

            return {
                ...state,
                conversations: state.conversations.map(conv =>
                    conv.id === currentConversation!.id ? updatedConversation : conv
                )
            };
        });

        return fullMessage;
    }

    startNewConversation(): AgentConversation {
        const newConversation: AgentConversation = {
            id: crypto.randomUUID(),
            messages: [],
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        this.store.update(state => ({
            currentConversationId: newConversation.id,
            conversations: [...(state?.conversations || []), newConversation]
        }));

        return newConversation;
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

            if (updatedMessage.content) {
                console.log(`[${updatedMessage.agent}] ${updatedMessage.content}${updatedMessage.payload ?
                    `\n<payload type="${updatedMessage.payload.type}">${JSON.stringify(updatedMessage.payload.data)}</payload>` :
                    ''
                    }`);
            }

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

    endCurrentConversation() {
        const currentState = get(conversationStore);

        // Handle empty or undefined state
        if (!currentState || !currentState.conversations) {
            this.store.set(defaultConversationState);
            return;
        }

        const updatedState = {
            ...currentState,
            currentConversationId: null,
            conversations: Array.isArray(currentState.conversations)
                ? currentState.conversations.map(conv =>
                    conv.isActive ? { ...conv, isActive: false } : conv
                )
                : []
        };

        this.store.set(updatedState);
    }

    resetAll() {
        this.store.set(defaultConversationState);
    }

    // Helper method to ensure valid state
    private ensureValidState(state: ConversationState | null): ConversationState {
        if (!state) {
            return defaultConversationState;
        }

        return {
            currentConversationId: state.currentConversationId || null,
            conversations: Array.isArray(state.conversations) ? state.conversations : []
        };
    }
}

export const conversationStore = persist(
    writable<ConversationState>(defaultConversationState),
    storage,
    'conversations'
);

export const conversationManager = new ConversationManager();
