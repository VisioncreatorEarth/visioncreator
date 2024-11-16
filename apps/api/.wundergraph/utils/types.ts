export interface Capability {
    id: string;
    userId: string;
    type: 'TIER' | 'RESOURCE';
    name: string;
    description?: string;
    config: {
        // For TIER type
        tier?: 'free' | 'homino' | 'visioncreator';
        aiRequestsLimit?: number;
        aiRequestsUsed?: number;
        lastResetAt?: string;
        // For future RESOURCE types
        resourceId?: string;
        resourceType?: string;
        accessLevel?: 'read' | 'write' | 'owner';
    };
    grantedAt: string;
    grantedBy: string;
    active: boolean;
}

export interface AuditTrailEntry {
    id: string;
    timestamp: string;
    capabilityId: string;
    action: string;
    userId: string;
    performedBy: string;
    details: Record<string, any>;
} 