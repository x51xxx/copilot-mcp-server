import { executeCommand, executeCommandDetailed, RetryOptions } from './commandExecutor.js';
import { Logger } from './logger.js';
import { CLI } from '../constants.js';
import { writeFileSync, unlinkSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { randomBytes } from 'crypto';

// Type-safe enums for Copilot CLI
export enum LogLevel {
  Error = 'error',
  Warning = 'warning', 
  Info = 'info',
  Debug = 'debug',
  All = 'all',
  Default = 'default',
  None = 'none'
}

export interface CopilotExecOptions {
  readonly addDir?: string | string[];
  readonly allowAllTools?: boolean;
  readonly allowTool?: string | string[];
  readonly denyTool?: string | string[];
  readonly disableMcpServer?: string | string[];
  readonly logDir?: string;
  readonly logLevel?: LogLevel;
  readonly noColor?: boolean;
  readonly resume?: string | boolean; // session ID or true for latest
  readonly screenReader?: boolean;
  readonly banner?: boolean;
  readonly workingDir?: string;
  readonly timeoutMs?: number;
  readonly maxOutputBytes?: number;
  readonly retry?: RetryOptions;
  readonly useStdinForLongPrompts?: boolean; // Use stdin for prompts > 100KB
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
  
  // Build command arguments
  if (options?.addDir) {
    const dirs = Array.isArray(options.addDir) ? options.addDir : [options.addDir];
    for (const dir of dirs) {
      args.push('--add-dir', dir);
    }
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
    const servers = Array.isArray(options.disableMcpServer) ? options.disableMcpServer : [options.disableMcpServer];
    for (const server of servers) {
      args.push('--disable-mcp-server', server);
    }
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
    if (typeof options.resume === 'string') {
      args.push('--resume', options.resume);
    } else {
      args.push('--resume');
    }
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
    const result = await executeCommandDetailed(
      CLI.COMMANDS.COPILOT, 
      args, 
      {
        onProgress,
        timeoutMs: options?.timeoutMs,
        maxOutputBytes: options?.maxOutputBytes,
        retry: options?.retry
      }
    );
    
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
 * High-level executeCopilot function with comprehensive options support
 */
export async function executeCopilot(
  prompt: string,
  options?: CopilotExecOptions & { [key: string]: any },
  onProgress?: (newOutput: string) => void
): Promise<string> {
  const args: string[] = [];

  // Directory access control
  if (options?.addDir || options?.workingDir) {
    const dirs: string[] = [];
    if (options.addDir) {
      dirs.push(...(Array.isArray(options.addDir) ? options.addDir : [options.addDir]));
    }
    if (options.workingDir) {
      dirs.push(options.workingDir);
    }
    
    for (const dir of dirs) {
      args.push('--add-dir', dir);
    }
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
    const servers = Array.isArray(options.disableMcpServer) ? options.disableMcpServer : [options.disableMcpServer];
    for (const server of servers) {
      args.push('--disable-mcp-server', server);
    }
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

  if (options?.resume) {
    if (typeof options.resume === 'string') {
      args.push('--resume', options.resume);
    } else {
      args.push('--resume');
    }
  }

  // Add the prompt
  args.push('-p', prompt);

  try {
    const timeoutMs = options?.timeoutMs || 600000; // 10 minutes default

    const result = await executeCommandDetailed(
      CLI.COMMANDS.COPILOT,
      args,
      {
        onProgress,
        timeoutMs,
        maxOutputBytes: options?.maxOutputBytes,
        retry: options?.retry
      }
    );

    if (!result.ok) {
      // Enhanced error handling with specific messages
      const errorMessage = result.stderr || 'Unknown error';

      if (errorMessage.includes('command not found') || errorMessage.includes('not found')) {
        throw new Error('Copilot CLI not found. Install with: npm install -g @github/copilot-cli');
      }

      if (errorMessage.includes('authentication') || errorMessage.includes('unauthorized') || errorMessage.includes('login')) {
        throw new Error('Authentication failed. Run "copilot --help" to see login options');
      }

      if (errorMessage.includes('quota') || errorMessage.includes('rate limit')) {
        throw new Error('Rate limit exceeded. Please wait and try again');
      }

      if (errorMessage.includes('permission') || errorMessage.includes('tool') || errorMessage.includes('denied')) {
        throw new Error(`Tool permission denied. Try adjusting --allow-tool or --allow-all-tools: ${errorMessage}`);
      }

      if (errorMessage.includes('directory') || errorMessage.includes('access')) {
        throw new Error(`Directory access denied. Use --add-dir to grant access: ${errorMessage}`);
      }

      throw new Error(`Copilot CLI failed: ${errorMessage}`);
    }

    return result.stdout;
  } catch (error) {
    Logger.error('Copilot execution failed:', error);
    throw error;
  }
}