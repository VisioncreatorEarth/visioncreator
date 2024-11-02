import { writable, get } from 'svelte/store';
import type { Writable } from 'svelte/store';

// New interfaces and types for the agent system
export type AgentType =
    | 'user'
    | 'hominio'
    | 'actionAgent'
    | 'viewAgent'
    | 'componentAgent'
    | 'system';

export type ToolResultType = 'view' | 'action' | 'component' | 'error';
export type IntentStatus = 'active' | 'completed' | 'error';

export interface Message {
    role: string;
    content: string;
    timestamp: number;
}

export interface Intent {
    id: string;
    messages: Message[];
    status: 'active' | 'complete' | 'error';
}

// Stores
const currentIntent: Writable<Intent | null> = writable(null);
const currentMessages: Writable<Message[]> = writable([]);

export const intentManager = {
    create(id: string) {
        currentIntent.set({
            id,
            messages: [],
            status: 'active'
        });
        currentMessages.set([]);
    },

    getCurrentMessages(): Message[] {
        return get(currentMessages);
    },

    addMessage(message: Message) {
        currentMessages.update(messages => [...messages, message]);
        currentIntent.update(intent => {
            if (intent) {
                return {
                    ...intent,
                    messages: [...intent.messages, message]
                };
            }
            return intent;
        });
    },

    complete(status: 'complete' | 'error' = 'complete') {
        currentIntent.update(intent => {
            if (intent) {
                return {
                    ...intent,
                    status
                };
            }
            return intent;
        });
    },

    resetContext() {
        currentIntent.set(null);
        currentMessages.set([]);
    }
};

export { currentIntent };

// Add message styling configuration
export const messageStyleConfig = {
    user: {
        bgColor: 'bg-primary-500',
        textColor: 'text-white'
    },
    hominio: {
        bgColor: 'bg-surface-700',
        textColor: 'text-tertiary-200'
    },
    actionAgent: {
        bgColor: 'bg-surface-700',
        textColor: 'text-tertiary-200'
    },
    viewAgent: {
        bgColor: 'bg-surface-700',
        textColor: 'text-tertiary-200'
    },
    componentAgent: {
        bgColor: 'bg-surface-700',
        textColor: 'text-tertiary-200'
    },
    system: {
        bgColor: 'bg-surface-800',
        textColor: 'text-tertiary-300'
    }
} as const;
