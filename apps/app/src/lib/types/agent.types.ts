export type AgentType = 'user' | 'assistant' | 'hominio' | 'ali' | 'vroni' | 'walter' | 'bert';

export interface AgentPayload {
    type: 'json';
    content: any;
}

export interface BaseMessage {
    role: 'user' | 'assistant';
    content: string;
}

export interface EnhancedMessage extends BaseMessage {
    id: string;
    agent: AgentType;
    timestamp: string;
    status: 'pending' | 'complete' | 'error';
    payload?: AgentPayload;
}

export interface AgentResponse {
    success: boolean;
    message: {
        content: string;
        agent: AgentType;
        status: 'pending' | 'complete' | 'error';
        payload?: AgentPayload;
    };
    delegation?: AgentDelegation;
}

export interface AgentDelegation {
    to: AgentType;
    task: string;
    context: string;
    feedback?: string;
}

export interface AgentRequest {
    message: string;
    context: Message[];
    metadata?: {
        currentView?: string;
        activeDrafts?: any;
        userPreferences?: any;
    };
}

export interface BaseAgent {
    id: AgentType;
    systemPrompt: string;
    process(request: AgentRequest): Promise<AgentResponse>;
}

// Add these types for Claude's tools
export interface AgentTool {
    name: string;
    description: string;
    input_schema: {
        type: 'object';
        properties: Record<string, any>;
        required: string[];
    };
}

export interface DelegationResponse {
    delegation: {
        to: AgentType;
        task: string;
        reasoning: string;
    }
}

export interface ClaudeResponse {
    data: {
        askHominio: {
            content: string;
            status: 'success' | 'error';
            model: string;
            type: 'message';
            stop_reason?: 'end_turn' | 'tool_use';
            usage?: {
                input_tokens: number;
                output_tokens: number;
            }
        }
    }
} 