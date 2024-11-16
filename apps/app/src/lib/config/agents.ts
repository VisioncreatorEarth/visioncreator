import type { Agent, AgentCapability, AgentState } from '$lib/types/agent';
import { CAPABILITIES } from '$lib/types/agent';

// Mock database configurations
export const defaultAgentConfigs: Partial<Agent>[] = [
    {
        id: 'hominio-default',
        owner_id: 'system',
        name: 'Hominio',
        type: 'hominio',
        version: '1.0',
        system_prompt: 'I am Hominio, the master delegator agent.',
        status: 'idle',
        last_active: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
        context: {
            role: 'delegator',
            responsibilities: ['task_routing', 'intent_detection'],
            memory: {},
            state: {}
        }
    },
    {
        id: 'watts-default',
        owner_id: 'system',
        name: 'Watts',
        type: 'watts',
        version: '1.0',
        system_prompt: 'I am Watts, the audio processing agent.',
        status: 'idle',
        last_active: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
        context: {
            role: 'audio_processor',
            responsibilities: ['transcription'],
            supported_formats: ['wav', 'mp3'],
            memory: {},
            state: {}
        }
    },
    {
        id: 'bert-default',
        owner_id: 'system',
        name: 'Bert',
        type: 'bert',
        version: '1.0',
        system_prompt: 'I am Bert, the shopping list manager.',
        status: 'idle',
        last_active: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
        context: {
            role: 'shopping_manager',
            responsibilities: ['list_management'],
            shopping_lists: [],
            memory: {},
            state: {}
        }
    }
];

export const defaultAgentCapabilities: AgentCapability[] = [
    {
        id: 'cap-1',
        agent_id: 'hominio-default',
        name: 'delegation.shopping',
        description: 'Can delegate shopping tasks',
        created_at: new Date(),
        updated_at: new Date()
    },
    {
        id: 'cap-2',
        agent_id: 'hominio-default',
        name: 'delegation.audio',
        description: 'Can delegate audio tasks',
        created_at: new Date(),
        updated_at: new Date()
    },
    {
        id: 'cap-3',
        agent_id: 'watts-default',
        name: 'audio.transcribe',
        description: 'Can transcribe audio',
        created_at: new Date(),
        updated_at: new Date()
    },
    {
        id: 'cap-4',
        agent_id: 'bert-default',
        name: 'shopping.manage',
        description: 'Can manage shopping lists',
        created_at: new Date(),
        updated_at: new Date()
    }
];

export const defaultAgentStates: AgentState[] = [
    {
        id: 'state-hominio-1',
        agent_id: 'hominio-default',
        context: {},
        temporary_memory: {},
        created_at: new Date(),
        updated_at: new Date()
    },
    {
        id: 'state-watts-1',
        agent_id: 'watts-default',
        context: {
            audioConfig: {
                language: 'en-US',
                quality: 'high'
            }
        },
        temporary_memory: {},
        created_at: new Date(),
        updated_at: new Date()
    },
    {
        id: 'state-bert-1',
        agent_id: 'bert-default',
        context: {
            shoppingList: {
                id: 'list1',
                items: []
            }
        },
        temporary_memory: {},
        created_at: new Date(),
        updated_at: new Date()
    }
];
