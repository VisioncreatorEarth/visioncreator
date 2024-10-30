import { writable, get } from 'svelte/store';
import { persist, createIndexedDBStorage } from '@macfja/svelte-persistent-store';

export type AgentType = 'user' | 'hominio' | 'ali' | 'walter' | 'vroni' | 'system' | 'bert';

export interface Message {
    id?: string;
    agent: AgentType;
    content: string;
    timestamp: string;
    status?: 'pending' | 'complete' | 'error';
    payload?: {
        view?: {
            id: string;
            layout?: {
                areas: string;
                rows?: string;
                columns?: string;
                gap?: string;
            };
            children: Array<{
                id: string;
                component: string;
                slot?: string;
                data: any;
            }>;
        };
        action?: string;
        formId?: string;
        type?: 'response' | 'view';
        content?: any;
    };
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
    const logMessage = `[${component}] ${message}`;
    if (data) {
        console.log(logMessage, data);
    } else {
        console.log(logMessage);
    }
}

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
        agent: AgentType,
        status: 'pending' | 'complete' | 'error' = 'complete',
        payload?: { view?: any; action?: string; }
    ) {
        const currentState = get(conversationStore);

        if (!currentState?.currentConversationId) {
            this.startNewConversation();
        }

        const message: Message = {
            id: crypto.randomUUID(),
            agent,
            content,
            timestamp: new Date().toISOString(),
            status,
            payload
        };

        logDebug(agent, `message: "${content}"${payload ? `, payload: ${JSON.stringify(payload)}` : ''}`);

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
