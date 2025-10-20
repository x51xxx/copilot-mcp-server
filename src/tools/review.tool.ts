import { z } from 'zod';
import { UnifiedTool } from './registry.js';
import { executeCopilot, LogLevel } from '../utils/copilotExecutor.js';
import { formatCopilotResponseForMCP } from '../utils/outputParser.js';
import { ERROR_MESSAGES, STATUS_MESSAGES } from '../constants.js';

const reviewArgsSchema = z.object({
  target: z.string().min(1).describe('Target files/directories to review'),
  reviewType: z
    .enum([
      'code-quality',
      'security',
      'performance',
      'best-practices',
      'architecture',
      'testing',
      'documentation',
      'accessibility',
      'comprehensive',
    ])
    .default('comprehensive')
    .describe('Type of review to perform'),
  model: z
    .string()
    .optional()
    .describe(
      "AI model to use: 'gpt-5', 'claude-sonnet-4', or 'claude-sonnet-4.5'. Defaults to COPILOT_MODEL env var"
    ),
  severity: z
    .enum(['low', 'medium', 'high', 'critical'])
    .optional()
    .describe('Minimum severity level to report'),
  outputFormat: z
    .enum(['markdown', 'json', 'text'])
    .default('markdown')
    .describe('Output format for the review'),
  includeFixSuggestions: z.boolean().default(true).describe('Include specific fix suggestions'),
  includePriorityRanking: z.boolean().default(true).describe('Include priority ranking for issues'),
  excludePatterns: z.array(z.string()).default([]).describe('File patterns to exclude'),
  maxIssues: z.number().min(1).max(100).default(20).describe('Maximum number of issues to report'),
  addDir: z
    .union([z.string(), z.array(z.string())])
    .optional()
    .describe('Directories to grant access'),
  timeout: z.number().optional().describe('Maximum execution time in milliseconds'),
  allowAllTools: z.boolean().default(true).describe('Allow all tools for comprehensive analysis'),
  resume: z
    .union([z.string(), z.boolean()])
    .optional()
    .describe('Resume from a previous session (optionally specify session ID)'),
  continue: z.boolean().optional().describe('Resume the most recent session'),
  workingDir: z
    .string()
    .optional()
    .describe(
      'Working directory for command execution. Falls back to COPILOT_MCP_CWD env var or process.cwd()'
    ),
});

