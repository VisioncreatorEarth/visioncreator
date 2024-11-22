import { UltravoxAuthenticationError, UltravoxInitializationError } from '../errors';

interface UltravoxResponse {
  data?: {
    callId: string;
    joinUrl: string;
    transcript?: any;
    toolExecutions?: any;
  };
  error?: string;
}

export class UltravoxClient {
  private apiKey: string;
  private baseUrl = 'https://api.ultravox.ai/api';

  constructor(apiKey: string) {
    if (!apiKey) {
      console.error('❌ Missing Ultravox API key');
      throw new UltravoxInitializationError('Missing Ultravox API key');
    }
    this.apiKey = apiKey;
  }

  async createCall(systemPrompt: string): Promise<UltravoxResponse> {
    console.log('🚀 Creating Ultravox call...');
    try {
      console.log('🔑 Using API Key:', this.apiKey.substring(0, 8) + '...');
      console.log('🌐 Making request to:', `${this.baseUrl}/calls`);

      const response = await fetch(`${this.baseUrl}/calls`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.apiKey
        },
        body: JSON.stringify({
          systemPrompt,
          temperature: 0.8,
          voice: 'b0e6b5c1-3100-44d5-8578-9015aa3023ae', // Jessica voice ID
          maxDuration: '30s',
          timeExceededMessage: "Maximum calltime exceeded. See you next time!",
          selectedTools: []
        })
      });

      if (!response.ok) {
        console.error('❌ Response not OK:', {
          status: response.status,
          statusText: response.statusText
        });

        try {
          const errorBody = await response.text();
          console.error('📄 Error response body:', errorBody);
        } catch (e) {
          console.error('⚠️ Could not read error response body');
        }

        if (response.status === 401) {
          throw new UltravoxAuthenticationError('Invalid API key');
        }
        throw new Error(`Failed to create call: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ Call created successfully:', {
        callId: data.callId,
        hasJoinUrl: !!data.joinUrl
      });

      return { data };
    } catch (error) {
      console.error('❌ Error creating call:', error);
      throw error;
    }
  }

  async endCall(callId: string): Promise<void> {
    console.log('🔚 Ending call:', callId);
    try {
      // First, try to get the call status
      const statusResponse = await fetch(`${this.baseUrl}/calls/${callId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.apiKey
        }
      });

      // If call doesn't exist (404) or is already ended, return successfully
      if (statusResponse.status === 404) {
        console.log('ℹ️ Call already ended or does not exist:', callId);
        return;
      }

      // For other non-OK responses, log the error but continue with deletion attempt
      if (!statusResponse.ok) {
        console.warn('⚠️ Failed to get call status:', statusResponse.status, statusResponse.statusText);
      }

      // Proceed with ending the call
      const response = await fetch(`${this.baseUrl}/calls/${callId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.apiKey
        }
      });

      // If the call was already deleted or doesn't exist, consider it a success
      if (response.status === 404) {
        console.log('ℹ️ Call was already deleted:', callId);
        return;
      }

      if (!response.ok) {
        let errorMessage = `Failed to end call: ${response.statusText}`;
        try {
          const errorBody = await response.text();
          console.error('📄 Error response body:', errorBody);
          errorMessage = errorBody || errorMessage;
        } catch (e) {
          console.error('⚠️ Could not read error response body');
        }
        throw new Error(errorMessage);
      }

      console.log('✅ Call ended successfully:', callId);
    } catch (error) {
      console.error('❌ Error ending call:', error);
      throw error;
    }
  }
}