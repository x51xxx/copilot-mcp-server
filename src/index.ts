#!/usr/bin/env node

import { CopilotMCPServer } from './server.js';
import { Config } from './types/index.js';

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\nReceived SIGINT, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\nReceived SIGTERM, shutting down gracefully...');
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

async function main(): Promise<void> {
  try {
    // Load configuration from environment or defaults
    const config: Partial<Config> = {
      server: {
        name: process.env['MCP_SERVER_NAME'] || 'copilot-mcp-server',
        version: process.env['MCP_SERVER_VERSION'] || '1.0.0',
      },
      copilot: {
        cliPath: process.env['COPILOT_CLI_PATH'] || 'gh',
        timeout: parseInt(process.env['COPILOT_TIMEOUT'] || '30000', 10),
        maxRetries: parseInt(process.env['COPILOT_MAX_RETRIES'] || '3', 10),
        retryDelay: parseInt(process.env['COPILOT_RETRY_DELAY'] || '1000', 10),
      },
      logging: {
        level: (process.env['LOG_LEVEL'] as 'debug' | 'info' | 'warn' | 'error') || 'info',
        format: (process.env['LOG_FORMAT'] as 'json' | 'pretty') || 'pretty',
      },
    };

    // Create and start server
    const server = new CopilotMCPServer(config);
    await server.start();

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});