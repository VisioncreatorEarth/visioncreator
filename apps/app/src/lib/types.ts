export interface Capability {
    id: string;
    user_id: string;
    type: string;
    name: string;
    description: string;
    config: {
        tier: 'free' | 'homino' | 'visioncreator';
        aiRequestsLimit?: number;
        [key: string]: any;
    };
    granted_at: string;
    granted_by: string;
    active: boolean;
    profiles?: {
        name: string;
    };
}

export interface AuditLog {
    id: string;
    timestamp: string;
    action: string;
    userId: string;
    details: string;
    performedBy: string;
    capabilityId: string;
    capabilityType: string;
}