export const reviewTool: UnifiedTool = {
  name: 'review',
  description:
    'Comprehensive code review using GitHub Copilot CLI with multiple review types (security, performance, quality, etc.) and detailed reporting',
  zodSchema: reviewArgsSchema,
  prompt: {
    description: 'Perform comprehensive code review with GitHub Copilot CLI',
  },
  category: 'copilot',
  execute: async (args, onProgress) => {
    const {
      target,
      reviewType,
      model,
      severity,
      outputFormat,
      includeFixSuggestions,
      includePriorityRanking,
      excludePatterns,
      maxIssues,
      addDir,
      timeout,
      allowAllTools,
      resume,
      continue: continueSession,
      workingDir,
    } = args;

    if (!target || typeof target !== 'string' || !target.trim()) {
      throw new Error('Please provide target files/directories to review');
    }

    onProgress?.(STATUS_MESSAGES.PROCESSING_START);
    onProgress?.(`🔍 Starting ${reviewType} review of ${target}...`);

    try {
      // Build comprehensive review prompt
      let reviewPrompt = `Please perform a ${reviewType} code review of ${target}.`;

      // Add review-specific instructions
      switch (reviewType) {
        case 'security':
          reviewPrompt += ` Focus on security vulnerabilities, authentication issues, input validation, XSS, SQL injection, CSRF, and secure coding practices.`;
          break;
        case 'performance':
          reviewPrompt += ` Focus on performance bottlenecks, inefficient algorithms, memory usage, caching opportunities, and optimization potential.`;
          break;
        case 'code-quality':
          reviewPrompt += ` Focus on code structure, readability, maintainability, SOLID principles, design patterns, and clean code practices.`;
          break;
        case 'best-practices':
          reviewPrompt += ` Focus on language-specific best practices, conventions, idiomatic code, and industry standards.`;
          break;
        case 'architecture':
          reviewPrompt += ` Focus on system design, component coupling, separation of concerns, scalability, and architectural patterns.`;
          break;
        case 'testing':
          reviewPrompt += ` Focus on test coverage, test quality, test patterns, edge cases, and testing best practices.`;
          break;
        case 'documentation':
          reviewPrompt += ` Focus on code documentation, comments, README files, API documentation, and knowledge sharing.`;
          break;
        case 'accessibility':
          reviewPrompt += ` Focus on web accessibility (WCAG), semantic HTML, ARIA attributes, keyboard navigation, and inclusive design.`;
          break;
        case 'comprehensive':
          reviewPrompt += ` Perform a comprehensive review covering security, performance, code quality, best practices, and architecture.`;
          break;
      }

      // Add filtering instructions
      if (severity) {
        reviewPrompt += ` Only report issues of ${severity} severity or higher.`;
      }

      const patterns = excludePatterns as string[];
      if (patterns && patterns.length > 0) {
        reviewPrompt += ` Exclude files matching these patterns: ${patterns.join(', ')}.`;
      }

      reviewPrompt += ` Limit to top ${maxIssues} most important issues.`;

      // Add output format instructions
      if (includeFixSuggestions) {
        reviewPrompt += ` For each issue, provide specific fix suggestions with code examples where applicable.`;
      }

      if (includePriorityRanking) {
        reviewPrompt += ` Rank issues by priority (Critical, High, Medium, Low) and impact.`;
      }

      // Add format instructions
      switch (outputFormat) {
        case 'json':
          reviewPrompt += ` Format the response as structured JSON with issues array containing: {type, severity, file, line, description, suggestion, priority}.`;
          break;
        case 'markdown':
          reviewPrompt += ` Format the response as a well-structured Markdown report with sections, code blocks, and clear headings.`;
          break;
        case 'text':
          reviewPrompt += ` Format the response as clear, readable text with numbered issues and structured sections.`;
          break;
      }

      // Always include summary for better review quality
      reviewPrompt += ` Include a summary section with statistics, key findings, and overall assessment.`;

      // Execute review with Copilot
      const result = await executeCopilot(
        reviewPrompt,
        {
          model: model as string,
          addDir: addDir as string | string[],
          allowAllTools: allowAllTools as boolean,
          resume: resume as string | boolean,
          continue: continueSession as boolean,
          timeoutMs: (timeout as number) || 300000, // 5 minutes default for reviews
          workingDir: workingDir as string,
        },
        progress => onProgress?.(`🔍 ${progress.slice(0, 100)}...`)
      );

      onProgress?.(STATUS_MESSAGES.PROCESSING_COMPLETE);

      // Format and return the review
      const formattedResult = formatCopilotResponseForMCP(result, true, true);

      const reviewTypeStr = reviewType as string;
      const excludePatternsList = excludePatterns as string[];
      return `# ${reviewTypeStr.charAt(0).toUpperCase() + reviewTypeStr.slice(1)} Code Review Report

**Target:** \`${target}\`
**Review Type:** ${reviewTypeStr}
**Generated:** ${new Date().toISOString()}
${severity ? `**Min Severity:** ${severity}` : ''}
${excludePatternsList && excludePatternsList.length ? `**Excluded Patterns:** ${excludePatternsList.join(', ')}` : ''}

---

${formattedResult}

---

**GitHub Copilot CLI Review completed** ✨`;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      // Enhanced error handling for review operations
      if (errorMessage.includes('not found') || errorMessage.includes('command not found')) {
        return `❌ **Copilot CLI Not Found**: ${ERROR_MESSAGES.COPILOT_NOT_FOUND}

**Quick Fix:**
\`\`\`bash
npm install -g @github/copilot-cli
\`\`\``;
      }

      if (errorMessage.includes('directory') || errorMessage.includes('access')) {
        return `❌ **Directory Access Error**: ${errorMessage}

**Solutions:**
1. Grant access to target directory: \`addDir: "${(target as string).replace('@', '')}"\`
2. Grant workspace access: \`workingDir: process.cwd()\`
3. Use relative paths from working directory`;
      }

      if (errorMessage.includes('timeout')) {
        return `❌ **Review Timeout**: Large codebase review took longer than expected

**Solutions:**
1. Increase timeout: \`timeout: 600000\` (10 minutes)
2. Review smaller sections: Break down the target into smaller directories
3. Use specific file targets instead of large directories`;
      }

      // Generic error response
      return `❌ **Review Error**: ${errorMessage}

**Debug Steps:**
1. Verify target exists: Check if \`${target}\` is accessible
2. Verify Copilot CLI: \`copilot --version\`
3. Check directory permissions: Ensure read access to target files
4. Try a smaller scope: Review individual files first`;
    }
  },
};
