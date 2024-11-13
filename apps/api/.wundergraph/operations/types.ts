// Define base capability types
export type AccessLevel = 'read' | 'write' | 'owner';

export interface ResourceCapability {
    resourceId: string;
    resourceType: string;
    accessLevel: AccessLevel;
    grantedAt: string;
    grantedBy: string;
}

export interface TierCapability {
    type: string;
    limit?: number;
    tier: string;
}

export interface UserCapabilities {
    tier: string;
    tierCapabilities: TierCapability[];
    resourceCapabilities: ResourceCapability[];
} 