import { executeCommandDetailed, RetryOptions } from './commandExecutor.js';
import { Logger } from './logger.js';
import { CLI } from '../constants.js';
import { unlinkSync, existsSync, statSync } from 'fs';
import { join, isAbsolute, dirname } from 'path';
import {
  CLIError,
  ErrorCategory,
  createCLIError,
  isRetryableError,
  getRetryDelay,
  logCLIError,
} from './errorTypes.js';
import {
  getOrCreateSession,
  saveSession,
  addToSessionHistory,
  setCopilotConversationId,
  parseConversationIdFromOutput,
} from './sessionStorage.js';

// Type-safe enums for Copilot CLI
export enum LogLevel {
  Error = 'error',
  Warning = 'warning',
  Info = 'info',
  Debug = 'debug',
  All = 'all',
  Default = 'default',
  None = 'none',
}

export interface CopilotExecOptions {
  readonly model?: string; // AI model to use (e.g., "claude-sonnet-4.5", "claude-haiku-4.5", "gpt-5")
  readonly addDir?: string | string[];
  readonly allowAllTools?: boolean;
  readonly allowTool?: string | string[];
  readonly denyTool?: string | string[];
  readonly disableMcpServer?: string | string[];
  readonly allowAllPaths?: boolean; // Approve access to all paths automatically
  readonly additionalMcpConfig?: string | Record<string, any>; // Additional MCP server config (JSON string or object)
  readonly logDir?: string;
  readonly logLevel?: LogLevel;
  readonly noColor?: boolean;
  readonly resume?: string | boolean; // session ID or true for latest
  readonly continue?: boolean; // Resume most recent session
  readonly screenReader?: boolean;
  readonly banner?: boolean;
  readonly workingDir?: string;
  readonly timeoutMs?: number;
  readonly maxOutputBytes?: number;
  readonly retry?: RetryOptions;
  readonly useStdinForLongPrompts?: boolean; // Use stdin for prompts > 100KB
  // Session management
  readonly sessionId?: string; // Use specific session for multi-turn conversations
  readonly enableSessionTracking?: boolean; // Enable session tracking (default: true)
}

/**
 * Find project root by walking up directory tree looking for markers
 * (package.json, .git, etc.)
 *
 * @param startPath - Starting path (file or directory)
 * @returns Project root directory or undefined if not found
 */
function findProjectRoot(startPath: string): string | undefined {
  let currentDir = isAbsolute(startPath) ? startPath : join(process.cwd(), startPath);

  // If startPath is a file, start from its parent directory
  if (existsSync(currentDir)) {
    const stats = statSync(currentDir);
    if (!stats.isDirectory()) {
      currentDir = dirname(currentDir);
    }
  }

  // Walk up the directory tree looking for project markers
  const projectMarkers = [
    'package.json',
    '.git',
    'pyproject.toml',
    'Cargo.toml',
    'go.mod',
    'pom.xml',
    'build.gradle',
    'composer.json',
  ];
  const maxDepth = 10; // Prevent infinite loops

  for (let i = 0; i < maxDepth; i++) {
    // Check if any project marker exists in current directory
    for (const marker of projectMarkers) {
      if (existsSync(join(currentDir, marker))) {
        Logger.debug(`Found project root at ${currentDir} (marker: ${marker})`);
        return currentDir;
      }
    }

    // Move up one directory
    const parentDir = dirname(currentDir);
    if (parentDir === currentDir) {
      // Reached filesystem root
      break;
    }
    currentDir = parentDir;
  }

  // If no project root found, return the starting directory (or its parent if it was a file)
  if (existsSync(startPath)) {
    const stats = statSync(startPath);
    const fallbackDir = stats.isDirectory() ? startPath : dirname(startPath);
    Logger.debug(`No project root found, using fallback: ${fallbackDir}`);
    return fallbackDir;
  }

  return undefined;
}

function ensureDirectory(path: string | undefined): string | undefined {
  if (!path || !existsSync(path)) {
    return undefined;
  }

  try {
    const stats = statSync(path);
    if (stats.isDirectory()) {
      return path;
    }

    const parentDir = dirname(path);
    if (parentDir !== path && existsSync(parentDir)) {
      const parentStats = statSync(parentDir);
      if (parentStats.isDirectory()) {
        return parentDir;
      }
    }
  } catch (error) {
    Logger.debug(`Failed to resolve directory for path ${path}:`, error);
  }

  return undefined;
}

