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

      console.log('🔑 Using API Key:', this.apiKey.substring(0, 8) + '...');
      console.log('🌐 Making request to:', `${this.baseUrl}/calls`);

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
          selectedTools: config.selectedTools
        }),
      });

      if (!response.ok) {
        console.error('❌ Response not OK:', {
          status: response.status,
          statusText: response.statusText,
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
      console.log('✅ Call created successfully');

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
    let lastInteractionTime = Date.now();
    let isConversationActive = false;
    const INACTIVITY_TIMEOUT = 25000;

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
        let hasNewInteraction = false;

        if (data.results?.length > 0) {
          // Process messages and check for interactions
          for (const msg of data.results) {
            if (msg.role === 'MESSAGE_ROLE_TRANSCRIPT') {
              if (msg.speaker === 'user' && msg.isFinal) {
                // User finished speaking
                console.log('👤 User finished speaking:', msg.text);
                hasNewInteraction = true;
                isConversationActive = true;
              } else if (msg.speaker === 'user' && !msg.isFinal) {
                // User is currently speaking
                console.log('🎤 User is speaking...');
                isConversationActive = true;
              }
            } else if (msg.role === 'MESSAGE_ROLE_ASSISTANT') {
              // Assistant is responding
              console.log('🤖 Assistant message:', msg.text);
              hasNewInteraction = true;
              isConversationActive = true;
            }

            // Handle tool calls
            if (msg.role === 'MESSAGE_ROLE_TOOL_CALL') {
              const implementation = this.toolImplementations.get(msg.toolName);
              if (implementation) {
                try {
                  const args = JSON.parse(msg.text);
                  const result = await implementation(args);
                  isConversationActive = true; // Keep conversation active during tool execution

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
                  console.error('❌ Tool execution error:', error);
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

          // Update last interaction time only if we have new completed interactions
          if (hasNewInteraction) {
            lastInteractionTime = Date.now();
            console.log('⏱️ Interaction timer reset');
          }

          // Log all transcripts for monitoring
          const transcripts = data.results
            .filter(msg => msg.role === 'MESSAGE_ROLE_TRANSCRIPT')
            .map(msg => ({
              text: msg.text,
              isFinal: msg.isFinal,
              speaker: msg.speaker,
              medium: msg.medium
            }));

          if (transcripts.length > 0) {
            console.log('📝 All transcripts:', transcripts);
          }
        }

        // Check for inactivity only if no active conversation
        const currentTime = Date.now();
        const inactiveTime = currentTime - lastInteractionTime;

        if (!isConversationActive && inactiveTime > INACTIVITY_TIMEOUT) {
          console.log(`⏰ No activity for ${Math.round(inactiveTime / 1000)} seconds, ending call...`);
          await this.endCall(callId);
          clearInterval(pollInterval);
          clearInterval(statusInterval);
          return;
        }

        // Reset conversation active flag each poll
        isConversationActive = false;

      } catch (error) {
        console.error('❌ Error polling messages:', error);
      }
    }, 1000);

    // Check call status and cleanup
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
          console.log('✅ Call ended, cleaning up intervals');
        }
      } catch (error) {
        console.error('❌ Error checking call status:', error);
      }
    }, 2000);
  }

  private async cleanupActiveCalls() {
    try {
      const response = await fetch(`${this.baseUrl}/calls`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.apiKey
        }
      });

      if (!response.ok) return;

      const data = await response.json();
      const activeCallIds = data.calls?.filter(call => !call.ended)?.map(call => call.callId) || [];

      await Promise.all(
        activeCallIds.map(callId =>
          this.endCall(callId).catch(() => {
            /* Silent error handling for cleanup */
          })
        )
      );
    } catch {
      /* Silent error handling for cleanup */
    }
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
