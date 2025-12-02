/**
 * Session management tool for listing, deleting, and managing sessions
 */

import { z } from 'zod';
import { UnifiedTool } from './registry.js';
import {
  getAllSessions,
  getSession,
  deleteSession,
  clearAllSessions,
  getSessionStats,
  Session,
} from '../utils/sessionStorage.js';
import { Logger } from '../utils/logger.js';

/**
 * List sessions arguments schema
 */
const listSessionsArgsSchema = z.object({
  action: z
    .enum(['list', 'delete', 'clear'])
    .optional()
    .default('list')
    .describe('Action to perform: list, delete, or clear'),
  sessionId: z.string().optional().describe('Session ID for delete action'),
});

type ListSessionsArgs = z.infer<typeof listSessionsArgsSchema>;

/**
 * Format a single session for display
 */
function formatSession(session: Session): string {
  const resumeStatus = session.copilotConversationId ? '✅' : '❌';
  const lastActivity = session.lastActivityAt.toISOString().replace('T', ' ').substring(0, 19);

  return `| ${session.id} | ${session.workspaceId} | ${lastActivity} | ${resumeStatus} |`;
}

/**
 * Format all sessions as a markdown table
 */
function formatSessionsList(sessions: Session[]): string {
  const stats = getSessionStats();

  let output = '# Active Sessions\n\n';

  // Stats summary
  output += `**Total:** ${stats.activeCount} / ${stats.maxSessions} | `;
  output += `**TTL:** ${stats.ttlHours}h | `;
  output += `**With Resume:** ${stats.sessionsWithResume}\n\n`;

  if (sessions.length === 0) {
    output += '*No active sessions*\n';
    return output;
  }

  // Sessions table
  output += '| Session ID | Workspace | Last Activity | Resume |\n';
  output += '|------------|-----------|---------------|--------|\n';

  for (const session of sessions) {
    output += formatSession(session) + '\n';
  }

  output += '\n';
  output += '**Resume:** ✅ = Can resume with --resume, ❌ = No conversation ID stored\n';

  return output;
}

/**
 * List sessions tool
 */
export const listSessionsTool: UnifiedTool = {
  name: 'list-sessions',
  description: 'List, delete, or clear session data for multi-turn conversations',
  zodSchema: listSessionsArgsSchema,
  category: 'utility',

  prompt: {
    description: 'Manage Copilot CLI sessions',
    arguments: [
      {
        name: 'action',
        description: 'Action: list (default), delete, or clear',
        required: false,
      },
      {
        name: 'sessionId',
        description: 'Session ID to delete (required for delete action)',
        required: false,
      },
    ],
  },

  execute: async args => {
    try {
      const validatedArgs = listSessionsArgsSchema.parse(args);
      const action = validatedArgs.action || 'list';

      switch (action) {
        case 'list': {
          const sessions = getAllSessions();
          // Sort by last activity (most recent first)
          sessions.sort((a, b) => b.lastActivityAt.getTime() - a.lastActivityAt.getTime());
          return formatSessionsList(sessions);
        }

        case 'delete': {
          if (!validatedArgs.sessionId) {
            return '**Error:** Session ID is required for delete action.\n\nUsage: `list-sessions action:delete sessionId:<id>`';
          }

          const session = getSession(validatedArgs.sessionId);
          if (!session) {
            return `**Error:** Session not found: ${validatedArgs.sessionId}\n\nUse \`list-sessions\` to see available sessions.`;
          }

          const deleted = deleteSession(validatedArgs.sessionId);
          if (deleted) {
            return `✅ Successfully deleted session: ${validatedArgs.sessionId}`;
          } else {
            return `❌ Failed to delete session: ${validatedArgs.sessionId}`;
          }
        }

        case 'clear': {
          const count = clearAllSessions();
          return `✅ Cleared ${count} session(s)`;
        }

        default:
          return `**Error:** Unknown action: ${action}. Valid actions: list, delete, clear`;
      }
    } catch (error) {
      Logger.error('List sessions failed:', error);
      return `**Error:** ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  },
};
