// import 'dotenv/config';
// import { Sandbox, Filesystem } from '@e2b/code-interpreter';

// interface SandboxResponse {
//   success: boolean;
//   error?: string;
//   output?: string;
// }

// interface SandboxInfo {
//   id: string;
//   status: string;
//   createdAt: Date;
//   url?: string;
// }

// export class SandboxClient {
//   private static sandboxes: Map<string, { sandbox: Sandbox; createdAt: Date }> = new Map();
//   private static readonly TEMPLATE_ID = 't17n6duf3p68x33j98x4';

//   constructor() {
//     if (!process.env.E2B_API_KEY) {
//       throw new Error('Missing E2B_API_KEY in environment variables');
//     }
//   }

//   async createSandbox(): Promise<Sandbox> {
//     try {
//       console.log(' Creating sandbox...');
//       const sandbox = await Sandbox.create({
//         apiKey: process.env.E2B_API_KEY
//       });

//       const sandboxId = sandbox.sandboxId;
//       console.log(' Created sandbox with ID:', sandboxId);

//       if (!sandboxId) {
//         throw new Error('Sandbox created but no ID was returned');
//       }

//       SandboxClient.sandboxes.set(sandboxId, {
//         sandbox,
//         createdAt: new Date()
//       });

//       return sandbox;
//     } catch (error) {
//       console.error(' Detailed error creating sandbox:', error);
//       throw error;
//     }
//   }

//   async startSandbox(): Promise<SandboxInfo> {
//     try {
//       const sandbox = await Sandbox.create(SandboxClient.TEMPLATE_ID);
//       const id = Math.random().toString(36).substring(7);

//       // Get the sandbox URL for port 5173 (SvelteKit default port)
//       const host = sandbox.getHost(5173);
//       const url = `https://${host}`;
//       console.log('🌐 Sandbox URL:', url);

//       SandboxClient.sandboxes.set(id, {
//         sandbox,
//         createdAt: new Date(),
//       });

//       return {
//         success: true,
//         id,
//         status: 'running',
//         createdAt: new Date(),
//         url: url,
//       };
//     } catch (error) {
//       console.error('Failed to start sandbox:', error);
//       throw error;
//     }
//   }

//   async listSandboxes(): Promise<SandboxInfo[]> {
//     try {
//       // Get all active sandboxes from E2B
//       const activeSandboxes = await Sandbox.list({
//         apiKey: process.env.E2B_API_KEY
//       });

//       // Update our local cache with any new sandboxes
//       for (const sandboxInfo of activeSandboxes) {
//         if (!SandboxClient.sandboxes.has(sandboxInfo.sandboxId)) {
//           const sandbox = await Sandbox.connect(sandboxInfo.sandboxId, {
//             apiKey: process.env.E2B_API_KEY
//           });
//           SandboxClient.sandboxes.set(sandboxInfo.sandboxId, {
//             sandbox,
//             createdAt: new Date(sandboxInfo.startedAt)
//           });
//         }
//       }

//       // Remove any sandboxes that are no longer active
//       for (const [id] of SandboxClient.sandboxes) {
//         if (!activeSandboxes.find(s => s.sandboxId === id)) {
//           SandboxClient.sandboxes.delete(id);
//         }
//       }

//       // Map sandbox data ensuring all fields are present
//       return activeSandboxes.map(sandbox => {
//         console.log('Mapping sandbox:', sandbox);
//         const sandboxInstance = SandboxClient.sandboxes.get(sandbox.sandboxId);
//         return {
//           id: sandbox.sandboxId || '',
//           status: sandbox.name || 'unknown',
//           createdAt: sandbox.startedAt ? new Date(sandbox.startedAt) : new Date(),
//           url: sandboxInstance ? `https://${sandboxInstance.sandbox.getHost(5173)}` : undefined
//         };
//       });
//     } catch (error) {
//       console.error(' Error listing sandboxes:', error);
//       return [];
//     }
//   }

//   async stopSandbox(sandboxId: string): Promise<boolean> {
//     try {
//       console.log('🛑 Attempting to stop sandbox:', sandboxId);

//       // Use the static kill method directly
//       const killed = await Sandbox.kill(sandboxId, {
//         apiKey: process.env.E2B_API_KEY
//       });

//       if (killed) {
//         console.log('✅ Successfully stopped sandbox:', sandboxId);
//         // Remove from our cache if it exists
//         SandboxClient.sandboxes.delete(sandboxId);
//       } else {
//         console.log('⚠️ Sandbox not found or already stopped:', sandboxId);
//       }

//       return killed;
//     } catch (error) {
//       console.error('❌ Error stopping sandbox:', error);
//       return false;
//     }
//   }

//   async getSandboxInstance(sandboxId: string): Promise<Sandbox> {
//     // First check our cache
//     const cached = SandboxClient.sandboxes.get(sandboxId);
//     if (cached) {
//       return cached.sandbox;
//     }

//     // If not in cache, connect to it
//     const sandbox = await Sandbox.connect(sandboxId, {
//       apiKey: process.env.E2B_API_KEY
//     });

//     // Add to cache
//     SandboxClient.sandboxes.set(sandboxId, {
//       sandbox,
//       createdAt: new Date()
//     });

//     return sandbox;
//   }

//   async readFile(sandboxId: string, path: string): Promise<string> {
//     try {
//       const sandbox = await this.getSandboxInstance(sandboxId);
//       return await sandbox.files.read(path);
//     } catch (error) {
//       console.error('Error reading file:', error);
//       throw error;
//     }
//   }

//   async writeFile(sandboxId: string, path: string, content: string): Promise<void> {
//     try {
//       const sandbox = await this.getSandboxInstance(sandboxId);
//       await sandbox.files.write(path, content);
//     } catch (error) {
//       console.error('Error writing file:', error);
//       throw error;
//     }
//   }

//   async runCode(sandbox: Sandbox, code: string): Promise<SandboxResponse> {
//     try {
//       const execution = await sandbox.runCode(code);
//       return {
//         success: true,
//         output: Array.isArray(execution.logs.stdout) ? execution.logs.stdout.join('\n') : execution.logs.stdout
//       };
//     } catch (error) {
//       console.error('Error running code:', error);
//       return {
//         success: false,
//         error: error instanceof Error ? error.message : String(error)
//       };
//     }
//   }
// }
