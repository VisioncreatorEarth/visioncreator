import { writable, get } from 'svelte/store';
import { persist, createIndexedDBStorage } from '@macfja/svelte-persistent-store';

// Merge agent types and message styling from agentStore
export type AgentType = 'user' | 'hominio' | 'ali' | 'walter' | 'system';

// Update MessagePayload interface to include tool results
export interface MessagePayload {
    type: 'action' | 'view' | 'response' | 'error';
    title?: string;
    content: {
        action?: string;
        view?: any;
        [key: string]: any;
    };
}

// Update Message interface to include role
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

// Hardcoded view config for name update action
const updateNameView = {
    id: 'UpdateNameContainer',
    layout: {
        rows: '1fr auto',
        areas: `"main"`
    },
    children: [
        {
            id: 'UpdateNameForm',
            component: 'HominioForm', // Change back to HominioForm
            slot: 'main',
            data: {
                form: {
                    fields: [
                        {
                            name: 'name',
                            type: 'text',
                            title: 'Name',
                            value: 'Samuel' // Hardcoded value
                        }
                    ],
                    validators: 'updateName',
                    submitAction: 'updateMe'
                }
            }
        }
    ]
};

// Default state
const defaultConversationState: ConversationState = {
    currentConversationId: null,
    conversations: []
};

// Create IndexedDB storage
const storage = createIndexedDBStorage('intentDB', 'conversations');

// Create persistent store
export const conversationStore = persist(
    writable<ConversationState>(defaultConversationState),
    storage,
    'conversations'
);

// Conversation Manager Class
export class ConversationManager {
    private logMessage(agentType: AgentType, content: string, payloads?: MessagePayload[]) {
        if (agentType && agentType !== 'user') {
            console.log(`[${agentType}] ${content}`);

            // Log payloads if they exist
            if (payloads?.length) {
                payloads.forEach(payload => {
                    console.log(`[${agentType}:payload] type: ${payload.type}`, {
                        title: payload.title,
                        content: payload.content
                    });
                });
            }
        }
    }

    // Simplified agent responses
    private generateActionAgentResponse(userMessage: string): Message {
        return {
            id: crypto.randomUUID(),
            content: "I'll help you update your name. Here's a form to do that:",
            type: 'agent',
            agentType: 'ali',
            timestamp: new Date().toISOString(),
            status: 'complete',
            payloads: [{
                type: 'action',
                title: 'Update Name Form',
                content: {
                    action: 'updateName',
                    view: updateNameView
                }
            }]
        };
    }

    private generateHominioResponse(userMessage: string): Message {
        return {
            id: crypto.randomUUID(),
            content: "I understand you want to update your name. I'll delegate this to Ali, our Action Agent.",
            type: 'agent',
            agentType: 'hominio',
            timestamp: new Date().toISOString(),
            status: 'complete'
        };
    }

    private generateWalterResponse(message: string, payloads?: MessagePayload[]): Message {
        return {
            id: crypto.randomUUID(),
            content: message,
            type: 'agent',
            agentType: 'walter',
            timestamp: new Date().toISOString(),
            status: 'complete',
            payloads
        };
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
        // Only log agent messages with their payloads
        if (type === 'agent' && agentType) {
            this.logMessage(agentType, content, payloads);
        }

        const currentState = get(conversationStore);

        // If no conversation exists, create one
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

        // Get fresh state after possible initialization
        const updatedState = get(conversationStore);

        // Add message to current conversation
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

        // If this is a user message, automatically add agent responses
        if (type === 'user' && status === 'complete') {
            // Add Hominio response
            const hominioResponse = this.generateHominioResponse(content);
            this.addMessage(
                hominioResponse.content,
                'agent',
                'complete',
                'hominio'
            );

            // Add Action Agent response
            const actionResponse = this.generateActionAgentResponse(content);
            this.addMessage(
                actionResponse.content,
                'agent',
                'complete',
                'ali',
                actionResponse.payloads
            );
        }
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

// Export singleton instance
export const conversationManager = new ConversationManager();

// Export types
export type { Message, AgentConversation, ConversationState };
