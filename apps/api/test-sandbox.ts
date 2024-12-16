import { SandboxClient } from './.wundergraph/clients/sandbox';

const testSandbox = async () => {
  try {
    console.log('🚀 Testing sandbox...');
    const client = new SandboxClient();
    const sandbox = await client.createSandbox();
    const result = await client.runCode(sandbox, 'print("Hello from sandbox!")');
    console.log('✨ Sandbox test result:', result);
  } catch (error) {
    console.error('❌ Error testing sandbox:', error);
  }
};

testSandbox().catch(console.error);