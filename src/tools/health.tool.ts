/**
 * Health diagnostics tool for checking Copilot CLI status
 * Verifies installation, authentication, and feature availability
 */

import { z } from 'zod';
import { UnifiedTool } from './registry.js';
import { executeCommandDetailed } from '../utils/commandExecutor.js';
import { CLI } from '../constants.js';
import { getSessionStats, getAllSessions, getSession } from '../utils/sessionStorage.js';
import { Logger } from '../utils/logger.js';

/**
 * Health check arguments schema
 */
const healthArgsSchema = z.object({
  sessionId: z.string().optional().describe('Check specific session health'),
  verbose: z
    .boolean()
    .optional()
    .default(false)
    .describe('Include detailed diagnostic information'),
});

type HealthArgs = z.infer<typeof healthArgsSchema>;

/**
 * Health status structure
 */
interface HealthStatus {
  cli: {
    installed: boolean;
    version?: string;
    authenticated: boolean;
    authError?: string;
  };
  features: {
    resume: boolean;
    availableModels: string[];
  };
  sessions: {
    activeCount: number;
    maxSessions: number;
    ttlHours: number;
    sessionsWithResume: number;
  };
  session?: {
    id: string;
    workspaceId: string;
    workingDir: string;
    model?: string;
    hasConversationId: boolean;
    historyLength: number;
    createdAt: string;
    lastActivityAt: string;
  };
}

/**
 * Check if Copilot CLI is installed and get version
 */
async function checkCLIInstallation(): Promise<{ installed: boolean; version?: string }> {
  try {
    const result = await executeCommandDetailed(CLI.COMMANDS.COPILOT, ['--version'], {
      timeoutMs: 10000,
    });

    if (result.ok) {
      // Parse version from output (e.g., "copilot version 0.0.350")
      const versionMatch = result.stdout.match(/(\d+\.\d+\.\d+)/);
      return {
        installed: true,
        version: versionMatch ? versionMatch[1] : result.stdout.trim(),
      };
    }

    return { installed: false };
  } catch (error) {
    Logger.debug('CLI installation check failed:', error);
    return { installed: false };
  }
}

/**
 * Check authentication status by running help command
 */
