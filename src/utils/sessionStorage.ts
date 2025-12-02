/**
 * Session storage for multi-turn conversations
 * Provides workspace-isolated session management with automatic cleanup
 */

import { createHash } from 'crypto';
import { Logger } from './logger.js';
import { SESSION } from '../constants.js';

/**
 * Session data structure
 */
export interface Session {
  id: string;
  workspaceId: string;
  workingDir: string;
  model?: string;
  copilotConversationId?: string; // For --resume support
  history: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
  }>;
  createdAt: Date;
  lastActivityAt: Date;
}

/**
 * Session statistics
 */
export interface SessionStats {
  activeCount: number;
  maxSessions: number;
  ttlHours: number;
  sessionsWithResume: number;
}

// In-memory session storage
const sessions = new Map<string, Session>();

/**
 * Generate a workspace ID from working directory and optional git info
 * Uses MD5 hash truncated to 12 characters
 */
export function generateWorkspaceId(workingDir: string, gitHead?: string): string {
  const input = gitHead ? `${workingDir}:${gitHead}` : workingDir;
  const hash = createHash('md5').update(input).digest('hex');
  return hash.substring(0, SESSION.WORKSPACE_ID_LENGTH);
}

/**
 * Generate a unique session ID
 */
function generateSessionId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `sess_${timestamp}_${random}`;
}

/**
 * Check if a session has expired
 */
function isSessionExpired(session: Session): boolean {
  const now = Date.now();
  const ttlMs = SESSION.TTL_HOURS * 60 * 60 * 1000;
  return now - session.lastActivityAt.getTime() > ttlMs;
}

/**
 * Cleanup expired sessions and enforce max session limit
 */
function cleanupSessions(): void {
  const now = Date.now();
  const ttlMs = SESSION.TTL_HOURS * 60 * 60 * 1000;

  // Remove expired sessions
  for (const [id, session] of sessions) {
    if (now - session.lastActivityAt.getTime() > ttlMs) {
      sessions.delete(id);
      Logger.debug(`Removed expired session: ${id}`);
    }
  }

  // Enforce max sessions by removing oldest
  if (sessions.size > SESSION.MAX_SESSIONS) {
    const sortedSessions = Array.from(sessions.entries()).sort(
      ([, a], [, b]) => a.lastActivityAt.getTime() - b.lastActivityAt.getTime()
    );

    const toRemove = sortedSessions.slice(0, sessions.size - SESSION.MAX_SESSIONS);
    for (const [id] of toRemove) {
      sessions.delete(id);
      Logger.debug(`Removed oldest session to enforce limit: ${id}`);
    }
  }
}

/**
 * Get or create a session for the given workspace
 * @param workingDir - Working directory for the session
 * @param sessionId - Optional specific session ID to retrieve
 * @param model - Optional model to use
 */
export function getOrCreateSession(
  workingDir: string,
  sessionId?: string,
  model?: string
): Session {
  cleanupSessions();

  // If specific session ID provided, try to get it
  if (sessionId) {
    const existingSession = sessions.get(sessionId);
    if (existingSession && !isSessionExpired(existingSession)) {
      existingSession.lastActivityAt = new Date();
      Logger.debug(`Resumed existing session: ${sessionId}`);
      return existingSession;
    }
    Logger.debug(`Session ${sessionId} not found or expired, creating new`);
  }

  // Try to find existing session for this workspace
  const workspaceId = generateWorkspaceId(workingDir);
  for (const session of sessions.values()) {
    if (session.workspaceId === workspaceId && !isSessionExpired(session)) {
      session.lastActivityAt = new Date();
      Logger.debug(`Found existing session for workspace: ${session.id}`);
      return session;
    }
  }

  // Create new session
  const newSession: Session = {
    id: generateSessionId(),
    workspaceId,
    workingDir,
    model,
    history: [],
    createdAt: new Date(),
    lastActivityAt: new Date(),
  };

  sessions.set(newSession.id, newSession);
  Logger.debug(`Created new session: ${newSession.id} for workspace: ${workspaceId}`);

  return newSession;
}

/**
 * Save/update a session
 */
export function saveSession(session: Session): void {
  session.lastActivityAt = new Date();
  sessions.set(session.id, session);
  cleanupSessions();
}

/**
 * Add a message to session history
 */
export function addToSessionHistory(
  sessionId: string,
  role: 'user' | 'assistant',
  content: string
): void {
  const session = sessions.get(sessionId);
  if (session) {
    session.history.push({
      role,
      content,
      timestamp: new Date(),
    });
    session.lastActivityAt = new Date();
    Logger.debug(`Added ${role} message to session ${sessionId}`);
  }
}

/**
 * Get a session by ID
 */
export function getSession(sessionId: string): Session | undefined {
  const session = sessions.get(sessionId);
  if (session && !isSessionExpired(session)) {
    return session;
  }
  return undefined;
}

/**
 * Get session by workspace directory
 */
export function getSessionByWorkspace(workingDir: string): Session | undefined {
  const workspaceId = generateWorkspaceId(workingDir);
  for (const session of sessions.values()) {
    if (session.workspaceId === workspaceId && !isSessionExpired(session)) {
      return session;
    }
  }
  return undefined;
}

/**
 * Get all active sessions
 */
export function getAllSessions(): Session[] {
  cleanupSessions();
  return Array.from(sessions.values()).filter(s => !isSessionExpired(s));
}

/**
 * Delete a specific session
 */
export function deleteSession(sessionId: string): boolean {
  const existed = sessions.has(sessionId);
  sessions.delete(sessionId);
  if (existed) {
    Logger.debug(`Deleted session: ${sessionId}`);
  }
  return existed;
}

/**
 * Clear all sessions
 */
export function clearAllSessions(): number {
  const count = sessions.size;
  sessions.clear();
  Logger.debug(`Cleared all ${count} sessions`);
  return count;
}

/**
 * Set Copilot conversation ID for resume capability
 */
export function setCopilotConversationId(sessionId: string, conversationId: string): void {
  const session = sessions.get(sessionId);
  if (session) {
    session.copilotConversationId = conversationId;
    session.lastActivityAt = new Date();
    Logger.debug(`Set conversation ID for session ${sessionId}: ${conversationId}`);
  }
}

/**
 * Parse conversation ID from Copilot CLI output
 * Looks for patterns like "conversation: abc123" or similar
 */
export function parseConversationIdFromOutput(output: string): string | undefined {
  // Try various patterns that Copilot CLI might use
  const patterns = [
    /conversation[:\s]+([a-zA-Z0-9_-]+)/i,
    /session[:\s]+([a-zA-Z0-9_-]+)/i,
    /resume[:\s]+([a-zA-Z0-9_-]+)/i,
  ];

  for (const pattern of patterns) {
    const match = output.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return undefined;
}

/**
 * Get session statistics
 */
export function getSessionStats(): SessionStats {
  const activeSessions = getAllSessions();
  return {
    activeCount: activeSessions.length,
    maxSessions: SESSION.MAX_SESSIONS,
    ttlHours: SESSION.TTL_HOURS,
    sessionsWithResume: activeSessions.filter(s => s.copilotConversationId).length,
  };
}

/**
 * Check if sessions are near capacity
 */
export function isNearCapacity(): boolean {
  return sessions.size >= SESSION.MAX_SESSIONS * 0.9;
}
