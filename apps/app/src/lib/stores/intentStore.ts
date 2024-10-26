import { writable, get } from 'svelte/store';
import { persist, createIndexedDBStorage } from '@macfja/svelte-persistent-store';

// Simplified MessagePayload interface focused on actions
export interface MessagePayload {
    type: 'action';
    title: string;
    content: {
        action: string;
        view: any;
    };
}

export interface Message {
    id: string;
    content: string;
    type: 'user' | 'agent';
    agentType?: 'hominio' | 'ali';
    timestamp: string;
    status?: 'pending' | 'complete' | 'error';
    payloads?: MessagePayload[];
}

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
            id: 'HominioForm',
            component: 'HominioForm',
            slot: 'main',
            data: {
                form: {
                    fields: [
                        {
                            name: 'name',
                            type: 'text',
                            title: 'What is your name?',
                            description: 'Please enter your first name',
                            value: ''
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

// Debug logging helper
const debug = (message: string, data?: any) => {
    console.log(`[IntentStore] ${message}`, data || '');
};

// Conversation Manager Class
class ConversationManager {
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

    startNewConversation() {
        const currentState = get(conversationStore);
        const newId = crypto.randomUUID();

        // Deactivate any active conversations
        const updatedConversations = currentState.conversations.map(conv => ({
            ...conv,
            isActive: false
        }));

        // Create new conversation
        const newConversation: AgentConversation = {
            id: newId,
            messages: [],
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        const updatedState = {
            currentConversationId: newId,
            conversations: [...updatedConversations, newConversation]
        };

        debug('Starting new conversation', updatedState);
        conversationStore.set(updatedState);
        return newId;
    }

    addMessage(
        content: string,
        type: 'user' | 'agent',
        status: 'pending' | 'complete' | 'error' = 'complete',
        agentType?: 'hominio' | 'ali',
        payloads?: MessagePayload[]
    ) {
        const currentState = get(conversationStore);

        // Start new conversation if none exists
        if (!currentState.currentConversationId) {
            const newId = this.startNewConversation();
            const newState = get(conversationStore);

            const newMessage: Message = {
                id: crypto.randomUUID(),
                content,
                type,
                timestamp: new Date().toISOString(),
                status,
                agentType,
                payloads
            };

            // Add message to new conversation
            const updatedState = {
                ...newState,
                conversations: newState.conversations.map(conv =>
                    conv.id === newId
                        ? {
                            ...conv,
                            messages: [...conv.messages, newMessage],
                            updatedAt: new Date().toISOString()
                        }
                        : conv
                )
            };

            debug('Adding message to new conversation', updatedState);
            conversationStore.set(updatedState);

            // If user message, generate agent responses
            if (type === 'user') {
                const hominioResponse = this.generateHominioResponse(content);
                const actionResponse = this.generateActionAgentResponse(content);

                setTimeout(() => {
                    this.addMessage(
                        hominioResponse.content,
                        'agent',
                        'complete',
                        'hominio'
                    );
                    setTimeout(() => {
                        this.addMessage(
                            actionResponse.content,
                            'agent',
                            'complete',
                            'ali',
                            actionResponse.payloads
                        );
                    }, 1000);
                }, 1000);
            }
            return;
        }

        // Add message to existing conversation
        const newMessage: Message = {
            id: crypto.randomUUID(),
            content,
            type,
            timestamp: new Date().toISOString(),
            status,
            agentType,
            payloads
        };

        const updatedState = {
            ...currentState,
            conversations: currentState.conversations.map(conv =>
                conv.id === currentState.currentConversationId
                    ? {
                        ...conv,
                        messages: [...conv.messages, newMessage],
                        updatedAt: new Date().toISOString()
                    }
                    : conv
            )
        };

        debug('Adding message to existing conversation', updatedState);
        conversationStore.set(updatedState);

        // Generate agent responses for user messages
        if (type === 'user') {
            const hominioResponse = this.generateHominioResponse(content);
            const actionResponse = this.generateActionAgentResponse(content);

            setTimeout(() => {
                this.addMessage(
                    hominioResponse.content,
                    'agent',
                    'complete',
                    'hominio'
                );
                setTimeout(() => {
                    this.addMessage(
                        actionResponse.content,
                        'agent',
                        'complete',
                        'ali',
                        actionResponse.payloads
                    );
                }, 1000);
            }, 1000);
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
        debug('Ending current conversation', updatedState);
        conversationStore.set(updatedState);
    }

    resetAll() {
        debug('Resetting all conversations');
        conversationStore.set(defaultConversationState);
    }
}

// Export singleton instance
export const conversationManager = new ConversationManager();

// Export types
export type { Message, AgentConversation, ConversationState };
