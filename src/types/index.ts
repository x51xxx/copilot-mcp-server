import { z } from 'zod';

// Basic configuration types
export const ConfigSchema = z.object({
  server: z.object({
    name: z.string().default('copilot-mcp-server'),
    version: z.string().default('1.0.0'),
    port: z.number().optional(),
    host: z.string().optional(),
  }),
  copilot: z.object({
    cliPath: z.string().default('gh'),
    timeout: z.number().default(30000),
    maxRetries: z.number().default(3),
    retryDelay: z.number().default(1000),
  }),
  logging: z.object({
    level: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
    format: z.enum(['json', 'pretty']).default('pretty'),
  }),
});

export type Config = z.infer<typeof ConfigSchema>;

// Command execution types
export interface CommandResult {
  success: boolean;
  stdout: string;
  stderr: string;
  exitCode: number;
  duration: number;
  command: string;
}

export interface ExecutionOptions {
  timeout?: number;
  cwd?: string;
  env?: Record<string, string>;
  maxRetries?: number;
  retryDelay?: number;
}

// Progress tracking types
export interface ProgressStep {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startTime?: Date;
  endTime?: Date;
  error?: string;
  output?: string;
}

export interface Progress {
  id: string;
  name: string;
  steps: ProgressStep[];
  startTime: Date;
  endTime?: Date;
  status: 'running' | 'completed' | 'failed';
}

// MCP Tool types
export interface ToolContext {
  progress: Progress;
  config: Config;
}

export interface ToolResult {
  success: boolean;
  content: string;
  data?: unknown;
  error?: string;
}

// GitHub Copilot CLI types
export interface CopilotCommand {
  command: string;
  args: string[];
  description?: string;
}

export interface CopilotResponse {
  output: string;
  suggestions?: string[];
  metadata?: Record<string, unknown>;
}

// Batch operation types
export interface BatchTask {
  id: string;
  name: string;
  command: CopilotCommand;
  dependencies?: string[];
}

export interface BatchResult {
  taskId: string;
  result: ToolResult;
  duration: number;
}

// Review types
export interface CodeReviewOptions {
  files: string[];
  focusAreas?: string[];
  severity?: 'low' | 'medium' | 'high';
  language?: string;
}

export interface ReviewFinding {
  file: string;
  line: number;
  column?: number;
  severity: 'info' | 'warning' | 'error';
  message: string;
  suggestion?: string;
  category: string;
}

export interface ReviewResult {
  findings: ReviewFinding[];
  summary: string;
  score?: number;
  recommendations: string[];
}

// Brainstorm types
export interface BrainstormPrompt {
  topic: string;
  context?: string;
  constraints?: string[];
  goals?: string[];
}

export interface BrainstormIdea {
  id: string;
  title: string;
  description: string;
  feasibility: number;
  impact: number;
  complexity: number;
  tags: string[];
}

export interface BrainstormResult {
  ideas: BrainstormIdea[];
  summary: string;
  nextSteps: string[];
}

// Error types
export class MCPServerError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'MCPServerError';
  }
}

export class CommandExecutionError extends MCPServerError {
  constructor(message: string, public readonly command: string, details?: unknown) {
    super(message, 'COMMAND_EXECUTION_ERROR', details);
    this.name = 'CommandExecutionError';
  }
}

export class ValidationError extends MCPServerError {
  constructor(message: string, details?: unknown) {
    super(message, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }
}