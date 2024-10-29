import { writable, get } from 'svelte/store';
import { persist, createIndexedDBStorage } from '@macfja/svelte-persistent-store';

export type AgentType = 'user' | 'hominio' | 'ali' | 'walter' | 'system';

export interface MessagePayload {
    type: 'action' | 'view' | 'response' | 'error';
    title?: string;
    content: {
        action?: string;
        view?: any;
        [key: string]: any;
    };
}

export interface Message {
    id: string;
    content: string;
    type: 'user' | 'agent';
    agentType?: AgentType;
    role?: string;
    timestamp: string;
    status?: 'pending' | 'complete' | 'error';
    payloads?: MessagePayload[];
}

export const messageStyleConfig = {
    user: {
        bgColor: 'bg-primary-500',
        textColor: 'text-white'
    },
    hominio: {
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

export class ConversationManager {
    constructor() {
        this.initializeStore();
    }

    private initializeStore() {
        conversationStore.set(defaultConversationState);
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

    addMessage(
        content: string,
        type: 'user' | 'agent',
        status: 'pending' | 'complete' | 'error' = 'complete',
        agentType?: AgentType,
        payloads?: MessagePayload[]
    ) {
        const currentState = get(conversationStore);

        if (!currentState?.currentConversationId) {
            this.startNewConversation();
        }

        const message: Message = {
            id: crypto.randomUUID(),
            content,
            type,
            agentType,
            timestamp: new Date().toISOString(),
            status,
            payloads
        };

        if (type === 'agent' && payloads) {
            console.log(`Agent ${agentType} message payloads:`, payloads);
        }

        const updatedState = get(conversationStore);
        const newState = {
            ...updatedState,
            conversations: updatedState.conversations.map(conv =>
                conv.id === updatedState.currentConversationId
                    ? {
                        ...conv,
                        messages: [...conv.messages, message],
                        updatedAt: new Date().toISOString()
                    }
                    : conv
            )
        };

        conversationStore.set(newState);
    }

    getCurrentConversation(): AgentConversation | null {
        const state = get(conversationStore);
        return state?.conversations?.find(
            conv => conv.id === state.currentConversationId
        ) || null;
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
