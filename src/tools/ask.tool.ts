import { z } from 'zod';
import { UnifiedTool } from './registry.js';
import { executeCopilot, CopilotExecOptions, LogLevel } from '../utils/copilotExecutor.js';
import { formatCopilotResponseForMCP } from '../utils/outputParser.js';
import { ERROR_MESSAGES } from '../constants.js';

const askArgsSchema = z.object({
  prompt: z
    .string()
    .min(1)
    .describe(
      "Task or question for GitHub Copilot CLI. Supports @ syntax for files/images (e.g., '@file.png', '@src/') and ! prefix for direct shell commands"
    ),
  model: z
    .string()
    .optional()
    .describe(
      "AI model to use: 'gpt-5', 'claude-sonnet-4', 'claude-sonnet-4.5', or 'claude-haiku-4.5' (0.33x cost). Defaults to COPILOT_MODEL env var or Copilot's default"
    ),
  addDir: z
    .union([z.string(), z.array(z.string())])
    .optional()
    .describe('Add directories to allowed list for file access'),
  allowAllTools: z
    .boolean()
    .default(true)
    .describe('Allow all tools to run automatically (required for non-interactive mode)'),
  allowTool: z
    .union([z.string(), z.array(z.string())])
    .optional()
    .describe(
      "Allow specific tools to run. Supports glob patterns (e.g., 'shell(npm run test:*)')"
    ),
  denyTool: z
    .union([z.string(), z.array(z.string())])
    .optional()
    .describe('Deny specific tools (takes precedence over allowTool)'),
  disableMcpServer: z
    .union([z.string(), z.array(z.string())])
    .optional()
    .describe('Disable specific MCP servers'),
  allowAllPaths: z
    .boolean()
    .optional()
    .describe('Automatically approve access to all file paths (use with caution)'),
  additionalMcpConfig: z
    .union([z.string(), z.record(z.any())])
    .optional()
    .describe(
      'Additional MCP server configuration (JSON string or object). Use @ prefix for file path (e.g., "@config.json")'
    ),
  logDir: z.string().optional().describe('Set log file directory'),
  logLevel: z
    .enum(['error', 'warning', 'info', 'debug', 'all', 'default', 'none'])
    .optional()
    .describe('Set the log level'),
  noColor: z.boolean().optional().describe('Disable all color output'),
  resume: z
    .union([z.string(), z.boolean()])
    .optional()
    .describe('Resume from a previous session (optionally specify session ID)'),
  continue: z.boolean().optional().describe('Resume the most recent session'),
  screenReader: z.boolean().optional().describe('Enable screen reader optimizations'),
  banner: z.boolean().optional().describe('Show the animated banner on startup'),
  timeout: z.number().optional().describe('Maximum execution time in milliseconds'),
  workingDir: z
    .string()
    .optional()
    .describe(
      'Working directory for command execution. Falls back to COPILOT_MCP_CWD env var or process.cwd()'
    ),
  // Session management
  sessionId: z.string().optional().describe('Use specific session ID for multi-turn conversations'),
  enableSessionTracking: z
    .boolean()
    .optional()
    .default(true)
    .describe('Enable session tracking for conversation persistence'),
});

export const askTool: UnifiedTool = {
  name: 'ask',
  description:
    'Execute GitHub Copilot CLI with file analysis, tool management, and safety controls',
  zodSchema: askArgsSchema,
  prompt: {
    description: 'Execute GitHub Copilot CLI with your task or question',
  },
  category: 'utility',
  execute: async (args, onProgress) => {
    const {
      prompt,
      model,
      addDir,
      allowAllTools,
      allowTool,
      denyTool,
      disableMcpServer,
      allowAllPaths,
      additionalMcpConfig,
      logDir,
      logLevel,
      noColor,
      resume,
      continue: continueSession,
      screenReader,
      banner,
      timeout,
      workingDir,
      sessionId,
      enableSessionTracking,
    } = args;

    if (!prompt?.trim()) {
      throw new Error(ERROR_MESSAGES.NO_PROMPT_PROVIDED);
    }

    try {
      const options: CopilotExecOptions = {
        model: model as string,
        addDir: addDir as string | string[],
        allowAllTools: allowAllTools as boolean,
        allowTool: allowTool as string | string[],
        denyTool: denyTool as string | string[],
        disableMcpServer: disableMcpServer as string | string[],
        allowAllPaths: allowAllPaths as boolean,
        additionalMcpConfig: additionalMcpConfig as string | Record<string, any>,
        logDir: logDir as string,
        logLevel: logLevel as LogLevel,
        noColor: noColor as boolean,
        resume: resume as string | boolean,
        continue: continueSession as boolean,
        screenReader: screenReader as boolean,
        banner: banner as boolean,
        timeoutMs: timeout as number,
        workingDir: workingDir as string,
        sessionId: sessionId as string,
        enableSessionTracking: enableSessionTracking as boolean,
      };

      const result = await executeCopilot(prompt as string, options, onProgress);

      // Format response with enhanced output parsing
      return formatCopilotResponseForMCP(result, true, true);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      // Enhanced error handling with helpful context
      if (errorMessage.includes('not found') || errorMessage.includes('command not found')) {
        return `❌ **Copilot CLI Not Found**: ${ERROR_MESSAGES.COPILOT_NOT_FOUND}

**Quick Fix:**
\`\`\`bash
npm install -g @github/copilot-cli
\`\`\`

**Verification:** Run \`copilot --version\` to confirm installation.`;
      }

      if (
        errorMessage.includes('authentication') ||
        errorMessage.includes('unauthorized') ||
        errorMessage.includes('login')
      ) {
        return `❌ **Authentication Failed**: Please log in to GitHub Copilot CLI

**Setup Options:**
1. **Interactive Login:** \`copilot /login\`
2. **Check Status:** \`copilot /user show\`

**Troubleshooting:** Verify you have an active GitHub Copilot subscription.`;
      }

      if (errorMessage.includes('quota') || errorMessage.includes('rate limit')) {
        return `❌ **Usage Limit Reached**: ${ERROR_MESSAGES.QUOTA_EXCEEDED}

**Solutions:**
1. Wait and retry - rate limits reset periodically
2. Check usage in GitHub settings`;
      }

      if (errorMessage.includes('timeout')) {
        return `❌ **Request Timeout**: Operation took longer than expected

**Solutions:**
1. Increase timeout: Add \`timeout: 300000\` (5 minutes)
2. Simplify request: Break complex queries into smaller parts`;
      }

      if (
        errorMessage.includes('tool') ||
        errorMessage.includes('permission') ||
        errorMessage.includes('denied')
      ) {
        return `❌ **Tool Permission Error**: ${errorMessage}

**Solutions:**
1. Allow all tools: \`allowAllTools: true\` (default)
2. Allow specific tools: \`allowTool: ["write", "shell"]\`
3. Check denied tools: Remove from \`denyTool\` list`;
      }

      if (errorMessage.includes('directory') || errorMessage.includes('access')) {
        return `❌ **Directory Access Error**: ${errorMessage}

**Solutions:**
1. Add directory access: \`addDir: "/path/to/directory"\`
2. Add multiple directories: \`addDir: ["/path1", "/path2"]\`
3. Use current directory: \`addDir: process.cwd()\``;
      }

      // Generic error with context
      return `❌ **Copilot Execution Error**: ${errorMessage}

**Debug Steps:**
1. Verify Copilot CLI: \`copilot --version\`
2. Check authentication: \`copilot /login\`
3. Try simpler query first`;
    }
  },
};
