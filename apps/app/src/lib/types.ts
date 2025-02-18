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
    author_name: string;
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

// First, let's properly define our Schema types
export interface SchemaProperty {
    type: string;
    title?: string;
    description?: string;
    format?: string;
    pattern?: string;
    minimum?: number;
    maximum?: number;
    minLength?: number;
    maxLength?: number;
    required?: string[];
    nullable?: boolean;
    properties?: Record<string, SchemaProperty>;
    items?: SchemaProperty;
    errorMessage?: Record<string, string>;
    validate?: Record<string, any>;
    'x-relation'?: {
        type: 'single' | 'multiple';
        schemaId: string;
    };
    enum?: string[];
}

export interface Schema {
    type: string;
    title?: string;
    description?: string;
    required?: string[];
    properties: Record<string, SchemaProperty>;
    display_field?: string;
}
