export type AccessLevel = 'read' | 'write' | 'owner';

// Unified capability type
export interface Capability {
    id: string;
    userId: string;
    type: 'TIER' | 'RESOURCE';  // Extensible for future types
    grantedAt: string;
    grantedBy: string;
    active: boolean;

    // Common properties for all capability types
    name: string;
    description: string;

    // Type-specific properties
    config: {
        // For TIER type
        tier?: 'free' | 'homino' | 'visioncreator';
        aiRequestsLimit?: number;
        aiRequestsUsed?: number;
        lastResetAt?: string;

        // For RESOURCE type
        resourceId?: string;
        resourceType?: string;
        accessLevel?: AccessLevel;

        // Add more type-specific properties as needed
    };
}

export interface UserCapabilities {
    capabilities: Capability[];
}

export interface AuditLog {
    id: string;
    timestamp: string;
    action: string;
    userId: string;
    details: string;
    performedBy: string;
    capabilityId: string;
    capabilityType: Capability['type'];
} 