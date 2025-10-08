import { z } from 'zod';
import { UnifiedTool } from './registry.js';
import { executeCommand } from '../utils/commandExecutor.js';

const pingArgsSchema = z.object({
  prompt: z.string().default('').describe('Message to echo '),
});

export const pingTool: UnifiedTool = {
  name: 'ping',
  description: 'Echo',
  zodSchema: pingArgsSchema,
  prompt: {
    description: 'Echo test message with structured response.',
  },
  category: 'simple',
  execute: async (args, onProgress) => {
    const message = args.prompt || args.message || 'Pong!';
    // Return message directly to avoid cross-platform issues with echo command
    return message as string;
  },
};

const helpArgsSchema = z.object({});

export const helpTool: UnifiedTool = {
  name: 'Help',
  description: 'receive help information for Copilot CLI',
  zodSchema: helpArgsSchema,
  prompt: {
    description: 'receive help information for available CLI tools',
  },
  category: 'simple',
  execute: async (args, onProgress) => {
    try {
      // Try Copilot CLI first (primary tool)
      const copilotHelp = await executeCommand('copilot', ['--help'], onProgress);
      return `**GitHub Copilot CLI Help:**

${copilotHelp}

---

**MCP Tools Available:**

**Primary Tools:**
- \`ask\` - Execute GitHub Copilot CLI with file analysis and tool management
- \`batch\` - Batch process multiple tasks with Copilot CLI
- \`review\` - Comprehensive code review using Copilot CLI

**Utility Tools:**
- \`brainstorm\` - AI-powered brainstorming with structured methodologies
- \`ping\` - Test connectivity and echo messages
- \`help\` - Show this help information
- \`version\` - Display system and version information
- \`timeout-test\` - Test long-running operations`;
    } catch (copilotError) {
      return `**Help Information:**

*GitHub Copilot CLI is not currently installed or accessible.*

**Available MCP Tools:**

**Primary Tools:**
- \`ask\` - Execute GitHub Copilot CLI (requires installation)
- \`batch\` - Batch process multiple tasks
- \`review\` - Comprehensive code review

**Utility Tools:**
- \`brainstorm\` - AI-powered brainstorming
- \`ping\` - Test connectivity
- \`help\` - Show this help information
- \`version\` - System information
- \`timeout-test\` - Test long-running operations

**Installation:**
- GitHub Copilot CLI: \`npm install -g @github/copilot-cli\`
- Verify: \`copilot --version\``;
    }
  },
};

const versionArgsSchema = z.object({});

export const versionTool: UnifiedTool = {
  name: 'version',
  description: 'Display version and system information for Copilot and MCP server',
  zodSchema: versionArgsSchema,
  prompt: {
    description: 'Get version information for CLI tools and MCP server',
  },
  category: 'simple',
  execute: async (args, onProgress) => {
    const nodeVersion = process.version;
    const platform = process.platform;
    let copilotVersion = 'Not installed';

    // Check Copilot CLI version
    try {
      const copilotResult = await executeCommand('copilot', ['--version'], onProgress);
      copilotVersion = copilotResult.trim();
    } catch (error) {
      // Copilot CLI not available
    }

    return `**System Information:**
- GitHub Copilot CLI: ${copilotVersion}
- Node.js: ${nodeVersion}
- Platform: ${platform}
- MCP Server: @trishchuk/copilot-mcp-server v1.0.0

**Installation Commands:**
- GitHub Copilot CLI: \`npm install -g @github/copilot-cli\`

**Primary Tools:** ask, batch, review, brainstorm`;
  },
};
