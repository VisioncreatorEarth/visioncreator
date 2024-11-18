import { createOperation, z } from '../generated/wundergraph.factory';
import { UltravoxAuthenticationError, UltravoxInitializationError, UltravoxSubscriptionError } from '../errors';

interface UltravoxConfig {
  systemPrompt: string;
  temperature: number;
  selectedTools: Array<{
    temporaryTool: {
      modelToolName: string;
      description: string;
      dynamicParameters: Array<{
        name: string;
        location: string;
        schema: {
          type: string;
          enum?: string[];
          description: string;
          properties?: Record<string, any>;
        };
        required: boolean;
      }>;
      client: Record<string, any>;
    };
  }>;
  voice: string;
}

const AVAILABLE_VIEWS = {
  'o-HelloEarth': {
    component: 'o-HelloEarth',
    description: 'Main dashboard/welcome view for general overview and home screen',
    context: { type: 'dashboard' }
  },
  'o-Bring': {
    component: 'o-Bring',
    description: 'Shopping and item management for lists and purchases',
    context: { type: 'shopping' }
  },
  'o-Banking': {
    component: 'o-Banking',
    description: 'Financial information, transactions, and account management',
    context: { type: 'banking' }
  },
  'o-AirBNB': {
    component: 'o-AirBNB',
    description: 'Accommodation bookings and property management',
    context: { type: 'accommodation' }
  },
  'o-Splitwise': {
    component: 'o-Splitwise',
    description: 'Expense sharing and group cost tracking',
    context: { type: 'expenses' }
  },
  'o-Kanban': {
    component: 'o-Kanban',
    description: 'Task management, to-do lists, and project organization',
    context: { type: 'tasks' }
  }
} as const;

const ULTRAVOX_CONFIG: UltravoxConfig = {
  systemPrompt: `You are an expert AI assistant helping users navigate through different views of an application. You can switch between various views based on user requests. Please always be very brief and concise in your responses. Also be charming, heartful and like a friend, not formal, but dont say stuff like 'buddy'.

Available components and their purposes:
- o-HelloEarth: Main dashboard/welcome view for general overview and home screen
- o-Bring: Shopping and item management for lists and purchases
- o-Banking: Financial information, transactions, and account management
- o-AirBNB: Accommodation bookings and property management
- o-Splitwise: Expense sharing and group cost tracking
- o-Kanban: Task management, to-do lists, and project organization

Analyze the user's request and select the most appropriate component. Examples:
- "Show my tasks" → o-Kanban
- "I need to see my shopping list" → o-Bring
- "Show me my expenses" → o-Splitwise
- "Check my account" → o-Banking
- "Show my bookings" → o-AirBNB
- "Go to dashboard" → o-HelloEarth`,
  temperature: 0.8,
  selectedTools: [
    {
      temporaryTool: {
        modelToolName: "switchView",
        description: "Switch the current UI view based on user intent. Call this whenever the user expresses interest in viewing different content or functionality.",
        dynamicParameters: [
          {
            name: "view",
            location: "PARAMETER_LOCATION_BODY",
            schema: {
              type: "string",
              enum: Object.keys(AVAILABLE_VIEWS),
              description: "The view to switch to based on user intent. Available views: " + 
                Object.entries(AVAILABLE_VIEWS)
                  .map(([key, value]) => `${key} (${value.description})`)
                  .join(', ')
            },
            required: true
          },
          {
            name: "context",
            location: "PARAMETER_LOCATION_BODY",
            schema: {
              type: "object",
              description: "Additional context data specific to the view",
              properties: {
                reason: {
                  type: "string",
                  description: "Why this view was selected based on user intent"
                },
                additionalData: {
                  type: "object",
                  description: "Any additional data needed for the view"
                }
              }
            },
            required: false
          }
        ],
        client: {}
      }
    }
  ],
  voice: "b0e6b5c1-3100-44d5-8578-9015aa3023ae"
};

export default createOperation.mutation({
  input: z.object({
    chat_message_prompts: z.array(z.string()).min(1)
  }),
  errors: [UltravoxInitializationError, UltravoxSubscriptionError, UltravoxAuthenticationError],
  handler: async ({ input, context }) => {
    try {
      console.log("Starting Ultravox API call...");

      const response = await context.ultravox.call(ULTRAVOX_CONFIG);
      console.log("Ultravox response:", response);

      return {
        data: response
      };
    } catch (error) {
      console.error('Error in askHominio:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new UltravoxInitializationError('Unknown error occurred');
    }
  },
});
