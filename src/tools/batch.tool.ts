import { z } from 'zod';
import { UnifiedTool } from './registry.js';
import { executeCopilot, LogLevel } from '../utils/copilotExecutor.js';
import {
  ERROR_MESSAGES,
  STATUS_MESSAGES,
} from '../constants.js';

// Define task type for batch operations
const batchTaskSchema = z.object({
  task: z.string().describe("Atomic task description"),
  target: z.string().optional().describe("Target files/directories (use @ syntax)"),
  priority: z.enum(['high', 'normal', 'low']).default('normal').describe("Task priority"),
});

const batchArgsSchema = z.object({
  tasks: z.array(batchTaskSchema).min(1).describe("Array of atomic tasks to delegate to GitHub Copilot"),
  addDir: z.union([z.string(), z.array(z.string())]).optional().describe("Add directories to allowed list for file access"),
  allowAllTools: z.boolean().default(true).describe("Allow all tools to run automatically"),
  allowTool: z.union([z.string(), z.array(z.string())]).optional().describe("Allow specific tools"),
  denyTool: z.union([z.string(), z.array(z.string())]).optional().describe("Deny specific tools"),
  logLevel: z.enum(['error', 'warning', 'info', 'debug', 'all', 'default', 'none']).optional().describe("Set the log level"),
  parallel: z.boolean().default(false).describe("Execute tasks in parallel (experimental)"),
  stopOnError: z.boolean().default(true).describe("Stop execution if any task fails"),
  timeout: z.number().optional().describe("Maximum execution time per task in milliseconds"),
});

export const batchTool: UnifiedTool = {
  name: "batch",
  description: "Delegate multiple atomic tasks to GitHub Copilot CLI for batch processing. Ideal for repetitive operations, mass refactoring, and automated code transformations",
  zodSchema: batchArgsSchema,
  prompt: {
    description: "Execute multiple atomic Copilot tasks in batch mode for efficient automation",
  },
  category: 'copilot',
  execute: async (args, onProgress) => {
    const {
      tasks, addDir, allowAllTools, allowTool, denyTool, logLevel,
      parallel, stopOnError, timeout
    } = args;
    const taskList = tasks as Array<{ task: string; target?: string; priority: string }>;

    if (!taskList || taskList.length === 0) {
      throw new Error('No tasks provided for batch execution');
    }

    const results: Array<{ task: string; success: boolean; output?: string; error?: string; duration?: number }> = [];
    let totalSuccess = 0;
    let totalFailed = 0;

    onProgress?.(STATUS_MESSAGES.PROCESSING_START);
    onProgress?.(`🔄 Batch processing ${taskList.length} tasks with GitHub Copilot CLI...`);

    // Sort tasks by priority
    const sortedTasks = taskList.sort((a, b) => {
      const priorities = { high: 3, normal: 2, low: 1 };
      return priorities[b.priority as keyof typeof priorities] - priorities[a.priority as keyof typeof priorities];
    });

    const executeTask = async (taskItem: typeof taskList[0], index: number) => {
      const taskStart = Date.now();
      onProgress?.(`📋 Task ${index + 1}/${taskList.length}: ${taskItem.task.slice(0, 50)}...`);

      try {
        const taskPrompt = taskItem.target 
          ? `${taskItem.task} for ${taskItem.target}`
          : taskItem.task;

        const result = await executeCopilot(
          taskPrompt,
          {
            addDir: addDir as string | string[],
            allowAllTools: allowAllTools as boolean,
            allowTool: allowTool as string | string[],
            denyTool: denyTool as string | string[],
            logLevel: logLevel as LogLevel,
            timeoutMs: timeout as number || 120000, // 2 minutes default per task
          },
          (progress) => onProgress?.(`  └─ ${progress.slice(0, 100)}...`)
        );

        const duration = Date.now() - taskStart;
        results.push({
          task: taskItem.task,
          success: true,
          output: result,
          duration
        });
        
        totalSuccess++;
        onProgress?.(`✅ Task ${index + 1} completed (${duration}ms)`);
      } catch (error) {
        const duration = Date.now() - taskStart;
        const errorMessage = error instanceof Error ? error.message : String(error);
        
        results.push({
          task: taskItem.task,
          success: false,
          error: errorMessage,
          duration
        });
        
        totalFailed++;
        onProgress?.(`❌ Task ${index + 1} failed: ${errorMessage.slice(0, 100)}...`);

        if (stopOnError) {
          throw new Error(`Batch execution stopped on task ${index + 1}: ${errorMessage}`);
        }
      }
    };

    try {
      if (parallel) {
        // Parallel execution - be careful with rate limits
        onProgress?.('⚡ Running tasks in parallel...');
        const promises = sortedTasks.map((task, index) => executeTask(task, index));
        await Promise.allSettled(promises);
      } else {
        // Sequential execution - safer for rate limits
        onProgress?.('📝 Running tasks sequentially...');
        for (let i = 0; i < sortedTasks.length; i++) {
          await executeTask(sortedTasks[i], i);
          
          // Add small delay between tasks to avoid rate limiting
          if (i < sortedTasks.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      }

      // Generate comprehensive report
      const successfulResults = results.filter(r => r.success);
      const failedResults = results.filter(r => !r.success);
      const totalDuration = results.reduce((sum, r) => sum + (r.duration || 0), 0);

      onProgress?.(STATUS_MESSAGES.PROCESSING_COMPLETE);

      return `# GitHub Copilot Batch Execution Report

## Summary
- **Total Tasks:** ${taskList.length}
- **Successful:** ${totalSuccess}
- **Failed:** ${totalFailed}  
- **Total Duration:** ${totalDuration}ms
- **Execution Mode:** ${parallel ? 'Parallel' : 'Sequential'}

## Successful Tasks (${successfulResults.length})
${successfulResults.map((result, i) => `
### Task ${i + 1}: ${result.task}
**Duration:** ${result.duration}ms

**Output:**
\`\`\`
${result.output}
\`\`\`
`).join('\n')}

## Failed Tasks (${failedResults.length})
${failedResults.map((result, i) => `
### Task ${i + 1}: ${result.task}
**Duration:** ${result.duration}ms
**Error:** ${result.error}
`).join('\n')}

---
*GitHub Copilot CLI Batch Processing completed at ${new Date().toISOString()}*`;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      return `# GitHub Copilot Batch Execution Report - INCOMPLETE

## Summary
- **Total Tasks:** ${taskList.length}
- **Processed:** ${results.length}
- **Successful:** ${totalSuccess}
- **Failed:** ${totalFailed}
- **Stopped Due To:** ${errorMessage}

## Completed Tasks
${results.map((result, i) => `
### Task ${i + 1}: ${result.task} - ${result.success ? '✅ Success' : '❌ Failed'}
${result.success ? result.output : `Error: ${result.error}`}
`).join('\n')}

## Error Details
${errorMessage}

**Suggestion:** Consider setting \`stopOnError: false\` to continue processing remaining tasks even when individual tasks fail.`;
    }
  }
};