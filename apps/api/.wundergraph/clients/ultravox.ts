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

  private async getActiveCalls(): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/calls`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.apiKey
        }
      });

      if (!response.ok) {
        console.warn('Failed to fetch active calls:', response.status);
        return [];
      }

      const data = await response.json();
      return data.calls?.filter(call => !call.ended)?.map(call => call.callId) || [];
    } catch (error) {
      console.warn('Error fetching active calls:', error);
      return [];
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

      if (!response.ok) {
        console.warn(`Failed to end call ${callId}:`, response.status);
        return false;
      }

      return true;
    } catch (error) {
      console.warn(`Error ending call ${callId}:`, error);
      return false;
    }
  }

  private async cleanupActiveCalls(): Promise<void> {
    console.log('Checking for active calls to cleanup...');
    const activeCalls = await this.getActiveCalls();
    
    if (activeCalls.length > 0) {
      console.log(`Found ${activeCalls.length} active calls. Cleaning up...`);
      
      await Promise.all(
        activeCalls.map(async callId => {
          const success = await this.endCall(callId);
          console.log(`Call ${callId} cleanup ${success ? 'successful' : 'failed'}`);
        })
      );
    } else {
      console.log('No active calls found to cleanup');
    }
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
    const headers = {
      'Content-Type': 'application/json',
      'X-API-Key': this.apiKey
    };

    console.log('Request headers:', {
      ...headers,
      'X-API-Key': headers['X-API-Key'] ? 'Present (length: ' + headers['X-API-Key'].length + ')' : 'Missing'
    });

    try {
      // Cleanup any active calls first
      await this.cleanupActiveCalls();

      const response = await fetch(`${this.baseUrl}/calls`, {
        method: 'POST',
        headers,
        body: JSON.stringify(config)
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