/**
 * Resolve working directory with fallback chain:
 * 1. Explicit workingDir option (highest priority)
 * 2. Environment variables: COPILOT_MCP_CWD > PWD > INIT_CWD
 * 3. Infer from @path syntax in prompt (if absolute) - finds project root
 *    - Supports quoted paths with spaces: @"C:\\Users\\Jane Doe\\file.ts" or @'/path/with spaces/file.ts'
 *    - Supports unquoted paths: @/home/user/project/file.ts
 *    - Iterates through @path mentions until finding a valid absolute path
 *    - Ensures resolved paths point to directories (falls back to parent when a file is provided)
 * 4. process.cwd() (lowest priority)
 *
 * @param workingDir - Explicit working directory (optional)
 * @param prompt - Prompt text to extract @path from (optional)
 * @returns Resolved working directory path or undefined
 */
function resolveWorkingDirectory(workingDir?: string, prompt?: string): string | undefined {
  // Priority 1: Explicit option
  if (workingDir) {
    const explicitDir = ensureDirectory(workingDir);
    if (explicitDir) {
      if (explicitDir !== workingDir) {
        Logger.debug(`Resolved workingDir ${workingDir} to directory ${explicitDir}`);
      } else {
        Logger.debug(`Using explicit working directory: ${explicitDir}`);
      }
      return explicitDir;
    }
    Logger.warn(`Specified workingDir is not a directory or does not exist: ${workingDir}`);
  }

  // Priority 2: Environment variables
  const envDirCandidate = process.env.COPILOT_MCP_CWD || process.env.PWD || process.env.INIT_CWD;
  const envDir = ensureDirectory(envDirCandidate);
  if (envDir) {
    if (envDirCandidate && envDirCandidate !== envDir) {
      Logger.debug(`Resolved environment working directory ${envDirCandidate} to ${envDir}`);
    } else {
      Logger.debug(`Using environment variable working directory: ${envDir}`);
    }
    return envDir;
  }

  // Priority 3: Infer from @path syntax in prompt
  if (prompt) {
    const atPathRegex = /@(?:"([^"]+)"|'([^']+)'|([^\s"'@]+))/g;
    for (const match of prompt.matchAll(atPathRegex)) {
      const pathCandidate = match[1] ?? match[2] ?? match[3];
      if (!pathCandidate) {
        continue;
      }

      const absolutePath = pathCandidate.trim();
      if (!isAbsolute(absolutePath) || !existsSync(absolutePath)) {
        continue;
      }

      const projectRoot = findProjectRoot(absolutePath);
      const projectDir = ensureDirectory(projectRoot);
      if (projectDir) {
        Logger.debug(`Inferred working directory from @path: ${projectDir}`);
        return projectDir;
      }

      const fallbackDir = ensureDirectory(absolutePath);
      if (fallbackDir) {
        Logger.debug(`Using @path directory fallback: ${fallbackDir}`);
        return fallbackDir;
      }
    }
  }

  // Priority 4: Current working directory
  const cwd = process.cwd();
  Logger.debug(`Using process.cwd() as working directory: ${cwd}`);
  return cwd;
}

/**
 * Execute Copilot CLI with enhanced error handling and memory efficiency
 */
