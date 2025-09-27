import { spawn } from 'child_process';
import { 
  CommandResult, 
  ExecutionOptions, 
  CommandExecutionError,
  Config 
} from '../types/index.js';

export class CommandExecutor {
  constructor(private readonly config: Config) {}

  async execute(
    command: string, 
    args: string[], 
    options: ExecutionOptions = {}
  ): Promise<CommandResult> {
    const startTime = Date.now();
    const maxRetries = options.maxRetries ?? this.config.copilot.maxRetries;
    const retryDelay = options.retryDelay ?? this.config.copilot.retryDelay;
    
    let lastError: Error | undefined;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const result = await this.executeOnce(command, args, options);
        result.duration = Date.now() - startTime;
        return result;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        if (attempt < maxRetries) {
          await this.sleep(retryDelay * Math.pow(2, attempt)); // Exponential backoff
        }
      }
    }
    
    throw new CommandExecutionError(
      `Command failed after ${maxRetries + 1} attempts: ${lastError?.message}`,
      `${command} ${args.join(' ')}`,
      lastError
    );
  }

  private async executeOnce(
    command: string,
    args: string[],
    options: ExecutionOptions
  ): Promise<CommandResult> {
    const fullCommand = `${command} ${args.join(' ')}`;
    const timeout = options.timeout ?? this.config.copilot.timeout;
    
    return new Promise((resolve, reject) => {
      const child = spawn(command, args, {
        cwd: options.cwd,
        env: { ...process.env, ...options.env },
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      let stdout = '';
      let stderr = '';
      let timeoutHandle: NodeJS.Timeout | undefined;

      // Handle timeout
      if (timeout > 0) {
        timeoutHandle = setTimeout(() => {
          child.kill('SIGKILL');
          reject(new Error(`Command timeout after ${timeout}ms`));
        }, timeout);
      }

      child.stdout?.on('data', (data: Buffer) => {
        stdout += data.toString();
      });

      child.stderr?.on('data', (data: Buffer) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        if (timeoutHandle) {
          clearTimeout(timeoutHandle);
        }

        const result: CommandResult = {
          success: code === 0,
          stdout: stdout.trim(),
          stderr: stderr.trim(),
          exitCode: code ?? -1,
          duration: 0, // Will be set by caller
          command: fullCommand,
        };

        resolve(result);
      });

      child.on('error', (error) => {
        if (timeoutHandle) {
          clearTimeout(timeoutHandle);
        }
        reject(error);
      });
    });
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}