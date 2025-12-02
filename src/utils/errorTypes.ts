/**
 * Structured error handling system for CLI operations
 * Provides error classification, user-friendly messages, and retry logic
 */

import { Logger } from './logger.js';

/**
 * Error categories for CLI operations
 */
export enum ErrorCategory {
  CLI_NOT_FOUND = 'cli_not_found',
  AUTHENTICATION = 'authentication',
  RATE_LIMIT = 'rate_limit',
  TIMEOUT = 'timeout',
  SANDBOX = 'sandbox',
  NETWORK = 'network',
  SESSION = 'session',
  UNKNOWN = 'unknown',
}

/**
 * User-friendly error titles for each category
 */
const ERROR_TITLES: Record<ErrorCategory, string> = {
  [ErrorCategory.CLI_NOT_FOUND]: 'CLI Not Found',
  [ErrorCategory.AUTHENTICATION]: 'Authentication Error',
  [ErrorCategory.RATE_LIMIT]: 'Rate Limit Exceeded',
  [ErrorCategory.TIMEOUT]: 'Operation Timeout',
  [ErrorCategory.SANDBOX]: 'Sandbox Violation',
  [ErrorCategory.NETWORK]: 'Network Error',
  [ErrorCategory.SESSION]: 'Session Error',
  [ErrorCategory.UNKNOWN]: 'Unknown Error',
};

/**
 * User-friendly error descriptions and suggestions for each category
 */
const ERROR_SOLUTIONS: Record<ErrorCategory, { description: string; suggestion: string }> = {
  [ErrorCategory.CLI_NOT_FOUND]: {
    description: 'GitHub Copilot CLI is not installed or not in PATH.',
    suggestion: 'Install with: npm install -g @github/copilot-cli',
  },
  [ErrorCategory.AUTHENTICATION]: {
    description: 'Authentication failed or credentials are invalid.',
    suggestion: 'Run "copilot" to login interactively, or check your GitHub credentials.',
  },
  [ErrorCategory.RATE_LIMIT]: {
    description: 'Too many requests have been made in a short period.',
    suggestion: 'Wait a few minutes before trying again.',
  },
  [ErrorCategory.TIMEOUT]: {
    description: 'The operation took too long to complete.',
    suggestion: 'Try again with a shorter prompt or smaller file set.',
  },
  [ErrorCategory.SANDBOX]: {
    description: 'The operation was blocked by sandbox or permission restrictions.',
    suggestion: 'Use --allow-tool or --allow-all-tools to grant necessary permissions.',
  },
  [ErrorCategory.NETWORK]: {
    description: 'A network error occurred while communicating with the service.',
    suggestion: 'Check your internet connection and try again.',
  },
  [ErrorCategory.SESSION]: {
    description: 'Session management error occurred.',
    suggestion: 'Try creating a new session or clearing existing sessions.',
  },
  [ErrorCategory.UNKNOWN]: {
    description: 'An unexpected error occurred.',
    suggestion: 'Check the error details and try again.',
  },
};

/**
 * Custom error class for CLI operations with structured metadata
 */
export class CLIError extends Error {
  readonly category: ErrorCategory;
  readonly originalError?: Error;
  readonly context?: Record<string, any>;
  readonly timestamp: Date;

  constructor(
    message: string,
    category: ErrorCategory,
    originalError?: Error,
    context?: Record<string, any>
  ) {
    super(message);
    this.name = 'CLIError';
    this.category = category;
    this.originalError = originalError;
    this.context = context;
    this.timestamp = new Date();

    // Maintain proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, CLIError);
    }
  }

  /**
   * Get a user-friendly string representation of the error
   */
  toUserFriendlyString(): string {
    const title = ERROR_TITLES[this.category];
    const { description, suggestion } = ERROR_SOLUTIONS[this.category];

    let result = `${title}: ${this.message}`;
    if (description) {
      result += `\n${description}`;
    }
    if (suggestion) {
      result += `\nSuggestion: ${suggestion}`;
    }
    return result;
  }

  /**
   * Get a markdown-formatted representation of the error
   */
  toMarkdown(): string {
    const title = ERROR_TITLES[this.category];
    const { description, suggestion } = ERROR_SOLUTIONS[this.category];

    let md = `## ${title}\n\n`;
    md += `**Error:** ${this.message}\n\n`;

    if (description) {
      md += `**Description:** ${description}\n\n`;
    }

    if (suggestion) {
      md += `**Suggestion:** ${suggestion}\n\n`;
    }

    if (this.context && Object.keys(this.context).length > 0) {
      md += `**Context:**\n`;
      for (const [key, value] of Object.entries(this.context)) {
        md += `- ${key}: ${JSON.stringify(value)}\n`;
      }
      md += '\n';
    }

    return md;
  }

  /**
   * Convert to a plain object for serialization
   */
  toJSON(): Record<string, any> {
    return {
      name: this.name,
      message: this.message,
      category: this.category,
      timestamp: this.timestamp.toISOString(),
      context: this.context,
      stack: this.stack,
    };
  }
}

