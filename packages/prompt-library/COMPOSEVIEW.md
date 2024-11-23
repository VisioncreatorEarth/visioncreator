# ComposeView Architecture Guide

## Overview

The ComposeView system is a powerful, declarative way to build dynamic views using a component composition pattern. It allows for flexible layouts, dynamic data mapping, and reactive state management.

## Core Components

### 1. ComposeView.svelte
The root component that takes a view configuration and renders the component tree.

### 2. Composer.svelte
Handles the layout, state management, and component rendering for each node in the view tree.

## Data Mapping System

### Map Schema
```typescript
const MapValueSchema = z.union([
    z.string(),
    z.number(),
    z.object({
        query: z.string(),        // Query operation name
        input: z.record(z.any()), // Optional query input
        prop: z.string(),         // Property to extract from query result
        mapProps: z.record(z.string()) // Nested property mapping
    })
]);
```

### Component Interface
```typescript
// In your Svelte component
<script lang="ts">
  export let me;  // Composer store
  const query = $me.query;  // Access to mapped query data
</script>
```

## Full Stack Example: Profile System

### 1. Backend Query (queryMe.ts)
```typescript
export default createOperation.query({
  requireAuthentication: true,
  handler: async ({ context, user }) => {
    const { data: profiles } = await context.supabase
      .from("profiles")
      .select("id, name, stats")
      .eq("id", user.customClaims.id)
      .single();

    return {
      id: profiles.id,
      name: profiles.name,
      stats: profiles.stats
    };
  }
});
```

### 2. Component (Profile.svelte)
```typescript
<script lang="ts">
  export let me;
  const query = $me.query;
</script>

<div class="profile">
  <h1>{$query.data.title}</h1>
  <p>{$query.data.description}</p>
  <div class="stats">
    <div>
      <span>{$query.data.stat1}</span>
      <span>{$query.data.stat1desc}</span>
    </div>
    <div>
      <span>{$query.data.stat2}</span>
      <span>{$query.data.stat2desc}</span>
    </div>
  </div>
</div>
```

### 3. View Configuration (Me.ts)
```typescript
export const view = {
  render: {
    id: 'ProfileContainer',
    layout: {
      areas: `"content"`,
      rows: 'auto',
      gap: '1rem'
    },
    children: [
      {
        id: 'Profile',
        component: 'Profile',
        slot: 'content',
        map: {
          title: {
            query: 'queryMe',
            prop: 'name'
          },
          description: 'Welcome back!',
          stat1: {
            query: 'queryUserStats',
            prop: 'totalCount'
          },
          stat1desc: 'Total Items',
          stat2: {
            query: 'queryUserStats',
            prop: 'rank'
          },
          stat2desc: 'Current Rank'
        }
      }
    ]
  }
};
```

## Full Stack Example: Todo App

### 1. Backend Query
```typescript
// queryTodos.ts
export default createOperation.query({
  handler: async ({ context, user }) => {
    const { data: todos } = await context.supabase
      .from("todos")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    return { todos };
  }
});
```

### 2. Components

```typescript
// TodoList.svelte
<script lang="ts">
  export let me;
  const query = $me.query;
</script>

<div class="todo-list">
  <h2>{$query.data.title}</h2>
  {#each $query.data.items as item}
    <div class="todo-item">
      <h3>{item.title}</h3>
      <p>{item.description}</p>
      <span>{item.status}</span>
    </div>
  {/each}
</div>
```

### 3. View Configuration

```typescript
export const todoView = {
  render: {
    id: 'TodoContainer',
    layout: {
      areas: `
        "header"
        "list"
      `,
      rows: 'auto 1fr',
      gap: '1rem'
    },
    children: [
      {
        id: 'TodoHeader',
        component: 'Header',
        slot: 'header',
        map: {
          title: 'Your Todos',
          subtitle: {
            query: 'queryTodos',
            prop: 'todos',
          }
        }
      },
      {
        id: 'TodoList',
        component: 'TodoList',
        slot: 'list',
        map: {
          title: 'Todo List',
          items: {
            query: 'queryTodos',
            prop: 'todos',
            mapProps: {
              title: 'prop.title',
              description: 'prop.description',
              status: 'prop.status'
            }
          }
        }
      }
    ]
  }
};
```

## Best Practices

1. **Component Design**
   - Keep components focused on presentation
   - Use the `me` store for data access
   - Handle component-specific logic internally

2. **Data Mapping**
   - Use descriptive property names in components
   - Map data transformation in view configuration
   - Leverage `mapProps` for nested data structures

3. **Query Integration**
   - Keep queries focused and specific
   - Handle errors gracefully
   - Use proper typing for inputs and outputs

4. **Layout Structure**
   - Use semantic grid areas
   - Keep responsive design in mind
   - Use meaningful slot names

## Common Patterns

### List with Nested Data
```typescript
map: {
  items: {
    query: 'queryItems',
    prop: 'results',
    mapProps: {
      title: 'prop.name',
      subtitle: 'prop.description',
      metadata: 'prop.attributes'
    }
  }
}
```


### Multiple Queries
```typescript
map: {
  header: {
    query: 'queryProfile',
    prop: 'name'
  },
  content: {
    query: 'queryContent',
    prop: 'data'
  },
  footer: {
    query: 'queryStats',
    prop: 'summary'
  }
}
```

Remember:
- Keep components generic and reusable
- Handle data transformation in view configurations
- Use TypeScript for better type safety
- Test different data scenarios
- Document component interfaces