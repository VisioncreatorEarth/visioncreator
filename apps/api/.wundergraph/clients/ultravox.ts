import { UltravoxAuthenticationError, UltravoxInitializationError, UltravoxSubscriptionError } from '../errors';

export class UltravoxClient {
  private apiKey: string;
  private baseUrl: string = 'https://api.ultravox.ai/api';

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new UltravoxAuthenticationError();
    }
    this.apiKey = apiKey;
  }

  async call() {
    const headers = {
      'Content-Type': 'application/json',
      'X-API-Key': this.apiKey
    };

    console.log('Request headers:', {
      ...headers,
      'X-API-Key': headers['X-API-Key'] ? 'Present (length: ' + headers['X-API-Key'].length + ')' : 'Missing'
    });

    try {
      const response = await fetch(`${this.baseUrl}/calls`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          systemPrompt: "You are an expert AI assistant helping users navigate through different views of an application. You can switch between banking, todo list, and profile views based on user requests.",
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
        })
      });

      const responseText = await response.text();
      console.log('Ultravox API Response Status:', response.status);
      console.log('Ultravox API Response Headers:', Object.fromEntries([...response.headers]));
      console.log('Ultravox API Response Body:', responseText);

      if (!response.ok) {
        if (response.status === 402) {
          throw new UltravoxSubscriptionError();
        }
        if (response.status === 401) {
          throw new UltravoxAuthenticationError();
        }
        throw new UltravoxInitializationError(`Ultravox API error: ${response.status} - ${responseText}`);
      }

      const data = JSON.parse(responseText);

      if (!data.joinUrl) {
        throw new UltravoxInitializationError('No joinUrl in Ultravox response');
      }

      return {
        success: true,
        joinUrl: data.joinUrl,
        message: 'Successfully created Ultravox call'
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new UltravoxInitializationError(error.message || 'Unknown error occurred');
      }
      throw error;
    }
  }
}
