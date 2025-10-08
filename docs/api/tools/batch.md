# batch

Delegate multiple atomic tasks to GitHub Copilot CLI for batch processing.

## Description

The `batch` tool enables efficient batch processing of multiple tasks using GitHub Copilot CLI. It's ideal for repetitive operations, mass refactoring, automated code transformations, and processing multiple files or components in a systematic way.

## Parameters

| Parameter       | Type               | Required | Default | Description                                                                  |
| --------------- | ------------------ | -------- | ------- | ---------------------------------------------------------------------------- |
| `tasks`         | Task[]             | ✅       | -       | Array of atomic tasks to delegate to GitHub Copilot                          |
| `model`         | string             | ❌       | -       | AI model: `gpt-5`, `claude-sonnet-4`, or `claude-sonnet-4.5`                 |
| `addDir`        | string \| string[] | ❌       | -       | Add directories to allowed list for file access                              |
| `allowAllTools` | boolean            | ❌       | `true`  | Allow all tools to run automatically                                         |
| `allowTool`     | string \| string[] | ❌       | -       | Allow specific tools (supports glob patterns)                                |
| `denyTool`      | string \| string[] | ❌       | -       | Deny specific tools                                                          |
| `logLevel`      | enum               | ❌       | -       | Set log level: `error`, `warning`, `info`, `debug`, `all`, `default`, `none` |
| `resume`        | string \| boolean  | ❌       | -       | Resume from a previous session (optionally specify session ID)               |
| `continue`      | boolean            | ❌       | -       | Resume the most recent session                                               |
| `parallel`      | boolean            | ❌       | `false` | Execute tasks in parallel (experimental)                                     |
| `stopOnError`   | boolean            | ❌       | `true`  | Stop execution if any task fails                                             |
| `timeout`       | number             | ❌       | -       | Maximum execution time per task in milliseconds                              |

### Task Object

| Parameter  | Type   | Required | Default  | Description                             |
| ---------- | ------ | -------- | -------- | --------------------------------------- |
| `task`     | string | ✅       | -        | Atomic task description                 |
| `target`   | string | ❌       | -        | Target files/directories (use @ syntax) |
| `priority` | enum   | ❌       | `normal` | Task priority: `high`, `normal`, `low`  |

## Examples

### Basic batch processing

```typescript
{
  "tasks": [
    {
      "task": "Add TypeScript types to user model",
      "target": "@src/models/user.js",
      "priority": "high"
    },
    {
      "task": "Update all console.log statements to use proper logging",
      "target": "@src/",
      "priority": "normal"
    },
    {
      "task": "Add input validation to API endpoints",
      "target": "@src/routes/",
      "priority": "medium"
    }
  ],
  "allowAllTools": true,
  "addDir": ["./src"]
}
```

### Parallel processing for independent tasks

```typescript
{
  "tasks": [
    {
      "task": "Run tests for utils module",
      "target": "@src/utils/",
      "priority": "high"
    },
    {
      "task": "Run tests for services module",
      "target": "@src/services/",
      "priority": "high"
    },
    {
      "task": "Run tests for components module",
      "target": "@src/components/",
      "priority": "high"
    }
  ],
  "parallel": true,
  "allowAllTools": false,
  "allowTool": ["shell(npm test)", "shell(jest)"],
  "workingDir": "."
}
```

### Security-focused batch operations

```typescript
{
  "tasks": [
    {
      "task": "Review authentication module for security vulnerabilities",
      "target": "@src/auth/",
      "priority": "high"
    },
    {
      "task": "Check API endpoints for input validation",
      "target": "@src/api/",
      "priority": "high"
    },
    {
      "task": "Audit database queries for SQL injection",
      "target": "@src/database/",
      "priority": "medium"
    }
  ],
  "allowAllTools": false,
  "allowTool": ["read", "analyze"],
  "denyTool": ["write", "shell"],
  "stopOnError": false,
  "addDir": ["./src"]
}
```

### Mass refactoring example

```typescript
{
  "tasks": [
    {
      "task": "Convert class components to functional components with hooks",
      "target": "@src/components/UserProfile.jsx",
      "priority": "high"
    },
    {
      "task": "Convert class components to functional components with hooks",
      "target": "@src/components/Dashboard.jsx",
      "priority": "high"
    },
    {
      "task": "Convert class components to functional components with hooks",
      "target": "@src/components/Settings.jsx",
      "priority": "normal"
    },
    {
      "task": "Update prop-types to TypeScript interfaces",
      "target": "@src/components/",
      "priority": "low"
    }
  ],
  "parallel": false,
  "stopOnError": true,
  "timeout": 120000,
  "allowAllTools": true,
  "addDir": ["./src"]
}
```

