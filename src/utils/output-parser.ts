import { CopilotResponse, CommandResult } from '../types/index.js';

export class OutputParser {
  /**
   * Parse GitHub Copilot CLI output into structured response
   */
  parseCopilotOutput(result: CommandResult): CopilotResponse {
    const output = result.stdout || result.stderr;

    // Try to extract suggestions from copilot output
    const suggestions = this.extractSuggestions(output);

    // Extract metadata if available
    const metadata = this.extractMetadata(output);

    return {
      output: output.trim(),
      suggestions,
      metadata,
    };
  }

  /**
   * Extract code suggestions from copilot output
   */
  private extractSuggestions(output: string): string[] {
    const suggestions: string[] = [];

    // Look for code blocks or numbered suggestions
    const codeBlockRegex = /```[\s\S]*?```/g;
    const codeBlocks = output.match(codeBlockRegex);

    if (codeBlocks) {
      suggestions.push(...codeBlocks.map((block) => block.replace(/```\w*\n?|\n?```/g, '').trim()));
    }

    // Look for numbered suggestions
    const numberedRegex = /^\d+\.\s+(.+)$/gm;
    let match;
    while ((match = numberedRegex.exec(output)) !== null) {
      suggestions.push(match[1]?.trim() ?? '');
    }

    // Look for bullet point suggestions
    const bulletRegex = /^[-*•]\s+(.+)$/gm;
    while ((match = bulletRegex.exec(output)) !== null) {
      suggestions.push(match[1]?.trim() ?? '');
    }

    return [...new Set(suggestions)].filter((s) => s.length > 0);
  }

  /**
   * Extract metadata from copilot output
   */
  private extractMetadata(output: string): Record<string, unknown> {
    const metadata: Record<string, unknown> = {};

    // Extract file paths
    const filePathRegex = /(?:file|path):\s*([^\s\n]+)/gi;
    let match;
    const filePaths: string[] = [];
    while ((match = filePathRegex.exec(output)) !== null) {
      if (match[1]) {
        filePaths.push(match[1]);
      }
    }
    if (filePaths.length > 0) {
      metadata['filePaths'] = filePaths;
    }

    // Extract line numbers
    const lineNumberRegex = /line\s*(\d+)/gi;
    const lineNumbers: number[] = [];
    while ((match = lineNumberRegex.exec(output)) !== null) {
      if (match[1]) {
        lineNumbers.push(parseInt(match[1], 10));
      }
    }
    if (lineNumbers.length > 0) {
      metadata['lineNumbers'] = lineNumbers;
    }

    // Extract language hints
    const languageRegex = /language:\s*(\w+)/gi;
    match = languageRegex.exec(output);
    if (match?.[1]) {
      metadata['language'] = match[1];
    }

    return metadata;
  }

  /**
   * Parse error messages from command output
   */
  parseError(result: CommandResult): string {
    let errorMessage = '';

    if (result.stderr) {
      errorMessage = result.stderr;
    } else if (!result.success && result.stdout) {
      // Sometimes errors come through stdout
      errorMessage = result.stdout;
    } else if (result.exitCode !== 0) {
      errorMessage = `Command failed with exit code ${result.exitCode}`;
    }

    // Clean up common error patterns
    errorMessage = errorMessage
      .replace(/^error:\s*/i, '')
      .replace(/^fatal:\s*/i, '')
      .trim();

    return errorMessage || 'Unknown error occurred';
  }

  /**
   * Format command result for display
   */
  formatResult(result: CommandResult, includeMetadata = true): string {
    const parts: string[] = [];

    if (result.success) {
      parts.push('✅ Command executed successfully');
    } else {
      parts.push('❌ Command failed');
    }

    if (result.stdout) {
      parts.push(`Output:\n${result.stdout}`);
    }

    if (result.stderr && !result.success) {
      parts.push(`Error:\n${result.stderr}`);
    }

    if (includeMetadata) {
      parts.push(`Duration: ${result.duration}ms`);
      parts.push(`Exit Code: ${result.exitCode}`);
    }

    return parts.join('\n\n');
  }
}