export async function executeCopilotCLI(
  prompt: string,
  options?: CopilotExecOptions,
  onProgress?: (newOutput: string) => void
): Promise<string> {
  const args: string[] = [];

  // Resolve working directory with fallback chain
  const cwd = resolveWorkingDirectory(options?.workingDir, prompt);

  // Model selection (prioritize: explicit param > env var > default)
  const model = options?.model || process.env.COPILOT_MODEL;
  if (model) {
    args.push('--model', model);
  }

  // Build command arguments - auto-add cwd if not already in addDir
  const addDirs = new Set<string>();
  if (options?.addDir) {
    const dirs = Array.isArray(options.addDir) ? options.addDir : [options.addDir];
    dirs.forEach(dir => addDirs.add(dir));
  }
  // Auto-add working directory for file access
  if (cwd) {
    addDirs.add(cwd);
  }
  for (const dir of addDirs) {
    args.push('--add-dir', dir);
  }

  if (options?.allowAllTools) {
    args.push('--allow-all-tools');
  } else {
    // Add specific tool allowances
    if (options?.allowTool) {
      const tools = Array.isArray(options.allowTool) ? options.allowTool : [options.allowTool];
      for (const tool of tools) {
        args.push('--allow-tool', tool);
      }
    }
  }

  if (options?.denyTool) {
    const tools = Array.isArray(options.denyTool) ? options.denyTool : [options.denyTool];
    for (const tool of tools) {
      args.push('--deny-tool', tool);
    }
  }

  if (options?.disableMcpServer) {
    const servers = Array.isArray(options.disableMcpServer)
      ? options.disableMcpServer
      : [options.disableMcpServer];
    for (const server of servers) {
      args.push('--disable-mcp-server', server);
    }
  }

  if (options?.allowAllPaths) {
    args.push('--allow-all-paths');
  }

  if (options?.additionalMcpConfig) {
    const config =
      typeof options.additionalMcpConfig === 'string'
        ? options.additionalMcpConfig
        : JSON.stringify(options.additionalMcpConfig);
    args.push('--additional-mcp-config', config);
  }

  if (options?.banner) {
    args.push('--banner');
  }

  if (options?.logDir) {
    args.push('--log-dir', options.logDir);
  }

  if (options?.logLevel) {
    args.push('--log-level', options.logLevel);
  }

  if (options?.noColor) {
    args.push('--no-color');
  }

  if (options?.screenReader) {
    args.push('--screen-reader');
  }

  if (options?.resume) {
    args.push('--resume');
  }

  if (options?.continue) {
    args.push('--continue');
  }

  // Add the prompt using -p/--prompt flag
  args.push('-p', prompt);

  // Check if prompt is too long for command line (OS dependent, ~100KB is safe)
  const promptSizeBytes = Buffer.byteLength(prompt, 'utf8');
  const useStdin = options?.useStdinForLongPrompts !== false && promptSizeBytes > 100 * 1024;

  let tempFile: string | undefined;

  try {
    if (useStdin) {
      // For very long prompts, we might need to use a different approach
      // since Copilot CLI uses -p flag rather than stdin
      Logger.warn(`Large prompt detected (${promptSizeBytes} bytes), may hit command line limits`);
    }

    // Use detailed execution for better error handling
    const result = await executeCommandDetailed(CLI.COMMANDS.COPILOT, args, {
      onProgress,
      timeoutMs: options?.timeoutMs,
      maxOutputBytes: options?.maxOutputBytes,
      retry: options?.retry,
      cwd, // Set working directory for command execution
    });

    if (!result.ok) {
      // Try to salvage partial output if available
      if (result.partialStdout && result.partialStdout.length > 1000) {
        Logger.warn('Command failed but partial output available, attempting to use it');
        return result.partialStdout;
      }

      const errorMessage = result.stderr || 'Unknown error';
      throw new Error(
        result.timedOut
          ? `Copilot CLI timed out after ${options?.timeoutMs || 600000}ms`
          : `Copilot CLI failed with exit code ${result.code}: ${errorMessage}`
      );
    }

    return result.stdout;
  } catch (error) {
    Logger.error('Copilot CLI execution failed:', error);
    throw error;
  } finally {
    // Clean up temp file if used
    if (tempFile) {
      try {
        unlinkSync(tempFile);
      } catch (e) {
        Logger.debug('Failed to delete temp file:', e);
      }
    }
  }
}

/**
 * Execution result with session info
 */
export interface CopilotExecResult {
  output: string;
  sessionId?: string;
  conversationId?: string;
}

/**
 * High-level executeCopilot function with comprehensive options support
 */
