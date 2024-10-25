import { writable } from 'svelte/store';
import crypto from 'crypto';

// New interfaces and types for the agent system
export type AgentType = 'hominio' | 'actionAgent' | 'viewAgent' | 'componentAgent' | 'user';
export type ToolResultType = 'view' | 'action' | 'component' | 'error';
export type IntentStatus = 'active' | 'completed' | 'error';

export interface Message {
    role: AgentType;
    content: string;
    timestamp: number;
    toolResult?: {
        type: ToolResultType;
        data: any;
        tool_use_id?: string;
    };
}

export interface Intent {
    id: string;
    status: IntentStatus;
    messages: Message[];
    sessionId: string;
    created: number;
    updated: number;
}

// Stores
export const currentIntent = writable<Intent | null>(null);
export const intentHistory = writable<Intent[]>([]);
export const isPressed = writable<boolean>(false);

// Intent manager
export const intentManager = {
    create: (sessionId: string) => {
        currentIntent.set({
            id: crypto.randomUUID(),
            status: 'active',
            messages: [],
            sessionId,
            created: Date.now(),
            updated: Date.now()
        });
    },

    addMessage: (message: Message) => {
        currentIntent.update(intent =>
            intent ? { ...intent, messages: [...intent.messages, message], updated: Date.now() } : null
        );
    },

    complete: (status: IntentStatus = 'completed') => {
        currentIntent.update(intent => {
            if (!intent) return null;
            const completedIntent = { ...intent, status, updated: Date.now() };
            intentHistory.update(history => [...history, completedIntent]);
            return null;
        });
    },

    getCurrentMessages: () => {
        let messages: Message[] = [];
        currentIntent.subscribe(intent => {
            if (intent) messages = intent.messages;
        })();
        return messages;
    },

    reset: () => {
        currentIntent.set(null);
        // Optionally store in history before reset
        currentIntent.subscribe(intent => {
            if (intent) {
                intentHistory.update(history => [...history, { ...intent, status: 'completed' }]);
            }
        })();
    }
};

// ... (existing store code remains the same)
