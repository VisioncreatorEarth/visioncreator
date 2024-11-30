# API Creation Guide

## Overview

This guide outlines best practices for creating API endpoints using WunderGraph, with a focus on security, type safety, and clean interfaces for the Composer system.

## Context Setup

### MyContext Structure
```typescript
class MyContext {
  // Database clients
  supabase: ReturnType<typeof createClient>;
  
  // Third-party service clients
  nango: Nango;
  postmark: postmark.ServerClient;
  // ... other service clients

  constructor() {
    // Initialize clients with environment variables
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE;
    // ... other environment variables

    // Validate environment variables
    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing required environment variables");
    }

    // Initialize clients
    this.supabase = createClient(supabaseUrl, supabaseKey);
    // ... initialize other clients
  }
}
```

## Operation Types

### 1. Query Operations

Use for retrieving data. Pattern:
```typescript
import { createOperation, z, AuthorizationError } from '../generated/wundergraph.factory';

export default createOperation.query({
  // Authentication & Authorization
  requireAuthentication: true,
  rbac: {
    requireMatchAll: ["authenticated", "admin"], 
  },

  // Optional Input Schema
  input: z.object({
    // Define input parameters if needed
  }),

  handler: async ({ context, user, input }) => {
    // 1. Validate user authentication
    if (!user?.customClaims?.id) {
      throw new AuthorizationError({ message: "No authenticated user found." });
    }

    // 2. Use context.supabase for direct database queries
    const { data, error } = await context.supabase
      .from('your_table')
      .select('*')
      .eq('user_id', user.customClaims.id);

    // 3. Error handling
    if (error) {
      console.error('Error description:', error);
      throw new Error(error.message);
    }

    // 4. Return clean, typed response
    return data || [];
  },
});
```

### 2. Mutation Operations

Use for modifying data. Pattern:
```typescript
export default createOperation.mutation({
  // Required input validation
  input: z.object({
    field1: z.string().min(1).max(100),
    field2: z.number().optional(),
  }),

  // Authentication & Authorization
  requireAuthentication: true,
  rbac: {
    requireMatchAll: ["authenticated"],
  },

  handler: async ({ input, context, user }) => {
    if (!user?.customClaims?.id) {
      throw new AuthorizationError({ message: "No authenticated user found." });
    }

    const { data, error } = await context.supabase
      .from('your_table')
      .insert([
        {
          ...input,
          user_id: user.customClaims.id
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Error in mutation:', error);
      throw new Error(error.message);
    }

    return data;
  },
});
```

## Available Context APIs

### Database Context (context.supabase)
```typescript
interface SupabaseContext {
  from: (table: string) => {
    select: (query: string) => Promise<{ data: any; error: any }>;
    insert: (data: any) => Promise<{ data: any; error: any }>;
    update: (data: any) => Promise<{ data: any; error: any }>;
    delete: () => Promise<{ data: any; error: any }>;
  };
}
```

### Third-Party Services
```typescript
interface ThirdPartyServices {
  nango: Nango;              // OAuth & API Integration
  postmark: ServerClient;    // Email Service
  polar: Polar;             // Payment & Subscription
  anthropic: Anthropic;     // AI Service (Claude)
  openai: OpenAI;          // AI Service (GPT)
  ultravox: UltravoxClient; // Custom Client
}
```

## Available Operations Library

### User Management

#### queryMe
- **Type**: Query
- **Auth**: Required
- **Description**: Fetches authenticated user's profile
- **Interface**:
```typescript
interface MeResponse {
  id: string;
  name: string;
  onboarded: boolean;
}
```

#### updateMe
- **Type**: Mutation
- **Auth**: Required
- **Description**: Updates user profile information
- **Input**:
```typescript
interface UpdateMeInput {
  name?: string;
  onboarded?: boolean;
}
```

### Statistics & Analytics

#### queryUserStats
- **Type**: Query
- **Auth**: Required
- **Description**: Retrieves user statistics and rankings
- **Interface**:
```typescript
interface UserStats {
  suminvites: number;
  userRank: number;
}
```

#### queryCallsAndTimeStats
- **Type**: Query
- **Auth**: Required, Admin
- **Description**: Retrieves API usage statistics
- **Interface**:
```typescript
interface CallStats {
  total_calls: number;
  total_time: number;
}
```

### Shopping System

#### queryShoppingLists
- **Type**: Query
- **Auth**: Required
- **Description**: Fetches user's shopping lists with items
- **Interface**:
```typescript
interface ShoppingList {
  id: string;
  name: string;
  created_at: string;
  shopping_list_items: {
    id: string;
    quantity: number;
    unit: string;
    is_checked: boolean;
    shopping_items: {
      name: string;
      category: string;
      icon: string;
    };
  }[];
}
```

