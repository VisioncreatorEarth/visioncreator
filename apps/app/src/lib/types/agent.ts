// Database Schema Types

export interface AgentCapability {
    id: string;
    agent_id: string;         // References Agent.id
    name: string;             // e.g., 'shopping_list.create'
    description: string;
    created_at: Date;
    updated_at: Date;
}

export interface Agent {
    id: string;
    name: string;
    version: string;
    system_prompt: string;
    status: 'idle' | 'working' | 'error';
    last_active: Date;
    context: Record<string, any>;
    created_at: Date;
    updated_at: Date;
    capabilities?: AgentCapability[];
}

// Runtime Types

export interface Message {
    id: string;
    from: string;
    to: string;
    content: string;
    timestamp: Date;
    type: 'text' | 'audio' | 'request' | 'response';
    status: 'pending' | 'processing' | 'completed' | 'error';
}

export interface AgentContext {
    recentMessages: Message[];
    systemPrompt: string;
    state: Record<string, any>;
}

export interface AgentSkill {
    name: string;
    execute: (input: string, context: AgentContext) => Promise<string> | string;
}

// Example capability constants
export const CAPABILITIES = {
    SHOPPING: {
        CREATE: 'shopping_list.create',
        READ: 'shopping_list.read',
        UPDATE: 'shopping_list.update',
        DELETE: 'shopping_list.delete'
    },
    AUDIO: {
        TRANSCRIBE: 'audio.transcribe'
    },
    DELEGATION: {
        SHOPPING: 'delegate.shopping',
        AUDIO: 'delegate.audio'
    }
} as const;
