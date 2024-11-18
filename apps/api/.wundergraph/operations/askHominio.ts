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

const ULTRAVOX_CONFIG: UltravoxConfig = {
  systemPrompt: "You are an expert AI assistant helping users navigate through different views of an application. You can switch between banking, todo list, and profile views based on user requests. Plesae always be very brief and concise in your responses. Also be charming, heartful and like a friend, not formal, but dont say stuff like 'buddy'",
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
              enum: ["banking", "todos", "profile", "none"],
              description: "The view to switch to based on user intent"
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