#### createShoppingList
- **Type**: Mutation
- **Auth**: Required
- **Description**: Creates a new shopping list
- **Input**:
```typescript
interface CreateListInput {
  listName: string;
}
```

### View Management

#### composeView
- **Type**: Query
- **Auth**: Required
- **Description**: Composes dynamic views based on configuration
- **Input**:
```typescript
interface ComposeViewInput {
  id: string;
  map: Record<string, any>;
}
```

#### updateView
- **Type**: Mutation
- **Auth**: Required
- **Description**: Updates view configuration
- **Input**:
```typescript
interface UpdateViewInput {
  id: string;
  config: any;
}
```

### AI Services

#### askClaude
- **Type**: Query
- **Auth**: Required
- **Description**: Anthropic Claude AI interaction
- **Input**:
```typescript
interface ClaudeInput {
  prompt: string;
  model?: string;
}
```

#### askHominio
- **Type**: Query
- **Auth**: Required
- **Description**: Custom AI service interaction
- **Input**:
```typescript
interface HominioInput {
  message: string;
  context?: string;
}
```

### System Management

#### manageCapabilities
- **Type**: Mutation
- **Auth**: Required, Admin
- **Description**: Manages user capabilities and permissions
- **Input**:
```typescript
interface CapabilityInput {
  userId: string;
  capabilities: string[];
  action: 'add' | 'remove';
}
```

#### getAuditLogs
- **Type**: Query
- **Auth**: Required, Admin
- **Description**: Retrieves system audit logs
- **Interface**:
```typescript
interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  details: any;
  created_at: string;
}
```

### Email System

#### sendMail
- **Type**: Mutation
- **Auth**: Required
- **Description**: Sends emails using Postmark
- **Input**:
```typescript
interface SendMailInput {
  to: string;
  subject: string;
  template: string;
  variables: Record<string, any>;
}
```

### Payment Integration

#### polarListProducts
- **Type**: Query
- **Auth**: Required
- **Description**: Lists available products from Polar
- **Interface**:
```typescript
interface PolarProduct {
  id: string;
  name: string;
  price: number;
  currency: string;
}
```

## Context Usage Guidelines

### 1. Direct Database Access (context.supabase)
Use for:
- Simple CRUD operations
- Complex queries with joins
- Real-time subscriptions

```typescript
// Example complex query
const { data } = await context.supabase
  .from('main_table')
  .select(`
    id,
    name,
    related_items (
      id,
      details
    )
  `)
  .eq('user_id', user.customClaims.id);
```

### 2. Operations Query (operations.query)
Use for:
- Calling other WunderGraph operations
- Chaining multiple operations
- Complex data transformations

```typescript
const { data, error } = await operations.query({
  operationName: 'queryName',
  input: {
    // Input parameters
  }
});
```

## Response Interface Standards

### 1. Query Responses
Return clean, consistent interfaces that match your Composer expectations:

```typescript
interface QueryResponse {
  id: string;
  // Primary fields
  [key: string]: any;
  // Nested data (if needed)
  related?: {
    id: string;
    [key: string]: any;
  }[];
}
```

### 2. Mutation Responses
Return the created/updated entity:

```typescript
interface MutationResponse {
  id: string;
  // Updated fields
  [key: string]: any;
  created_at?: string;
  updated_at?: string;
}
```

## Security Best Practices

1. **Authentication Check**
   ```typescript
   if (!user?.customClaims?.id) {
     throw new AuthorizationError({ message: "No authenticated user found." });
   }
   ```

2. **RBAC Configuration**
   ```typescript
   rbac: {
     requireMatchAll: ["authenticated"], // Base requirement
     // or
     requireMatchAll: ["authenticated", "admin"], // Admin only
   }
   ```

3. **User Data Isolation**
   Always filter by user_id:
   ```typescript
   .eq('user_id', user.customClaims.id)
   ```

4. **Input Validation**
   Always use Zod schemas:
   ```typescript
   input: z.object({
     field: z.string().min(1).max(100),
   })
   ```

## Error Handling

1. **Consistent Error Pattern**
```typescript
if (error) {
  console.error('Operation description:', error);
  throw new Error(error.message);
}
```

2. **Authentication Errors**
```typescript
throw new AuthorizationError({ 
  message: "Specific auth error message" 
});
```

3. **Validation Errors**
Let Zod handle input validation automatically.

## Testing Considerations

1. Ensure operations work with the Composer system
2. Test with and without authentication
3. Verify RBAC restrictions
4. Test error scenarios
5. Validate response formats

Remember:
- Keep responses clean and consistent
- Always check user authentication
- Use proper error handling
- Maintain type safety
- Document your APIs
