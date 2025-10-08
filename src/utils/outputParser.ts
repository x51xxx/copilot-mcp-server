import { Logger } from './logger.js';

// Legacy Output Interface (for backward compatibility)
export interface LegacyOutput {
  metadata: {
    version?: string;
    workdir?: string;
    model?: string;
    provider?: string;
    approval?: string;
    sandbox?: string;
    reasoning_effort?: string;
    reasoning_summaries?: string;
    [key: string]: string | undefined;
  };
  userInstructions: string;
  thinking?: string;
  response: string;
  tokensUsed?: number;
  timestamps: string[];
  rawOutput: string;
}

// Copilot Output Interface
export interface CopilotOutput {
  metadata: {
    version?: string;
    sessionId?: string;
    toolsUsed?: string[];
    directoryAccess?: string[];
    logLevel?: string;
    [key: string]: string | string[] | undefined;
  };
  prompt: string;
  thinking?: string;
  response: string;
  toolExecutions?: string[];
  rawOutput: string;
}

export function parseLegacyOutput(rawOutput: string): LegacyOutput {
  // Legacy parser for backward compatibility
  const lines = rawOutput.split('\n');
  const timestamps: string[] = [];
  let metadata: any = {};
  let userInstructions = '';
  let thinking = '';
  let response = '';
  let tokensUsed: number | undefined;

  let currentSection = 'header';
  let metadataLines: string[] = [];
  let thinkingLines: string[] = [];
  let responseLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Extract timestamps
    const timestampMatch = line.match(/^\[([^\]]+)\]/);
    if (timestampMatch) {
      timestamps.push(timestampMatch[1]);
    }

    // Extract tokens used
    const tokensMatch = line.match(/tokens used:\s*(\d+)/);
    if (tokensMatch) {
      tokensUsed = parseInt(tokensMatch[1], 10);
      continue;
    }

    // Identify sections
    if (line.includes('Copilot CLI') || line.includes('GitHub Copilot')) {
      currentSection = 'header';
      continue;
    } else if (line.startsWith('--------')) {
      if (currentSection === 'header') {
        currentSection = 'metadata';
      } else if (currentSection === 'metadata') {
        currentSection = 'content';
      }
      continue;
    } else if (line.includes('User instructions:')) {
      currentSection = 'userInstructions';
      continue;
    } else if (line.includes('thinking')) {
      currentSection = 'thinking';
      continue;
    } else if (line.includes('copilot') || line.includes('assistant')) {
      currentSection = 'response';
      continue;
    }

    // Parse based on current section
    switch (currentSection) {
      case 'metadata':
        if (line.trim()) {
          metadataLines.push(line.trim());
        }
        break;
      case 'userInstructions':
        if (line.trim() && !line.includes('User instructions:')) {
          userInstructions += line + '\n';
        }
        break;
      case 'thinking':
        if (line.trim() && !line.includes('thinking')) {
          thinkingLines.push(line);
        }
        break;
      case 'response':
      case 'content':
        if (
          line.trim() &&
          !line.includes('assistant') &&
          !line.includes('copilot') &&
          !line.includes('tokens used:')
        ) {
          responseLines.push(line);
        }
        break;
    }
  }

  // Parse metadata
  metadata = parseMetadata(metadataLines);
  thinking = thinkingLines.join('\n').trim();
  response = responseLines.join('\n').trim() || rawOutput; // Fallback to raw output if no response found
  userInstructions = userInstructions.trim();

  const output: LegacyOutput = {
    metadata,
    userInstructions,
    thinking: thinking || undefined,
    response,
    tokensUsed,
    timestamps,
    rawOutput,
  };

  Logger.copilotResponse(response, tokensUsed);
  return output;
}

function parseMetadata(metadataLines: string[]): any {
  const metadata: any = {};

  for (const line of metadataLines) {
    const colonIndex = line.indexOf(':');
    if (colonIndex > 0) {
      const key = line.substring(0, colonIndex).trim().toLowerCase().replace(/\s+/g, '_');
      const value = line.substring(colonIndex + 1).trim();
      metadata[key] = value;
    }
  }

  return metadata;
}

export function formatLegacyResponse(
  output: LegacyOutput,
  includeThinking: boolean = true,
  includeMetadata: boolean = true
): string {
  // Legacy formatter for backward compatibility
  let formatted = '';

  // Add metadata summary if requested
  if (includeMetadata && (output.metadata.model || output.metadata.sandbox)) {
    formatted += `**Copilot Configuration:**\n`;
    if (output.metadata.model) formatted += `- Model: ${output.metadata.model}\n`;
    if (output.metadata.sandbox) formatted += `- Sandbox: ${output.metadata.sandbox}\n`;
    if (output.metadata.approval) formatted += `- Approval: ${output.metadata.approval}\n`;
    formatted += '\n';
  }

  // Add thinking section if requested and available
  if (includeThinking && output.thinking) {
    formatted += `**Reasoning:**\n`;
    formatted += output.thinking + '\n\n';
  }

  // Add main response
  if (includeMetadata || includeThinking) {
    formatted += `**Response:**\n`;
  }
  formatted += output.response;

  // Add token usage if available
  if (output.tokensUsed) {
    formatted += `\n\n*Tokens used: ${output.tokensUsed}*`;
  }

  return formatted;
}

