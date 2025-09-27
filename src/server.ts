import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { Config, ConfigSchema, ToolContext, ValidationError } from './types/index.js';
import { CommandExecutor, OutputParser } from './utils/index.js';
import { ProgressTracker } from './services/index.js';
import { AskTool, BatchTool, ReviewTool, BrainstormTool } from './tools/index.js';

export class CopilotMCPServer {
  private server: Server;
  private config: Config;
  private commandExecutor: CommandExecutor;
  private outputParser: OutputParser;
  private progressTracker: ProgressTracker;
  private tools: Map<string, any> = new Map();

  constructor(config: Partial<Config> = {}) {
    // Validate and merge configuration with defaults
    const defaultConfig: Config = {
      server: {
        name: 'copilot-mcp-server',
        version: '1.0.0',
      },
      copilot: {
        cliPath: 'gh',
        timeout: 30000,
        maxRetries: 3,
        retryDelay: 1000,
      },
      logging: {
        level: 'info',
        format: 'pretty',
      },
    };

    this.config = ConfigSchema.parse({
      server: { ...defaultConfig.server, ...config.server },
      copilot: { ...defaultConfig.copilot, ...config.copilot },
      logging: { ...defaultConfig.logging, ...config.logging },
    });

    // Initialize components
    this.commandExecutor = new CommandExecutor(this.config);
    this.outputParser = new OutputParser();
    this.progressTracker = new ProgressTracker();

    // Initialize MCP server
    this.server = new Server(
      {
        name: this.config.server.name,
        version: this.config.server.version,
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    // Initialize tools
    this.initializeTools();

    // Setup handlers
    this.setupHandlers();

    // Setup progress tracking
    this.setupProgressTracking();
  }

  private initializeTools(): void {
    const askTool = new AskTool(this.commandExecutor, this.outputParser);
    const batchTool = new BatchTool(this.commandExecutor, this.outputParser);
    const reviewTool = new ReviewTool(this.commandExecutor, this.outputParser);
    const brainstormTool = new BrainstormTool(this.commandExecutor, this.outputParser);

    this.tools.set('ask', askTool);
    this.tools.set('batch', batchTool);
    this.tools.set('review', reviewTool);
    this.tools.set('brainstorm', brainstormTool);
  }

  private setupHandlers(): void {
    // List tools handler
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      const toolSchemas = [];
      
      for (const [name, tool] of this.tools) {
        try {
          const schema = tool.getSchema();
          toolSchemas.push(schema);
        } catch (error) {
          this.logError(`Failed to get schema for tool ${name}:`, error);
        }
      }

      return {
        tools: toolSchemas,
      };
    });

    // Call tool handler
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      
      try {
        const tool = this.tools.get(name);
        if (!tool) {
          throw new McpError(
            ErrorCode.MethodNotFound,
            `Unknown tool: ${name}`
          );
        }

        // Create progress tracking for this tool execution
        const progressId = this.generateProgressId();
        const progress = this.progressTracker.create(
          progressId,
          `Execute ${name} tool`,
          ['validation', 'execution', 'formatting']
        );

        const context: ToolContext = {
          progress,
          config: this.config,
        };

        // Start execution
        this.progressTracker.startStep(progressId, progress.steps[0]?.id || '');
        
        try {
          const result = await tool.execute(args, context);
          
          this.progressTracker.completeStep(
            progressId,
            progress.steps[0]?.id || '',
            'Tool executed successfully'
          );

          return {
            content: [
              {
                type: 'text',
                text: result.content,
              },
            ],
          };
        } catch (toolError) {
          this.progressTracker.failStep(
            progressId,
            progress.steps[0]?.id || '',
            toolError instanceof Error ? toolError.message : String(toolError)
          );
          throw toolError;
        }
      } catch (error) {
        this.logError(`Error executing tool ${name}:`, error);
        
        if (error instanceof ValidationError) {
          throw new McpError(
            ErrorCode.InvalidParams,
            `Validation error: ${error.message}`,
            error.details
          );
        }
        
        if (error instanceof McpError) {
          throw error;
        }
        
        throw new McpError(
          ErrorCode.InternalError,
          `Failed to execute tool: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    });
  }

  private setupProgressTracking(): void {
    // Add progress listener for logging
    this.progressTracker.addListener((progress) => {
      if (this.config.logging.level === 'debug') {
        this.logInfo(`Progress update: ${progress.name} - ${progress.status}`);
      }
    });

    // Cleanup old progress items every hour
    setInterval(() => {
      this.progressTracker.cleanup();
    }, 60 * 60 * 1000);
  }

  private generateProgressId(): string {
    return `progress-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  async start(): Promise<void> {
    const transport = new StdioServerTransport();
    
    this.logInfo(`Starting ${this.config.server.name} v${this.config.server.version}`);
    this.logInfo(`Copilot CLI path: ${this.config.copilot.cliPath}`);
    
    await this.server.connect(transport);
    
    this.logInfo('MCP server started and ready for connections');
  }

  async stop(): Promise<void> {
    this.logInfo('Stopping MCP server...');
    await this.server.close();
    this.logInfo('MCP server stopped');
  }

  // Logging methods
  private logInfo(message: string, ...args: any[]): void {
    if (['debug', 'info'].includes(this.config.logging.level)) {
      if (this.config.logging.format === 'json') {
        console.log(JSON.stringify({ level: 'info', message, args, timestamp: new Date().toISOString() }));
      } else {
        console.log(`[INFO] ${message}`, ...args);
      }
    }
  }

  private logError(message: string, error?: any): void {
    if (['debug', 'info', 'warn', 'error'].includes(this.config.logging.level)) {
      if (this.config.logging.format === 'json') {
        console.error(JSON.stringify({ 
          level: 'error', 
          message, 
          error: error instanceof Error ? error.message : error,
          stack: error instanceof Error ? error.stack : undefined,
          timestamp: new Date().toISOString() 
        }));
      } else {
        console.error(`[ERROR] ${message}`, error);
      }
    }
  }

  // Getters for testing
  getProgressTracker(): ProgressTracker {
    return this.progressTracker;
  }

  getConfig(): Config {
    return this.config;
  }

  getTools(): Map<string, any> {
    return this.tools;
  }
}