export async function executeCopilot(
  prompt: string,
  options?: CopilotExecOptions & { [key: string]: any },
  onProgress?: (newOutput: string) => void
): Promise<string> {
  const args: string[] = [];

  // Resolve working directory with fallback chain
  const cwd = resolveWorkingDirectory(options?.workingDir, prompt);

  // Session management
  const enableSessionTracking = options?.enableSessionTracking !== false;
  let session =
    enableSessionTracking && cwd
      ? getOrCreateSession(cwd, options?.sessionId, options?.model)
      : undefined;

  // Model selection (prioritize: explicit param > env var > default)
  const model = options?.model || process.env.COPILOT_MODEL;
  if (model) {
    args.push('--model', model);
  }

  // Directory access control - auto-add cwd if not already in addDir
  const addDirs = new Set<string>();
  if (options?.addDir) {
    const dirs = Array.isArray(options.addDir) ? options.addDir : [options.addDir];
    dirs.forEach(dir => addDirs.add(dir));
  }
  // Auto-add working directory for file access
  if (cwd) {
    addDirs.add(cwd);
  }
  for (const dir of addDirs) {
    args.push('--add-dir', dir);
  }

  // Tool permissions - default to allow all tools for non-interactive mode
  if (options?.allowAllTools !== false) {
    args.push('--allow-all-tools');
  } else {
    if (options?.allowTool) {
      const tools = Array.isArray(options.allowTool) ? options.allowTool : [options.allowTool];
      for (const tool of tools) {
        args.push('--allow-tool', tool);
      }
    }
  }

  if (options?.denyTool) {
    const tools = Array.isArray(options.denyTool) ? options.denyTool : [options.denyTool];
    for (const tool of tools) {
      args.push('--deny-tool', tool);
    }
  }

  // Other options
  if (options?.disableMcpServer) {
    const servers = Array.isArray(options.disableMcpServer)
      ? options.disableMcpServer
      : [options.disableMcpServer];
    for (const server of servers) {
      args.push('--disable-mcp-server', server);
    }
  }

  if (options?.allowAllPaths) {
    args.push('--allow-all-paths');
  }

  if (options?.additionalMcpConfig) {
    const config =
      typeof options.additionalMcpConfig === 'string'
        ? options.additionalMcpConfig
        : JSON.stringify(options.additionalMcpConfig);
    args.push('--additional-mcp-config', config);
  }

  if (options?.logDir) {
    args.push('--log-dir', options.logDir);
  }

  if (options?.logLevel) {
    args.push('--log-level', options.logLevel);
  }

  if (options?.noColor) {
    args.push('--no-color');
  }

  if (options?.banner) {
    args.push('--banner');
  }

  if (options?.screenReader) {
    args.push('--screen-reader');
  }

  // Resume support - always use --resume without ID (Copilot CLI manages sessions internally)
  if (options?.resume) {
    args.push('--resume');
  }

  if (options?.continue) {
    args.push('--continue');
  }

  // Add the prompt
  args.push('-p', prompt);

  try {
    const timeoutMs = options?.timeoutMs || 600000; // 10 minutes default

    // Track user prompt in session
    if (session) {
      addToSessionHistory(session.id, 'user', prompt);
    }

    const result = await executeCommandDetailed(CLI.COMMANDS.COPILOT, args, {
      onProgress,
      timeoutMs,
      maxOutputBytes: options?.maxOutputBytes,
      retry: options?.retry,
      cwd, // Set working directory for command execution
    });

    if (!result.ok) {
      // Create structured error
      const errorMessage = result.stderr || 'Unknown error';
      const context = {
        command: CLI.COMMANDS.COPILOT,
        exitCode: result.code,
        timedOut: result.timedOut,
        workingDir: cwd,
      };

      const cliError = createCLIError(new Error(errorMessage), context);
      logCLIError(cliError);

      throw cliError;
    }

    // Track assistant response in session
    if (session) {
      addToSessionHistory(session.id, 'assistant', result.stdout);

      // Try to extract conversation ID for resume capability
      const conversationId = parseConversationIdFromOutput(result.stdout);
      if (conversationId) {
        setCopilotConversationId(session.id, conversationId);
      }

      saveSession(session);
    }

    return result.stdout;
  } catch (error) {
    // Convert to CLIError if not already
    const cliError = error instanceof CLIError ? error : createCLIError(error);
    logCLIError(cliError);
    throw cliError;
  }
}

/**
 * Execute Copilot with full result including session info
 */
export async function executeCopilotWithSession(
  prompt: string,
  options?: CopilotExecOptions & { [key: string]: any },
  onProgress?: (newOutput: string) => void
): Promise<CopilotExecResult> {
  const cwd = resolveWorkingDirectory(options?.workingDir, prompt);
  const enableSessionTracking = options?.enableSessionTracking !== false;
  const session =
    enableSessionTracking && cwd
      ? getOrCreateSession(cwd, options?.sessionId, options?.model)
      : undefined;

  const output = await executeCopilot(prompt, { ...options, sessionId: session?.id }, onProgress);

  return {
    output,
    sessionId: session?.id,
    conversationId: session?.copilotConversationId,
  };
}

// Re-export error types for convenience
export { CLIError, ErrorCategory, createCLIError, isRetryableError, getRetryDelay };
