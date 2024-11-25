import { UltravoxAuthenticationError, UltravoxInitializationError } from '../errors';

interface CallParams {
  systemPrompt: string;
  voice: string;
  temperature: number;
  maxDuration: string;
  timeExceededMessage: string;
  firstSpeaker: string;
  selectedTools: any[];
}

interface UltravoxResponse {
  data?: {
    callId: string;
    joinUrl: string;
    transcript?: any;
    toolExecutions?: any;
  };
  error?: string;
}

interface TimeUsageResponse {
  data?: {
    timeUsed: string;
    timeRemaining: string;
    hasActiveSubscription: boolean;
  };
  error?: string;
}

interface CallResponse {
  data?: {
    calls: Array<{
      callId: string;
      created: string;
      ended?: string;
      endReason?: string;
      firstSpeaker: string;
      systemPrompt: string;
      voice: string;
    }>;
    nextCursor?: string;
  };
  error?: string;
}

export class UltravoxClient {
  private apiKey: string;
  private baseUrl = 'https://api.ultravox.ai/api';
  private cleanupTimers: Map<string, NodeJS.Timeout> = new Map();

  constructor(apiKey: string) {
    if (!apiKey) {
      console.error('❌ Missing Ultravox API key');
      throw new UltravoxInitializationError('Missing Ultravox API key');
    }
    this.apiKey = apiKey;
  }

  private async checkAndCleanupCall(callId: string) {
    try {
      // Check if the call exists and its status
      const statusResponse = await fetch(`${this.baseUrl}/calls/${callId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.apiKey
        }
      });

      // If call doesn't exist, skip cleanup
      if (statusResponse.status === 404) {
        console.log('ℹ️ Call no longer exists, skipping cleanup:', callId);
        return;
      }

      if (statusResponse.ok) {
        const callData = await statusResponse.json();
        // Only cleanup if the call hasn't been joined AND isn't already ended
        if (!callData.joined && !callData.ended) {
          console.log('🧹 Auto-cleaning unjoined call:', callId);
          await this.endCall(callId);
        } else {
          console.log('ℹ️ Skipping cleanup - Call is either joined or ended:', callId);
        }
      }
    } catch (error) {
      console.error('❌ Error during auto-cleanup:', error);
    } finally {
      // Clear the timer reference
      this.cleanupTimers.delete(callId);
    }
  }

  async createCall(params: CallParams): Promise<UltravoxResponse> {
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
        body: JSON.stringify(params)
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

      // Set up auto-cleanup timer
      const timer = setTimeout(() => {
        this.checkAndCleanupCall(data.callId);
      }, 10000); // 30 seconds to give more time for joining

      // Store the timer reference
      this.cleanupTimers.set(data.callId, timer);

      return { data };
    } catch (error) {
      console.error('❌ Error creating call:', error);
      throw error;
    }
  }

  async endCall(callId: string): Promise<void> {
    console.log('🔚 Ending call:', callId);
    try {
      // First mark the call as ended
      const response = await fetch(`${this.baseUrl}/calls/${callId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.apiKey
        },
        body: JSON.stringify({ status: 'ended' })
      });

      if (!response.ok && response.status !== 404) {
        throw new Error(`Failed to end call: ${response.statusText}`);
      }

      console.log('✅ Call ended successfully:', callId);
    } catch (error) {
      console.error('❌ Error ending call:', error);
      throw error;
    }
  }

  async deleteCall(callId: string): Promise<void> {
    console.log('🗑️ Deleting call:', callId);
    try {
      const response = await fetch(`${this.baseUrl}/calls/${callId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.apiKey
        }
      });

      if (!response.ok && response.status !== 404) {
        throw new Error(`Failed to delete call: ${response.statusText}`);
      }

      console.log('✅ Call deleted successfully:', callId);
    } catch (error) {
      console.error('❌ Error deleting call:', error);
      throw error;
    }
  }

  async getTimeUsage(): Promise<TimeUsageResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/accounts/me`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.apiKey
        }
      });

      if (!response.ok) {
        console.error('❌ Response not OK:', {
          status: response.status,
          statusText: response.statusText
        });

        if (response.status === 401) {
          throw new UltravoxAuthenticationError('Invalid API key');
        }
        throw new Error(`Failed to get time usage: ${response.statusText}`);
      }

      const accountData = await response.json();
      return {
        data: {
          timeUsed: accountData.freeTimeUsed,
          timeRemaining: accountData.freeTimeRemaining,
          hasActiveSubscription: accountData.hasActiveSubscription
        }
      };
    } catch (error) {
      console.error('❌ Error getting time usage:', error);
      return { error: error.message };
    }
  }

  async getCalls(): Promise<CallResponse> {
    try {
      let allCalls = [];
      let nextCursor: string | undefined;

      // Keep fetching until we have all calls
      do {
        const url = new URL(`${this.baseUrl}/calls`);
        if (nextCursor) {
          url.searchParams.append('cursor', nextCursor);
        }

        const response = await fetch(url.toString(), {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': this.apiKey
          }
        });

        if (!response.ok) {
          console.error('❌ Response not OK:', {
            status: response.status,
            statusText: response.statusText
          });

          if (response.status === 401) {
            throw new UltravoxAuthenticationError('Invalid API key');
          }
          throw new Error(`Failed to get calls: ${response.statusText}`);
        }

        const data = await response.json();
        allCalls = [...allCalls, ...(data.results || [])];
        nextCursor = data.next_cursor;

      } while (nextCursor);

      console.log(`📞 Fetched all ${allCalls.length} calls`);

      return {
        data: {
          calls: allCalls
        }
      };
    } catch (error) {
      console.error('❌ Error getting calls:', error);
      return { error: error.message };
    }
  }

  async getCallTranscript(callId: string): Promise<UltravoxResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/calls/${callId}/messages`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.apiKey
        }
      });

      if (!response.ok) {
        console.error('❌ Response not OK:', {
          status: response.status,
          statusText: response.statusText
        });

        if (response.status === 401) {
          throw new UltravoxAuthenticationError('Invalid API key');
        }
        throw new Error(`Failed to get call transcript: ${response.statusText}`);
      }

      const data = await response.json();
      const transcript = data.results.map((msg: any) => ({
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp
      }));

      return {
        data: {
          callId,
          transcript
        }
      };
    } catch (error) {
      console.error('❌ Error getting call transcript:', error);
      return { error: error.message };
    }
  }
}