export type AgentType = 'hominio' | 'vroni' | 'ali' | 'walter' | 'bert' | 'user';

export interface AgentPayload {
    type: string;
    data: any;
    reasoning?: string;
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
    error?: string;
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
        id: string;
        model: string;
        type: string;
        role: string;
        content: ClaudeContent[];
        stop_reason: string;
        usage: {
            input_tokens: number;
            output_tokens: number;
        }
    }
}

export interface ClaudeContent {
    type: 'text' | 'tool_use';
    text?: string;
    id?: string;
    name?: string;
    input?: {
        to: AgentType;
        task: string;
        reasoning: string;
    }
}

export type MockResponse = {
    type: string;
    content: string;
    data: any;
}; 