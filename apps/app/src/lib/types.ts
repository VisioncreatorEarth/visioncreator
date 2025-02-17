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

export interface DBItem {
    id: string;
    json: any;
    author: string;
    schema: string;
    version: number;
    created_at: string;
    updated_at: string;
}

export interface InsertDBInput {
    schema: {
        type: string;
        schema_id: string;
        title: string;
        description: string;
        properties: Record<string, any>;
        required: string[];
    };
}
