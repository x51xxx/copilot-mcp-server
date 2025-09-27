import { z } from 'zod';
import {
  ToolResult,
  ToolContext,
  CopilotCommand,
  CopilotResponse,
  ValidationError,
} from '../types/index.js';
import { CommandExecutor } from '../utils/index.js';
import { OutputParser } from '../utils/index.js';

const AskToolArgsSchema = z.object({
  query: z.string().min(1, 'Query cannot be empty'),
  context: z.string().optional(),
  language: z.string().optional(),
  files: z.array(z.string()).optional(),
});

type AskToolArgs = z.infer<typeof AskToolArgsSchema>;

export class AskTool {
  constructor(
    private readonly commandExecutor: CommandExecutor,
    private readonly outputParser: OutputParser
  ) {}

  async execute(args: unknown, context: ToolContext): Promise<ToolResult> {
    try {
      // Validate arguments
      const validArgs = AskToolArgsSchema.parse(args);

      // Build copilot command
      const command = this.buildCopilotCommand(validArgs);

      // Execute command
      const result = await this.commandExecutor.execute(command.command, command.args, {
        cwd: process.cwd(),
        timeout: context.config.copilot.timeout,
      });

      // Parse output
      const response = this.outputParser.parseCopilotOutput(result);

      return {
        success: result.success,
        content: this.formatResponse(response, validArgs),
        data: {
          response,
          command: command.command + ' ' + command.args.join(' '),
          duration: result.duration,
        },
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError('Invalid arguments for ask tool', error.errors);
      }

      return {
        success: false,
        content: 'Failed to execute ask command',
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  private buildCopilotCommand(args: AskToolArgs): CopilotCommand {
    const command = 'gh';
    const commandArgs = ['copilot', 'suggest'];

    // Add the main query
    commandArgs.push(args.query);

    // Add context if provided
    if (args.context) {
      commandArgs.push('--context', args.context);
    }

    // Add language if provided
    if (args.language) {
      commandArgs.push('--language', args.language);
    }

    // Add files if provided
    if (args.files && args.files.length > 0) {
      for (const file of args.files) {
        commandArgs.push('--file', file);
      }
    }

    return {
      command,
      args: commandArgs,
      description: `Ask GitHub Copilot: ${args.query}`,
    };
  }

  private formatResponse(response: CopilotResponse, args: AskToolArgs): string {
    const lines: string[] = [];

    lines.push(`🤖 GitHub Copilot Response for: "${args.query}"`);
    lines.push('');

    if (response.suggestions && response.suggestions.length > 0) {
      lines.push('📝 Suggestions:');
      response.suggestions.forEach((suggestion, index) => {
        lines.push(`${index + 1}. ${suggestion}`);
      });
      lines.push('');
    }

    if (response.output) {
      lines.push('💬 Full Response:');
      lines.push(response.output);
      lines.push('');
    }

    if (response.metadata && Object.keys(response.metadata).length > 0) {
      lines.push('ℹ️ Metadata:');
      for (const [key, value] of Object.entries(response.metadata)) {
        lines.push(`  ${key}: ${JSON.stringify(value)}`);
      }
    }

    return lines.join('\n');
  }

  getSchema(): object {
    return {
      name: 'ask',
      description: 'Ask GitHub Copilot CLI for suggestions, code help, or explanations',
      inputSchema: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'The question or request to ask GitHub Copilot',
            minLength: 1,
          },
          context: {
            type: 'string',
            description: 'Additional context to provide to Copilot',
          },
          language: {
            type: 'string',
            description: 'Programming language for code-related queries',
          },
          files: {
            type: 'array',
            items: {
              type: 'string',
            },
            description: 'List of files to include as context',
          },
        },
        required: ['query'],
      },
    };
  }
}
