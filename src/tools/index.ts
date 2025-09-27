// Tool Registry Index - Registers all tools
import { toolRegistry } from './registry.js';
import { askTool } from './ask.tool.js';
import { batchTool } from './batch.tool.js';
import { reviewTool } from './review.tool.js';
import { pingTool, helpTool, versionTool } from './simple-tools.js';
import { brainstormTool } from './brainstorm.tool.js';
import { timeoutTestTool } from './timeout-test.tool.js';

toolRegistry.push(
  // Copilot tools
  askTool,
  batchTool,
  reviewTool,

  // Utility tools
  pingTool,
  helpTool,
  versionTool,
  brainstormTool,
  timeoutTestTool
);

export * from './registry.js';
