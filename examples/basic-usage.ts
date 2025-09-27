#!/usr/bin/env tsx

/**
 * Basic usage example for Copilot MCP Server
 */

import { CopilotMCPServer } from '../src/server.js';
import { Config } from '../src/types/index.js';

async function basicUsageExample(): Promise<void> {
  console.log('🚀 Starting Copilot MCP Server Example');
  
  const config: Partial<Config> = {
    server: { name: 'example-server', version: '1.0.0' },
    copilot: { cliPath: 'gh', timeout: 30000, maxRetries: 2 },
    logging: { level: 'info', format: 'pretty' },
  };

  const server = new CopilotMCPServer(config);

  try {
    console.log('📝 Example: Ask Tool');
    const askTool = server.getTools().get('ask');
    if (askTool) {
      const progress = server.getProgressTracker().create(
        'ask-example', 'Ask example', ['execute']
      );
      
      const result = await askTool.execute({
        query: 'How do I create a simple HTTP server in Node.js?',
        language: 'typescript',
      }, { progress, config: server.getConfig() });
      
      console.log('Result:', result.content);
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  basicUsageExample().catch(console.error);
}

export { basicUsageExample };