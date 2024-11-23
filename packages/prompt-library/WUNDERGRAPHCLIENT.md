# WunderGraph Client Guide

## Overview
This guide explains how to use WunderGraph in our VisionCreator application, covering both backend operations and frontend client usage with Svelte.

## Backend Operations

### Query Operations
Queries are read-only operations. Here's the basic structure:

```typescript
import { createOperation, z } from "../generated/wundergraph.factory";

export default createOperation.query({
  // Authentication requirements
  requireAuthentication: true,
  rbac: {
    requireMatchAll: ["authenticated"],
  },
  
  // Optional input validation
  input: z.object({
    param: z.string(),
  }),
  
  // Query handler
  handler: async ({ input, context, user }) => {
    // Your query logic here
    const result = await context.supabase
      .from("your_table")
      .select("*");
      
    return result;
  }
});
```

### Mutation Operations
Mutations are write operations. Example structure:

```typescript
export default createOperation.mutation({
  input: z.object({
    listId: z.string(),
    items: z.array(z.object({
      name: z.string(),
      quantity: z.number().optional(),
      category: z.string().optional(),
    }))
  }),
  
  handler: async ({ input, context, user }) => {
    // Your mutation logic here
    const result = await context.supabase
      .from("your_table")
      .upsert(input.items);
      
    return result;
  }
});
```

## Frontend Client Usage (Svelte)

### Setting up Queries
```typescript
import { createQuery } from '$lib/wundergraph';

// Basic query
const myQuery = createQuery({
  operationName: 'queryName'
});

// Query with live updates
const liveQuery = createQuery({
  operationName: 'queryName',
  liveQuery: true
});

// Using the query in Svelte
{#if $myQuery.isLoading}
  Loading...
{:else if $myQuery.error}
  Error: {$myQuery.error.message}
{:else}
  Data: {$myQuery.data}
{/if}
```

### Setting up Mutations
```typescript
import { createMutation } from '$lib/wundergraph';

// Create mutation
const myMutation = createMutation({
  operationName: 'mutationName'
});

// Using the mutation
async function handleSubmit() {
  try {
    const result = await $myMutation.mutateAsync({
      // your input data
    });
    // handle success
  } catch (error) {
    // handle error
  }
}
```

### Important Notes

1. **Store Syntax**: 
   - Use `$` prefix to access Svelte stores (e.g., `$myQuery.data`)
   - The `$` is required for reactive updates

2. **Live Queries**:
   - Enable with `liveQuery: true`
   - Automatically update when data changes
   - Use for real-time features

3. **Error Handling**:
   - Always check `isLoading` and `error` states
   - Use try/catch with mutations

4. **Authentication**:
   - Operations can require authentication
   - Use `requireAuthentication: true`
   - Access user in handlers via `user` parameter

5. **Type Safety**:
   - Use zod schemas for input validation
   - TypeScript types are auto-generated

## Best Practices

1. **Naming Conventions**:
   - Queries: prefix with `query` (e.g., `queryShoppingLists`)
   - Mutations: use verb-noun (e.g., `updateShoppingListItems`)

2. **Error Handling**:
   - Always include error states in UI
   - Log errors appropriately
   - Provide user-friendly error messages

3. **Performance**:
   - Always use `liveQuery` 
   - Consider pagination for large datasets
   - Implement proper loading states

4. **Security**:
   - Always validate input with zod
   - Implement proper RBAC rules
   - Never trust client-side data

## Common Patterns

### Loading States
```svelte
{#if $query.isLoading}
  <LoadingSpinner />
{:else if $query.error}
  <ErrorMessage error={$query.error} />
{:else if $query.data}
  <DataDisplay data={$query.data} />
{/if}
```

