// Logging
export const LOG_PREFIX = '[COPILOT-MCP]';

// Error messages
export const ERROR_MESSAGES = {
  TOOL_NOT_FOUND: 'not found in registry',
  NO_PROMPT_PROVIDED:
    "Please provide a prompt for analysis. Use @ syntax to include files (e.g., '@largefile.js explain what this does') or ask general questions",
  QUOTA_EXCEEDED: 'Rate limit exceeded',
  AUTHENTICATION_FAILED: 'Authentication failed - please check your OpenAI API key or login status',
  COPILOT_NOT_FOUND:
    "GitHub Copilot CLI not found - please install with 'npm install -g @github/copilot'",
  SANDBOX_VIOLATION: 'Operation blocked by sandbox policy',
  UNSAFE_COMMAND: 'Command requires approval or elevated permissions',
} as const;

// Status messages
export const STATUS_MESSAGES = {
  COPILOT_RESPONSE: 'Copilot response:',
  AUTHENTICATION_SUCCESS: '✅ Authentication successful',
  // Timeout prevention messages
  PROCESSING_START: '🔍 Starting analysis (may take 5-15 minutes for large codebases)',
  PROCESSING_CONTINUE: '⏳ Still processing...',
  PROCESSING_COMPLETE: '✅ Analysis completed successfully',
} as const;

// MCP Protocol Constants
export const PROTOCOL = {
  // Message roles
  ROLES: {
    USER: 'user',
    ASSISTANT: 'assistant',
  },
  // Content types
  CONTENT_TYPES: {
    TEXT: 'text',
  },
  // Status codes
  STATUS: {
    SUCCESS: 'success',
    ERROR: 'error',
    FAILED: 'failed',
    REPORT: 'report',
  },
  // Notification methods
  NOTIFICATIONS: {
    PROGRESS: 'notifications/progress',
  },
  // Timeout prevention
  KEEPALIVE_INTERVAL: 25000, // 25 seconds
} as const;

// Environment Variables
export const ENV = {
  COPILOT_MODEL: 'COPILOT_MODEL', // Default model for Copilot CLI (e.g., "claude-sonnet-4.5", "gpt-4o")
  HTTPS_PROXY: 'HTTPS_PROXY',
  HTTP_PROXY: 'HTTP_PROXY',
} as const;

// CLI Constants
export const CLI = {
  // Command names
  COMMANDS: {
    COPILOT: 'copilot',
    ECHO: 'echo',
  },
  // Command flags
  FLAGS: {
    PROMPT: '-p',
    HELP: '--help',
    VERSION: '--version',
    MODEL: '--model', // Model selection (v0.0.329+)
    ADD_DIR: '--add-dir',
    ALLOW_ALL_TOOLS: '--allow-all-tools',
    ALLOW_TOOL: '--allow-tool',
    DENY_TOOL: '--deny-tool',
    DISABLE_MCP_SERVER: '--disable-mcp-server',
    LOG_DIR: '--log-dir',
    LOG_LEVEL: '--log-level',
    NO_COLOR: '--no-color',
    RESUME: '--resume',
    CONTINUE: '--continue', // Resume most recent session (v0.0.336+)
    SCREEN_READER: '--screen-reader',
    BANNER: '--banner',
  },
  // Available models (v0.0.329+)
  MODELS: {
    GPT_5: 'gpt-5',
    CLAUDE_SONNET_4: 'claude-sonnet-4',
    CLAUDE_SONNET_4_5: 'claude-sonnet-4.5',
  },
  // Default values
  DEFAULTS: {
    MODEL: process.env.COPILOT_MODEL || undefined, // Use env var or let Copilot CLI choose default
    BOOLEAN_TRUE: 'true',
    BOOLEAN_FALSE: 'false',
  },
} as const;

// Tool Arguments interface
export interface ToolArguments {
  prompt?: string;
  message?: string; // For Ping tool

  // New parameters from resource implementation
  timeout?: number; // Execution timeout
  includeThinking?: boolean; // Include reasoning in response
  includeMetadata?: boolean; // Include metadata in response

  // Copilot CLI parameters
  model?: string; // AI model to use (e.g., "claude-sonnet-4.5", "gpt-4o")
  addDir?: string | string[];
  allowAllTools?: boolean;
  allowTool?: string | string[];
  denyTool?: string | string[];
  disableMcpServer?: string | string[];
  logDir?: string;
  logLevel?: string;
  noColor?: boolean;
  resume?: string | boolean;
  continue?: boolean; // Resume most recent session (v0.0.336+)
  screenReader?: boolean;
  banner?: boolean;

  // Brainstorming tool
  methodology?: string; // Brainstorming framework to use
  domain?: string; // Domain context for specialized brainstorming
  constraints?: string; // Known limitations or requirements
  existingContext?: string; // Background information to build upon
  ideaCount?: number; // Target number of ideas to generate
  includeAnalysis?: boolean; // Include feasibility and impact analysis

  [key: string]: string | boolean | number | string[] | Record<string, any> | undefined; // Allow additional properties
}