async function checkAuthentication(): Promise<{ authenticated: boolean; error?: string }> {
  try {
    const result = await executeCommandDetailed(CLI.COMMANDS.COPILOT, ['--help'], {
      timeoutMs: 15000,
    });

    if (result.ok) {
      return { authenticated: true };
    }

    // Check for auth-related errors
    const stderr = result.stderr.toLowerCase();
    if (
      stderr.includes('authentication') ||
      stderr.includes('login') ||
      stderr.includes('unauthorized') ||
      stderr.includes('credentials')
    ) {
      return {
        authenticated: false,
        error: 'Authentication required. Run "copilot" interactively to login.',
      };
    }

    return { authenticated: true }; // Assume auth is ok if no auth errors
  } catch (error) {
    Logger.debug('Authentication check failed:', error);
    return {
      authenticated: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get list of available models from CLI help
 */
async function getAvailableModels(): Promise<string[]> {
  try {
    const result = await executeCommandDetailed(CLI.COMMANDS.COPILOT, ['--help'], {
      timeoutMs: 10000,
    });

    if (result.ok) {
      // Parse models from help output
      // Look for pattern like: --model <model>  (choices: "model1", "model2", ...)
      const modelMatch = result.stdout.match(/--model.*choices:\s*"([^)]+)"/i);
      if (modelMatch) {
        return modelMatch[1].split('",').map(m => m.replace(/"/g, '').trim());
      }

      // Fallback to known models
      return Object.values(CLI.MODELS);
    }

    return Object.values(CLI.MODELS);
  } catch (error) {
    Logger.debug('Failed to get available models:', error);
    return Object.values(CLI.MODELS);
  }
}

/**
 * Build complete health status
 */
async function buildHealthStatus(args: HealthArgs): Promise<HealthStatus> {
  // Check CLI installation
  const cliCheck = await checkCLIInstallation();

  // Check authentication (only if CLI is installed)
  const authCheck = cliCheck.installed
    ? await checkAuthentication()
    : { authenticated: false, error: 'CLI not installed' };

  // Get available models
  const availableModels = cliCheck.installed ? await getAvailableModels() : [];

  // Get session stats
  const sessionStats = getSessionStats();

  // Build base status
  const status: HealthStatus = {
    cli: {
      installed: cliCheck.installed,
      version: cliCheck.version,
      authenticated: authCheck.authenticated,
      authError: authCheck.error,
    },
    features: {
      resume: cliCheck.installed, // Resume is available if CLI is installed
      availableModels,
    },
    sessions: {
      activeCount: sessionStats.activeCount,
      maxSessions: sessionStats.maxSessions,
      ttlHours: sessionStats.ttlHours,
      sessionsWithResume: sessionStats.sessionsWithResume,
    },
  };

  // Add specific session info if requested
  if (args.sessionId) {
    const session = getSession(args.sessionId);
    if (session) {
      status.session = {
        id: session.id,
        workspaceId: session.workspaceId,
        workingDir: session.workingDir,
        model: session.model,
        hasConversationId: !!session.copilotConversationId,
        historyLength: session.history.length,
        createdAt: session.createdAt.toISOString(),
        lastActivityAt: session.lastActivityAt.toISOString(),
      };
    }
  }

  return status;
}

/**
 * Format health status as markdown
 */
function formatHealthReport(status: HealthStatus, verbose: boolean): string {
  let report = '# Copilot MCP Health Report\n\n';

  // CLI Status
  report += '## CLI Status\n\n';
  report += '| Check | Status |\n';
  report += '|-------|--------|\n';
  report += `| Installed | ${status.cli.installed ? '✅ Yes' : '❌ No'} |\n`;
  if (status.cli.version) {
    report += `| Version | ${status.cli.version} |\n`;
  }
  report += `| Authenticated | ${status.cli.authenticated ? '✅ Yes' : '❌ No'} |\n`;
  if (status.cli.authError) {
    report += `| Auth Error | ${status.cli.authError} |\n`;
  }
  report += '\n';

  // Features
  report += '## Features\n\n';
  report += '| Feature | Status |\n';
  report += '|---------|--------|\n';
  report += `| Resume Sessions | ${status.features.resume ? '✅ Available' : '⚠️ Not Available'} |\n`;
  report += `| Models | ${status.features.availableModels.length} available |\n`;
  report += '\n';

  if (verbose && status.features.availableModels.length > 0) {
    report += '### Available Models\n\n';
    for (const model of status.features.availableModels) {
      report += `- ${model}\n`;
    }
    report += '\n';
  }

  // Session Status
  report += '## Session Management\n\n';
  report += '| Metric | Value |\n';
  report += '|--------|-------|\n';
  report += `| Active Sessions | ${status.sessions.activeCount} / ${status.sessions.maxSessions} |\n`;
  report += `| TTL | ${status.sessions.ttlHours} hours |\n`;
  report += `| With Resume | ${status.sessions.sessionsWithResume} |\n`;
  report += '\n';

  // Specific session info
  if (status.session) {
    report += '## Session Details\n\n';
    report += '| Property | Value |\n';
    report += '|----------|-------|\n';
    report += `| ID | ${status.session.id} |\n`;
    report += `| Workspace | ${status.session.workspaceId} |\n`;
    report += `| Working Dir | ${status.session.workingDir} |\n`;
    if (status.session.model) {
      report += `| Model | ${status.session.model} |\n`;
    }
    report += `| Has Conversation ID | ${status.session.hasConversationId ? '✅ Yes' : '❌ No'} |\n`;
    report += `| History Length | ${status.session.historyLength} messages |\n`;
    report += `| Created | ${status.session.createdAt} |\n`;
    report += `| Last Activity | ${status.session.lastActivityAt} |\n`;
    report += '\n';
  }

  // Recommendations
  const recommendations: string[] = [];

  if (!status.cli.installed) {
    recommendations.push('Install GitHub Copilot CLI: `npm install -g @github/copilot-cli`');
  }

  if (!status.cli.authenticated) {
    recommendations.push('Authenticate by running `copilot` interactively');
  }

  if (status.sessions.activeCount >= status.sessions.maxSessions * 0.9) {
    recommendations.push('Session storage is near capacity. Consider clearing old sessions.');
  }

  if (recommendations.length > 0) {
    report += '## Recommendations\n\n';
    for (const rec of recommendations) {
      report += `- ${rec}\n`;
    }
    report += '\n';
  }

  return report;
}

/**
 * Health diagnostics tool
 */
export const healthTool: UnifiedTool = {
  name: 'health',
  description:
    'Check Copilot CLI health status including installation, authentication, and session management',
  zodSchema: healthArgsSchema,
  category: 'utility',

  prompt: {
    description: 'Check health status of Copilot CLI and session management',
    arguments: [
      {
        name: 'sessionId',
        description: 'Optional session ID to inspect',
        required: false,
      },
      {
        name: 'verbose',
        description: 'Include detailed information like available models',
        required: false,
      },
    ],
  },

  execute: async args => {
    try {
      const validatedArgs = healthArgsSchema.parse(args);
      const status = await buildHealthStatus(validatedArgs);
      return formatHealthReport(status, validatedArgs.verbose || false);
    } catch (error) {
      Logger.error('Health check failed:', error);

      // Return a helpful error message
      let errorReport = '# Health Check Failed\n\n';
      errorReport += `**Error:** ${error instanceof Error ? error.message : 'Unknown error'}\n\n`;
      errorReport += '## Troubleshooting\n\n';
      errorReport +=
        '1. Ensure GitHub Copilot CLI is installed: `npm install -g @github/copilot-cli`\n';
      errorReport += '2. Authenticate by running `copilot` interactively\n';
      errorReport += '3. Check your network connection\n';

      return errorReport;
    }
  },
};