/**
 * Classify an error message into an ErrorCategory
 */
export function classifyError(message: string): ErrorCategory {
  const lowerMessage = message.toLowerCase();

  // CLI not found
  if (
    lowerMessage.includes('command not found') ||
    lowerMessage.includes('not found') ||
    lowerMessage.includes('enoent') ||
    lowerMessage.includes('is not recognized')
  ) {
    return ErrorCategory.CLI_NOT_FOUND;
  }

  // Authentication errors
  if (
    lowerMessage.includes('authentication') ||
    lowerMessage.includes('unauthorized') ||
    lowerMessage.includes('401') ||
    lowerMessage.includes('login') ||
    lowerMessage.includes('credentials') ||
    lowerMessage.includes('token')
  ) {
    return ErrorCategory.AUTHENTICATION;
  }

  // Rate limiting
  if (
    lowerMessage.includes('rate limit') ||
    lowerMessage.includes('quota') ||
    lowerMessage.includes('429') ||
    lowerMessage.includes('too many requests')
  ) {
    return ErrorCategory.RATE_LIMIT;
  }

  // Timeout errors
  if (
    lowerMessage.includes('timeout') ||
    lowerMessage.includes('timed out') ||
    lowerMessage.includes('etimedout') ||
    lowerMessage.includes('took too long')
  ) {
    return ErrorCategory.TIMEOUT;
  }

  // Sandbox/permission errors
  if (
    lowerMessage.includes('sandbox') ||
    lowerMessage.includes('permission') ||
    lowerMessage.includes('denied') ||
    lowerMessage.includes('not allowed') ||
    lowerMessage.includes('blocked') ||
    (lowerMessage.includes('tool') && lowerMessage.includes('denied'))
  ) {
    return ErrorCategory.SANDBOX;
  }

  // Network errors
  if (
    lowerMessage.includes('network') ||
    lowerMessage.includes('econnrefused') ||
    lowerMessage.includes('econnreset') ||
    lowerMessage.includes('enotfound') ||
    lowerMessage.includes('socket') ||
    lowerMessage.includes('connection')
  ) {
    return ErrorCategory.NETWORK;
  }

  // Session errors
  if (
    lowerMessage.includes('session') ||
    lowerMessage.includes('resume') ||
    lowerMessage.includes('conversation')
  ) {
    return ErrorCategory.SESSION;
  }

  return ErrorCategory.UNKNOWN;
}

/**
 * Create a CLIError from any error type
 */
export function createCLIError(error: unknown, context?: Record<string, any>): CLIError {
  if (error instanceof CLIError) {
    // If already a CLIError, optionally add context
    if (context) {
      return new CLIError(error.message, error.category, error.originalError, {
        ...error.context,
        ...context,
      });
    }
    return error;
  }

  if (error instanceof Error) {
    const category = classifyError(error.message);
    return new CLIError(error.message, category, error, context);
  }

  // Handle string errors
  if (typeof error === 'string') {
    const category = classifyError(error);
    return new CLIError(error, category, undefined, context);
  }

  // Handle unknown error types
  const message = String(error);
  const category = classifyError(message);
  return new CLIError(message, category, undefined, context);
}

/**
 * Format an error for user display
 */
export function formatErrorForUser(error: unknown): string {
  const cliError = createCLIError(error);
  return cliError.toUserFriendlyString();
}

/**
 * Check if an error category is retryable
 */
export function isRetryableError(category: ErrorCategory): boolean {
  return [ErrorCategory.RATE_LIMIT, ErrorCategory.TIMEOUT, ErrorCategory.NETWORK].includes(
    category
  );
}

/**
 * Get retry delay for an error category with exponential backoff
 * @param category - Error category
 * @param attempt - Current attempt number (1-based)
 * @returns Delay in milliseconds
 */
export function getRetryDelay(category: ErrorCategory, attempt: number): number {
  // Base delays per category
  const baseDelays: Partial<Record<ErrorCategory, number>> = {
    [ErrorCategory.RATE_LIMIT]: 60000, // 60 seconds for rate limits
    [ErrorCategory.TIMEOUT]: 5000, // 5 seconds for timeouts
    [ErrorCategory.NETWORK]: 10000, // 10 seconds for network issues
  };

  const baseDelay = baseDelays[category] || 5000;

  // Exponential backoff: baseDelay * 2^(attempt-1)
  const exponentialDelay = baseDelay * Math.pow(2, attempt - 1);

  // Add jitter (±20%) to prevent thundering herd
  const jitter = exponentialDelay * 0.2 * (Math.random() * 2 - 1);

  // Cap at 5 minutes
  const maxDelay = 5 * 60 * 1000;
  return Math.min(exponentialDelay + jitter, maxDelay);
}

/**
 * Log a CLIError with appropriate severity
 */
export function logCLIError(error: CLIError): void {
  const severity = isRetryableError(error.category) ? 'warn' : 'error';

  if (severity === 'warn') {
    Logger.warn(`[${error.category}] ${error.message}`, error.context);
  } else {
    Logger.error(`[${error.category}] ${error.message}`, error.context);
  }
}
