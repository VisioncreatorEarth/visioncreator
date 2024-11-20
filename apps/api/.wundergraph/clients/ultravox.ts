import { UltravoxAuthenticationError, UltravoxInitializationError, UltravoxSubscriptionError } from '../errors';

export class UltravoxClient {
  private apiKey: string;
  private baseUrl = 'https://api.ultravox.ai/api';
  private toolImplementations = new Map<string, Function>();

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new UltravoxAuthenticationError();
    }
    this.apiKey = apiKey;
  }

  registerTool(name: string, implementation: Function) {
    this.toolImplementations.set(name, implementation);
  }

  async call(config: {
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
  }) {
    try {
      config.selectedTools.forEach(tool => {
        const { modelToolName, client } = tool.temporaryTool;
        if (client?.implementation) {
          this.registerTool(modelToolName, client.implementation);
        }
      });

      await this.cleanupActiveCalls();

      console.log('🔑 Using API Key:', this.apiKey.substring(0, 8) + '...');
      console.log('🌐 Making request to:', `${this.baseUrl}/calls`);
      console.log('📦 Request payload:', JSON.stringify({
        voice: config.voice,
        systemPrompt: config.systemPrompt,
        temperature: config.temperature,
        selectedTools: config.selectedTools,
        transcriptOptional: true,
      }, null, 2));

      const response = await fetch(`${this.baseUrl}/calls`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.apiKey
        },
        body: JSON.stringify({
          voice: config.voice,
          systemPrompt: config.systemPrompt,
          temperature: config.temperature,
          selectedTools: config.selectedTools,
          transcriptOptional: true,
        }),
      });

      if (!response.ok) {
        console.error('❌ Response not OK:', {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
        });

        try {
          const errorBody = await response.text();
          console.error('📄 Error response body:', errorBody);
        } catch (e) {
          console.error('⚠️ Could not read error response body');
        }

        if (response.status === 402) throw new UltravoxSubscriptionError();
        if (response.status === 401) throw new UltravoxAuthenticationError();
        throw new UltravoxInitializationError(`Ultravox API error: ${response.status}`);
      }

      const responseData = await response.json();
      console.log('✅ Response data:', JSON.stringify(responseData, null, 2));

      if (!responseData.joinUrl) {
        throw new UltravoxInitializationError('No joinUrl in Ultravox response');
      }

      if (responseData.callId) {
        this.pollMessages(responseData.callId);
      }

      return {
        success: true,
        message: 'Successfully created Ultravox call',
        joinUrl: responseData.joinUrl,
        callId: responseData.callId,
        transcript: responseData.transcript,
        toolExecutions: responseData.toolExecutions
      };

    } catch (error) {
      console.error('❌ Error in UltravoxClient.call:', error);
      if (error instanceof Error) {
        throw new UltravoxInitializationError(error.message || 'Unknown error occurred');
      }
      throw error;
    }
  }

  private async pollMessages(callId: string) {
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`${this.baseUrl}/calls/${callId}/messages`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': this.apiKey,
          },
        });

        if (!response.ok) return;

        const data = await response.json();

        if (data.results?.length > 0) {
          for (const msg of data.results) {
            if (msg.role === 'MESSAGE_ROLE_TOOL_CALL') {
              const implementation = this.toolImplementations.get(msg.toolName);
              if (implementation) {
                try {
                  const args = JSON.parse(msg.text);
                  const result = await implementation(args);

                  await fetch(`${this.baseUrl}/calls/${callId}/tool-results`, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'X-API-Key': this.apiKey,
                    },
                    body: JSON.stringify({
                      toolName: msg.toolName,
                      result: JSON.stringify(result),
                      success: true,
                    }),
                  });
                } catch (error) {
                  await fetch(`${this.baseUrl}/calls/${callId}/tool-results`, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'X-API-Key': this.apiKey,
                    },
                    body: JSON.stringify({
                      toolName: msg.toolName,
                      result: error instanceof Error ? error.message : 'Unknown error',
                      success: false,
                    }),
                  });
                }
              }
            }
          }
        }
      } catch (error) {
        // Silent error handling for polling
      }
    }, 1000);

    const statusInterval = setInterval(async () => {
      try {
        const response = await fetch(`${this.baseUrl}/calls/${callId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': this.apiKey,
          },
        });

        if (!response.ok) return;

        const data = await response.json();

        if (data.ended) {
          clearInterval(pollInterval);
          clearInterval(statusInterval);
        }
      } catch (error) {
        // Silent error handling for status polling
      }
    }, 2000);
  }

  private async getActiveCalls(): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/calls`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.apiKey
        }
      });

      if (!response.ok) return [];

      const data = await response.json();
      return data.calls?.filter(call => !call.ended)?.map(call => call.callId) || [];
    } catch {
      return [];
    }
  }

  private async cleanupActiveCalls(): Promise<void> {
    const activeCalls = await this.getActiveCalls();
    await Promise.all(
      activeCalls.map(callId => this.endCall(callId))
    );
  }

  private async endCall(callId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/calls/${callId}/end`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.apiKey
        }
      });

      return response.ok;
    } catch {
      return false;
    }
  }
}
