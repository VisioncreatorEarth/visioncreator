import 'dotenv/config';
import { Sandbox } from '@e2b/code-interpreter';

interface SandboxResponse {
  success: boolean;
  output?: string;
  error?: string;
}

interface SandboxInfo {
  id: string;
  status: string;
  createdAt: Date;
}

export class SandboxClient {
  private static sandboxes: Map<string, { sandbox: Sandbox; createdAt: Date }> = new Map();

  constructor() {
    if (!process.env.E2B_API_KEY) {
      throw new Error('Missing E2B_API_KEY in environment variables');
    }
    console.log(' Initializing SandboxClient');
  }

  async createSandbox(): Promise<Sandbox> {
    try {
      console.log(' Creating sandbox...');
      const sandbox = await Sandbox.create({
        apiKey: process.env.E2B_API_KEY
      });

      const sandboxId = sandbox.sandboxId;
      console.log(' Created sandbox with ID:', sandboxId);

      if (!sandboxId) {
        throw new Error('Sandbox created but no ID was returned');
      }

      SandboxClient.sandboxes.set(sandboxId, {
        sandbox,
        createdAt: new Date()
      });

      return sandbox;
    } catch (error) {
      console.error(' Detailed error creating sandbox:', error);
      throw error;
    }
  }

  async listSandboxes(): Promise<SandboxInfo[]> {
    try {
      // Get all active sandboxes from E2B
      const activeSandboxes = await Sandbox.list({
        apiKey: process.env.E2B_API_KEY
      });

      console.log(' Active sandboxes from E2B:', activeSandboxes);

      // Update our local cache with any new sandboxes
      for (const sandboxInfo of activeSandboxes) {
        if (!SandboxClient.sandboxes.has(sandboxInfo.sandboxId)) {
          const sandbox = await Sandbox.connect(sandboxInfo.sandboxId, {
            apiKey: process.env.E2B_API_KEY
          });
          SandboxClient.sandboxes.set(sandboxInfo.sandboxId, {
            sandbox,
            createdAt: new Date(sandboxInfo.startedAt)
          });
        }
      }

      // Remove any sandboxes that are no longer active
      for (const [id] of SandboxClient.sandboxes) {
        if (!activeSandboxes.find(s => s.sandboxId === id)) {
          SandboxClient.sandboxes.delete(id);
        }
      }

      // Map sandbox data ensuring all fields are present
      return activeSandboxes.map(sandbox => {
        console.log('Mapping sandbox:', sandbox);
        return {
          id: sandbox.sandboxId || '',
          status: sandbox.name || 'unknown',
          createdAt: sandbox.startedAt ? new Date(sandbox.startedAt) : new Date()
        };
      });
    } catch (error) {
      console.error(' Error listing sandboxes:', error);
      return [];
    }
  }

  async stopSandbox(sandboxId: string): Promise<boolean> {
    try {
      console.log('🛑 Attempting to stop sandbox:', sandboxId);
      
      // Use the static kill method directly
      const killed = await Sandbox.kill(sandboxId, {
        apiKey: process.env.E2B_API_KEY
      });
      
      if (killed) {
        console.log('✅ Successfully stopped sandbox:', sandboxId);
        // Remove from our cache if it exists
        SandboxClient.sandboxes.delete(sandboxId);
      } else {
        console.log('⚠️ Sandbox not found or already stopped:', sandboxId);
      }
      
      return killed;
    } catch (error) {
      console.error('❌ Error stopping sandbox:', error);
      return false;
    }
  }

  async runCode(sandbox: Sandbox, code: string): Promise<SandboxResponse> {
    try {
      const execution = await sandbox.runCode(code);
      return {
        success: true,
        output: Array.isArray(execution.logs.stdout) ? execution.logs.stdout.join('\n') : execution.logs.stdout
      };
    } catch (error) {
      console.error('Error running code:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
}
