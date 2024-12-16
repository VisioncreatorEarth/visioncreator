import 'dotenv/config';
import { Sandbox } from '@e2b/code-interpreter';

interface SandboxResponse {
  success: boolean;
  output?: string;
  error?: string;
}

export class SandboxClient {
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
      console.log(' Sandbox created');
      return sandbox;
    } catch (error) {
      console.error(' Detailed error creating sandbox:', error);
      throw error;
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
