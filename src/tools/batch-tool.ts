import { z } from 'zod';
import { 
  ToolResult, 
  ToolContext, 
  ValidationError 
} from '../types/index.js';
import { OutputParser } from '../utils/index.js';
import { AskTool } from './ask-tool.js';

const BatchTaskSchema = z.object({
  id: z.string(),
  name: z.string(),
  query: z.string(),
  context: z.string().optional(),
  language: z.string().optional(),
  files: z.array(z.string()).optional(),
  dependencies: z.array(z.string()).optional(),
});

const BatchToolArgsSchema = z.object({
  tasks: z.array(BatchTaskSchema).min(1, 'At least one task is required'),
  parallel: z.boolean().default(false),
  continueOnError: z.boolean().default(false),
});

type BatchTaskInput = z.infer<typeof BatchTaskSchema>;

export interface BatchResult {
  taskId: string;
  result: ToolResult;
  duration: number;
}

export class BatchTool {
  private readonly askTool: AskTool;

  constructor(commandExecutor: any, outputParser: OutputParser) {
    this.askTool = new AskTool(commandExecutor, outputParser);
  }

  async execute(args: unknown, context: ToolContext): Promise<ToolResult> {
    try {
      const validArgs = BatchToolArgsSchema.parse(args);
      
      // Validate task dependencies
      this.validateTaskDependencies(validArgs.tasks);
      
      // Execute tasks
      const results = validArgs.parallel 
        ? await this.executeParallel(validArgs.tasks, context, validArgs.continueOnError)
        : await this.executeSequential(validArgs.tasks, context, validArgs.continueOnError);
      
      return {
        success: results.every(r => r.result.success) || validArgs.continueOnError,
        content: this.formatBatchResults(results),
        data: {
          results,
          totalTasks: validArgs.tasks.length,
          successfulTasks: results.filter(r => r.result.success).length,
          failedTasks: results.filter(r => !r.result.success).length,
        },
      };
      
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError('Invalid arguments for batch tool', error.errors);
      }
      
      return {
        success: false,
        content: 'Failed to execute batch operation',
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  private validateTaskDependencies(tasks: BatchTaskInput[]): void {
    const taskIds = new Set(tasks.map(t => t.id));
    
    for (const task of tasks) {
      if (task.dependencies) {
        for (const depId of task.dependencies) {
          if (!taskIds.has(depId)) {
            throw new ValidationError(
              `Task ${task.id} depends on non-existent task ${depId}`
            );
          }
        }
      }
    }
    
    // Check for circular dependencies (simple cycle detection)
    this.checkCircularDependencies(tasks);
  }

  private checkCircularDependencies(tasks: BatchTaskInput[]): void {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    
    const taskMap = new Map(tasks.map(t => [t.id, t]));
    
    const hasCycle = (taskId: string): boolean => {
      if (recursionStack.has(taskId)) {
        return true;
      }
      
      if (visited.has(taskId)) {
        return false;
      }
      
      visited.add(taskId);
      recursionStack.add(taskId);
      
      const task = taskMap.get(taskId);
      if (task?.dependencies) {
        for (const depId of task.dependencies) {
          if (hasCycle(depId)) {
            return true;
          }
        }
      }
      
      recursionStack.delete(taskId);
      return false;
    };
    
    for (const task of tasks) {
      if (hasCycle(task.id)) {
        throw new ValidationError('Circular dependency detected in batch tasks');
      }
    }
  }

  private async executeSequential(
    tasks: BatchTaskInput[],
    context: ToolContext,
    continueOnError: boolean
  ): Promise<BatchResult[]> {
    const results: BatchResult[] = [];
    const completedTasks = new Set<string>();
    
    // Sort tasks by dependencies
    const sortedTasks = this.topologicalSort(tasks);
    
    for (const task of sortedTasks) {
      // Check if dependencies are met
      if (task.dependencies) {
        const unmetDeps = task.dependencies.filter(dep => !completedTasks.has(dep));
        if (unmetDeps.length > 0) {
          const errorMsg = `Task ${task.id} has unmet dependencies: ${unmetDeps.join(', ')}`;
          results.push({
            taskId: task.id,
            result: {
              success: false,
              content: errorMsg,
              error: errorMsg,
            },
            duration: 0,
          });
          
          if (!continueOnError) {
            break;
          }
          continue;
        }
      }
      
      const startTime = Date.now();
      const result = await this.askTool.execute({
        query: task.query,
        context: task.context,
      }, context);
      
      const batchResult: BatchResult = {
        taskId: task.id,
        result,
        duration: Date.now() - startTime,
      };
      
      results.push(batchResult);
      
      if (result.success) {
        completedTasks.add(task.id);
      } else if (!continueOnError) {
        break;
      }
    }
    
    return results;
  }

  private async executeParallel(
    tasks: BatchTaskInput[],
    context: ToolContext,
    continueOnError: boolean
  ): Promise<BatchResult[]> {
    // For parallel execution, we'll ignore dependencies for now
    // In a more sophisticated implementation, we'd execute in waves based on dependencies
    
    const promises = tasks.map(async (task): Promise<BatchResult> => {
      const startTime = Date.now();
      const result = await this.askTool.execute({
        query: task.query,
        context: task.context,
      }, context);
      
      return {
        taskId: task.id,
        result,
        duration: Date.now() - startTime,
      };
    });
    
    if (continueOnError) {
      const settledResults = await Promise.allSettled(promises);
      return settledResults.map((settled, index) => {
        if (settled.status === 'fulfilled') {
          return settled.value;
        } else {
          return {
            taskId: tasks[index]?.id ?? `unknown-${index}`,
            result: {
              success: false,
              content: 'Task failed during parallel execution',
              error: settled.reason instanceof Error ? settled.reason.message : String(settled.reason),
            },
            duration: 0,
          };
        }
      });
    } else {
      return await Promise.all(promises);
    }
  }

  private topologicalSort(tasks: BatchTaskInput[]): BatchTaskInput[] {
    const taskMap = new Map(tasks.map(t => [t.id, t]));
    const visited = new Set<string>();
    const result: BatchTaskInput[] = [];
    
    const visit = (taskId: string): void => {
      if (visited.has(taskId)) return;
      
      const task = taskMap.get(taskId);
      if (!task) return;
      
      visited.add(taskId);
      
      // Visit dependencies first
      if (task.dependencies) {
        for (const depId of task.dependencies) {
          visit(depId);
        }
      }
      
      result.push(task);
    };
    
    for (const task of tasks) {
      visit(task.id);
    }
    
    return result;
  }

  private formatBatchResults(results: BatchResult[]): string {
    const lines: string[] = [];
    
    const successful = results.filter(r => r.result.success).length;
    const total = results.length;
    
    lines.push(`📊 Batch Execution Results: ${successful}/${total} tasks successful`);
    lines.push('');
    
    for (const result of results) {
      const icon = result.result.success ? '✅' : '❌';
      const duration = `${result.duration}ms`;
      
      lines.push(`${icon} Task ${result.taskId} (${duration})`);
      
      if (result.result.success) {
        // Show abbreviated content for successful tasks
        const content = result.result.content;
        if (content.length > 200) {
          lines.push(`   ${content.substring(0, 200)}...`);
        } else {
          lines.push(`   ${content}`);
        }
      } else {
        // Show error for failed tasks
        lines.push(`   Error: ${result.result.error}`);
      }
      
      lines.push('');
    }
    
    return lines.join('\n');
  }

  getSchema(): object {
    return {
      name: 'batch',
      description: 'Execute multiple GitHub Copilot queries in sequence or parallel',
      inputSchema: {
        type: 'object',
        properties: {
          tasks: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: {
                  type: 'string',
                  description: 'Unique identifier for the task',
                },
                name: {
                  type: 'string',
                  description: 'Human-readable name for the task',
                },
                query: {
                  type: 'string',
                  description: 'The question or request to ask GitHub Copilot',
                },
                context: {
                  type: 'string',
                  description: 'Additional context for the query',
                },
                language: {
                  type: 'string',
                  description: 'Programming language for the query',
                },
                files: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Files to include as context',
                },
                dependencies: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Task IDs that must complete before this task',
                },
              },
              required: ['id', 'name', 'query'],
            },
            minItems: 1,
          },
          parallel: {
            type: 'boolean',
            description: 'Whether to execute tasks in parallel (ignores dependencies)',
            default: false,
          },
          continueOnError: {
            type: 'boolean',
            description: 'Whether to continue execution if a task fails',
            default: false,
          },
        },
        required: ['tasks'],
      },
    };
  }
}