export function formatLegacyResponseForMCP(
  result: string,
  includeThinking: boolean = true,
  includeMetadata: boolean = true
): string {
  // Legacy MCP formatter
  // Try to parse the output first
  try {
    const parsed = parseLegacyOutput(result); // Legacy parsing
    return formatLegacyResponse(parsed, includeThinking, includeMetadata); // Legacy formatting
  } catch {
    // If parsing fails, return the raw output
    return result;
  }
}

export function extractCodeBlocks(text: string): string[] {
  const codeBlockRegex = /```[\s\S]*?```/g;
  const matches = text.match(codeBlockRegex);
  return matches || [];
}

export function extractDiffBlocks(text: string): string[] {
  const diffRegex = /```diff[\s\S]*?```/g;
  const matches = text.match(diffRegex);
  return matches || [];
}

export function isErrorResponse(output: CopilotOutput | LegacyOutput | string): boolean {
  const errorKeywords = [
    'error',
    'failed',
    'unable',
    'cannot',
    'authentication',
    'permission denied',
    'rate limit',
    'quota exceeded',
  ];

  const responseText =
    typeof output === 'string' ? output.toLowerCase() : output.response.toLowerCase();

  return errorKeywords.some(keyword => responseText.includes(keyword));
}

// Copilot-specific parsing functions
export function parseCopilotOutput(rawOutput: string): CopilotOutput {
  const lines = rawOutput.split('\n');
  let metadata: any = {};
  let prompt = '';
  let thinking = '';
  let response = '';
  let toolExecutions: string[] = [];

  let currentSection = 'header';
  let thinkingLines: string[] = [];
  let responseLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Extract tool executions (pattern may vary based on Copilot output format)
    if (line.includes('Executing tool:') || line.includes('Running:') || line.includes('🔧')) {
      toolExecutions.push(line.trim());
      continue;
    }

    // Identify sections - Copilot output format
    if (line.includes('GitHub Copilot') || line.includes('Copilot CLI')) {
      currentSection = 'header';
      continue;
    } else if (
      line.includes('Thinking:') ||
      line.includes('Reasoning:') ||
      line.includes('Planning:')
    ) {
      currentSection = 'thinking';
      continue;
    } else if (line.includes('Response:') || line.includes('Answer:') || line.includes('Result:')) {
      currentSection = 'response';
      continue;
    }

    // Parse based on current section
    switch (currentSection) {
      case 'thinking':
        if (
          line.trim() &&
          !line.includes('Thinking:') &&
          !line.includes('Reasoning:') &&
          !line.includes('Planning:')
        ) {
          thinkingLines.push(line);
        }
        break;
      case 'response':
        if (
          line.trim() &&
          !line.includes('Response:') &&
          !line.includes('Answer:') &&
          !line.includes('Result:')
        ) {
          responseLines.push(line);
        }
        break;
      default:
        // Try to capture everything as response if no clear sections found
        if (
          line.trim() &&
          !line.includes('GitHub Copilot') &&
          !line.includes('Copilot CLI') &&
          !line.includes('Executing tool:') &&
          !line.includes('Running:')
        ) {
          responseLines.push(line);
        }
        break;
    }
  }

  thinking = thinkingLines.join('\n').trim();
  response = responseLines.join('\n').trim() || rawOutput; // Fallback to raw output
  prompt = ''; // Copilot doesn't typically echo back the prompt

  const output: CopilotOutput = {
    metadata,
    prompt,
    thinking: thinking || undefined,
    response,
    toolExecutions,
    rawOutput,
  };

  Logger.debug('Parsed Copilot output:', { thinking: !!thinking, responseLength: response.length });
  return output;
}

export function formatCopilotResponse(
  output: CopilotOutput,
  includeThinking: boolean = true,
  includeMetadata: boolean = true
): string {
  let formatted = '';

  // Add metadata summary if requested
  if (includeMetadata && (output.toolExecutions?.length || output.metadata.sessionId)) {
    formatted += `**GitHub Copilot Session:**\n`;
    if (output.metadata.sessionId) formatted += `- Session: ${output.metadata.sessionId}\n`;
    if (output.toolExecutions?.length)
      formatted += `- Tools Used: ${output.toolExecutions.length} executions\n`;
    formatted += '\n';
  }

  // Add thinking section if requested and available
  if (includeThinking && output.thinking) {
    formatted += `**Analysis:**\n`;
    formatted += output.thinking + '\n\n';
  }

  // Add tool executions if available and metadata is requested
  if (includeMetadata && output.toolExecutions?.length) {
    formatted += `**Tool Executions:**\n`;
    output.toolExecutions.forEach(execution => {
      formatted += `- ${execution}\n`;
    });
    formatted += '\n';
  }

  // Add main response
  if (includeMetadata || includeThinking) {
    formatted += `**Response:**\n`;
  }
  formatted += output.response;

  return formatted;
}

export function formatCopilotResponseForMCP(
  result: string,
  includeThinking: boolean = true,
  includeMetadata: boolean = true
): string {
  // Try to parse the output first
  try {
    const parsed = parseCopilotOutput(result);
    return formatCopilotResponse(parsed, includeThinking, includeMetadata);
  } catch {
    // If parsing fails, return the raw output
    return result;
  }
}

// Note: Legacy functions are kept for potential future use with other CLI tools
