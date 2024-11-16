import type { Agent, AgentCapability } from '$lib/types/agent';
import { defaultAgentConfigs, defaultAgentCapabilities } from '$lib/config/agents';

// Mock database service
class AgentService {
    private agents: Map<string, Agent>;
    private capabilities: Map<string, AgentCapability[]>;

    constructor() {
        this.agents = new Map(defaultAgentConfigs.map(agent => [agent.id, agent as Agent]));
        this.capabilities = new Map();

        // Group capabilities by agent_id
        defaultAgentCapabilities.forEach(cap => {
            const agentCaps = this.capabilities.get(cap.agent_id) || [];
            agentCaps.push(cap);
            this.capabilities.set(cap.agent_id, agentCaps);
        });
    }

    // Agent CRUD operations
    async createAgent(type: 'hominio' | 'watts' | 'bert'): Promise<Agent> {
        const template = defaultAgentConfigs.find(a => a.type === type);
        if (!template) throw new Error(`Invalid agent type: ${type}`);

        const newAgent: Agent = {
            ...template,
            id: `${type}-${Date.now()}`,
            created_at: new Date(),
            updated_at: new Date(),
            last_active: new Date(),
            context: {
                ...template.context,
                memory: {},
                state: {}
            }
        } as Agent;

        this.agents.set(newAgent.id, newAgent);
        return newAgent;
    }

    async getAgent(agentId: string): Promise<Agent | undefined> {
        return this.agents.get(agentId);
    }

    async updateAgent(agentId: string, updates: Partial<Agent>): Promise<Agent> {
        const agent = await this.getAgent(agentId);
        if (!agent) throw new Error(`Agent not found: ${agentId}`);

        const updatedAgent = {
            ...agent,
            ...updates,
            context: {
                ...agent.context,
                ...(updates.context || {})
            },
            updated_at: new Date()
        };

        this.agents.set(agentId, updatedAgent);
        return updatedAgent;
    }

    async deleteAgent(agentId: string): Promise<void> {
        this.agents.delete(agentId);
    }

    // Capability management
    async addAgentCapability(agentId: string, capability: Partial<AgentCapability>): Promise<void> {
        const agent = await this.getAgent(agentId);
        if (!agent) throw new Error(`Agent not found: ${agentId}`);

        const newCapability: AgentCapability = {
            id: `cap-${Date.now()}`,
            agent_id: agentId,
            created_at: new Date(),
            updated_at: new Date(),
            ...capability
        } as AgentCapability;

        const agentCaps = this.capabilities.get(agentId) || [];
        agentCaps.push(newCapability);
        this.capabilities.set(agentId, agentCaps);

        // Update agent's capabilities
        await this.updateAgent(agentId, {
            capabilities: agentCaps
        });
    }

    async getAgentCapabilities(agentId: string): Promise<AgentCapability[]> {
        return this.capabilities.get(agentId) || [];
    }

    // Context management
    async updateAgentContext(agentId: string, contextUpdates: Partial<Agent['context']>): Promise<void> {
        const agent = await this.getAgent(agentId);
        if (!agent) throw new Error(`Agent not found: ${agentId}`);

        await this.updateAgent(agentId, {
            context: {
                ...agent.context,
                ...contextUpdates
            }
        });
    }
}

// Export singleton instance
export const agentService = new AgentService();
