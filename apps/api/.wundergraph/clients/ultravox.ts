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
    totalCalls: number;
    totalMinutes: number;
    totalCost: number;
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
    totalCount?: number;
  };
  error?: string;
}

interface VoicesResponse {
  data?: {
    next: string | null;
    previous: string | null;
    results: Array<{
      voiceId: string;
      name: string;
      description: string;
      previewUrl: string | null;
    }>;
  };
  error?: string;
}

export class UltravoxClient {
  private apiKey: string;
  private baseUrl = 'https://api.ultravox.ai/api';
  private cleanupTimers: Map<string, NodeJS.Timeout> = new Map();
  private joinedCalls: Set<string> = new Set();

  constructor(apiKey: string) {
    if (!apiKey) {
      console.error('❌ Missing Ultravox API key');
      throw new UltravoxInitializationError('Missing Ultravox API key');
    }
    this.apiKey = apiKey;
  }

  markCallJoined(callId: string) {
    console.log('✅ Marking call as joined:', callId);
    this.joinedCalls.add(callId);
    // Clear any existing cleanup timer
    const timer = this.cleanupTimers.get(callId);
    if (timer) {
      clearTimeout(timer);
      this.cleanupTimers.delete(callId);
    }
  }

  private async checkAndCleanupCall(callId: string) {
    // Don't cleanup if the call has been joined
    if (this.joinedCalls.has(callId)) {
      console.log('✅ Call is joined, skipping cleanup:', callId);
      return;
    }

    console.log('🧹 Auto-cleaning unjoined call:', callId);
    try {
      await this.endCall(callId);
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
      // Get total calls
      const callsResponse = await this.getCalls();
      if (callsResponse.error) {
        return { error: callsResponse.error };
      }

      const calls = callsResponse.data?.calls || [];
      let totalMinutes = 0;

      // Calculate total minutes from all calls
      calls.forEach(call => {
        if (call.ended) {
          const startTime = new Date(call.created).getTime();
          const endTime = new Date(call.ended).getTime();
          const durationMinutes = (endTime - startTime) / (1000 * 60);
          totalMinutes += durationMinutes;
        }
      });

      const roundedMinutes = Math.round(totalMinutes);
      const totalCost = roundedMinutes * 0.05; // $0.05 per minute

      return {
        data: {
          totalCalls: callsResponse.data?.totalCount || 0,
          totalMinutes: roundedMinutes,
          totalCost: Number(totalCost.toFixed(2)), // Round to 2 decimal places
          hasActiveSubscription: true // Since we're on a paid plan
        }
      };
    } catch (error) {
      console.error('❌ Error getting usage stats:', error);
      return { error: error.message };
    }
  }

  async getCalls(): Promise<CallResponse> {
    try {
      // Fetch only the first page which should contain the most recent calls
      const url = new URL(`${this.baseUrl}/calls`);
      url.searchParams.append('limit', '50'); // Request 50 calls

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
      const calls = data.results || [];
      const totalCount = data.total_count || calls.length; // Use total_count if available

      console.log(`📞 Fetched last ${calls.length} calls out of ${totalCount} total`);

      return {
        data: {
          calls: calls,
          totalCount: totalCount
        }
      };
    } catch (error) {
      console.error('❌ Error getting calls:', error);
      return { error: error.message };
    }
  }

  async getTranscript(callId: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/calls/${callId}/messages`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.apiKey
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get transcript: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('❌ Error getting transcript:', error);
      throw error;
    }
  }

  async getVoices(): Promise<VoicesResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/voices`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.apiKey
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return { data };
    } catch (error) {
      if (error instanceof UltravoxAuthenticationError) {
        throw error;
      }
      return { error: error instanceof Error ? error.message : 'Unknown error occurred' };
    }
  }
}