## Response format

The tool returns a comprehensive execution report:

````markdown
# GitHub Copilot Batch Execution Report

## Summary

- **Total Tasks:** 4
- **Successful:** 3
- **Failed:** 1
- **Total Duration:** 45000ms
- **Execution Mode:** Sequential

## Successful Tasks (3)

### Task 1: Add TypeScript types to user model

**Duration:** 12000ms

**Output:**

```typescript
// Updated user model with proper TypeScript interfaces
interface User {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
}
```
````

### Task 2: Update console.log statements

**Duration:** 8000ms

**Output:**

```javascript
// Replaced console.log with proper logging
import logger from './logger';
logger.info('User authenticated successfully');
```

### Task 3: Add input validation

**Duration:** 15000ms

**Output:**

```javascript
// Added Joi validation schemas
const userSchema = Joi.object({
  name: Joi.string().required(),
  email: Joi.string().email().required(),
});
```

## Failed Tasks (1)

### Task 4: Convert class component

**Duration:** 10000ms
**Error:** Target file not found: src/components/OldComponent.jsx

---

_GitHub Copilot CLI Batch Processing completed at 2024-01-15T10:30:00.000Z_

````

## Task execution order

Tasks are executed in priority order:
1. **High priority** tasks first
2. **Normal priority** tasks second
3. **Low priority** tasks last

Within the same priority level, tasks are executed in the order they appear in the array.

## Parallel vs Sequential execution

### Sequential execution (default)
- **Safer** for file system operations
- **Better** for tasks that depend on each other
- **Avoids** race conditions
- **Includes** 1-second delay between tasks to prevent rate limiting

### Parallel execution (experimental)
- **Faster** for independent tasks
- **Risk** of race conditions if tasks modify the same files
- **Use** only when tasks are completely independent
- **Monitor** for rate limiting issues

## Error handling modes

### Stop on error (default)
```typescript
{
  "stopOnError": true  // Stops batch execution on first error
}
````

### Continue on error

```typescript
{
  "stopOnError": false  // Continues processing remaining tasks even when tasks fail
}
```

## Performance considerations

### Task timeouts

```typescript
{
  "timeout": 300000,  // 5 minutes per task
  "tasks": [/* ... */]
}
```

### Rate limiting

- Sequential execution includes built-in delays
- Parallel execution may hit rate limits faster
- Monitor for 429 responses and adjust accordingly

### Resource usage

- Each task spawns a separate Copilot CLI process
- Memory usage scales with parallel task count
- Consider system resources when setting parallel task limits

## Best practices

### 1. Task granularity

```typescript
// Good: Atomic, specific tasks
{
  "task": "Add error handling to getUserById function",
  "target": "@src/services/userService.js"
}

// Avoid: Vague, overly broad tasks
{
  "task": "Fix everything in the codebase"
}
```

### 2. Target specification

```typescript
// Good: Specific file targets
{
  "task": "Update API endpoint",
  "target": "@src/routes/users.js"
}

// Good: Directory with clear scope
{
  "task": "Add JSDoc comments to all utility functions",
  "target": "@src/utils/"
}
```

### 3. Priority assignment

```typescript
{
  "tasks": [
    {
      "task": "Critical security fix",
      "priority": "high"        // Will run first
    },
    {
      "task": "Code cleanup",
      "priority": "low"         // Will run last
    }
  ]
}
```

### 4. Error resilience

```typescript
{
  "stopOnError": false,        // Continue on errors
  "parallel": false,           // Sequential for safety
  "timeout": 180000           // Reasonable timeout
}
```

## Common use cases

### Code modernization

- Convert legacy syntax to modern standards
- Update deprecated APIs
- Migrate between frameworks or libraries

### Quality improvement

- Add error handling across multiple files
- Implement consistent coding standards
- Add documentation or comments

### Testing and validation

- Run tests across multiple modules
- Validate configuration files
- Check code compliance

### Build and deployment

- Update build configurations
- Generate documentation
- Prepare release artifacts

## Security considerations

- **Review generated changes** before committing
- **Use restrictive permissions** for automated operations
- **Test in isolated environments** first
- **Monitor tool executions** through logging

## Related tools

- [`ask-copilot`](./ask-copilot) - Single task execution with Copilot CLI
- [`review-copilot`](./review-copilot) - Comprehensive code review
- [`batch`](./batch) - Legacy GitHub Copilot CLI batch processing
