# ask

Execute GitHub Copilot CLI with file analysis, tool management, and safety controls.

## Description

The `ask` tool provides a bridge to GitHub Copilot CLI, allowing you to leverage GitHub's AI assistant directly through the MCP protocol. It supports comprehensive tool permission management, directory access control, and various advanced features like session management.

## Parameters

| Parameter             | Type               | Required | Default | Description                                                                              |
| --------------------- | ------------------ | -------- | ------- | ---------------------------------------------------------------------------------------- |
| `prompt`              | string             | ✅       | -       | Task or question for GitHub Copilot CLI. Supports @ syntax for files/images              |
| `model`               | string             | ❌       | -       | AI model: `gpt-5`, `claude-sonnet-4`, `claude-sonnet-4.5`, or `claude-haiku-4.5` (0.33x) |
| `addDir`              | string \| string[] | ❌       | -       | Add directories to allowed list for file access                                          |
| `allowAllTools`       | boolean            | ❌       | `true`  | Allow all tools to run automatically (required for non-interactive mode)                 |
| `allowTool`           | string \| string[] | ❌       | -       | Allow specific tools to run (supports glob patterns)                                     |
| `denyTool`            | string \| string[] | ❌       | -       | Deny specific tools (takes precedence over allowTool)                                    |
| `disableMcpServer`    | string \| string[] | ❌       | -       | Disable specific MCP servers                                                             |
| `allowAllPaths`       | boolean            | ❌       | -       | Approve access to all paths automatically (use with caution, v0.0.340+)                  |
| `additionalMcpConfig` | string \| object   | ❌       | -       | Additional MCP server config (JSON or @file path, v0.0.343+)                             |
| `logDir`              | string             | ❌       | -       | Set log file directory                                                                   |
| `logLevel`            | enum               | ❌       | -       | Set log level: `error`, `warning`, `info`, `debug`, `all`, `default`, `none`             |
| `noColor`             | boolean            | ❌       | -       | Disable all color output                                                                 |
| `resume`              | string \| boolean  | ❌       | -       | Resume from a previous session (optionally specify session ID)                           |
| `continue`            | boolean            | ❌       | -       | Resume the most recent session                                                           |
| `screenReader`        | boolean            | ❌       | -       | Enable screen reader optimizations                                                       |
| `banner`              | boolean            | ❌       | -       | Show the animated banner on startup                                                      |
| `timeout`             | number             | ❌       | -       | Maximum execution time in milliseconds                                                   |

## Examples

### Basic usage

```typescript
{
  "prompt": "Explain what this React component does",
  "addDir": ["./src"],
  "allowAllTools": true
}
```

### Security-focused analysis

```typescript
{
  "prompt": "Review the authentication code for security vulnerabilities",
  "allowAllTools": false,
  "allowTool": ["read"],
  "denyTool": ["write", "shell"],
  "addDir": ["./src/auth"],
  "logLevel": "info"
}
```

### File analysis with @ syntax

```typescript
{
  "prompt": "Analyze @src/components/UserProfile.tsx and suggest improvements",
  "model": "claude-sonnet-4.5",
  "allowAllTools": true,
  "addDir": ["./src"]
}
```

### Session management

```typescript
{
  "prompt": "Continue working on the user authentication system",
  "resume": "session-abc-123",
  "allowAllTools": true,
  "addDir": ["./src"]
}
```

### Tool permission examples

#### Allow only specific tools

```typescript
{
  "prompt": "Run tests for the user module",
  "allowAllTools": false,
  "allowTool": ["shell(npm test)", "shell(jest)"],
  "addDir": ["./src/user"]
}
```

#### Deny dangerous tools

```typescript
{
  "prompt": "Analyze the codebase and suggest improvements",
  "allowAllTools": true,
  "denyTool": ["shell(rm)", "shell(sudo)", "shell(git push)"],
  "addDir": ["."]
}
```

### Budget-optimized analysis with Haiku

```typescript
{
  "prompt": "Quickly review @src/utils/helpers.ts for basic issues",
  "model": "claude-haiku-4.5",  // 3x cheaper than other models
  "allowAllTools": true
}
```

### Advanced: Temporary MCP server configuration

```typescript
{
  "prompt": "Use my custom analysis tool",
  "additionalMcpConfig": {
    "mcpServers": {
      "custom-analyzer": {
        "command": "node",
        "args": ["analyzer.js"]
      }
    }
  }
}
```

### Automated workflows with path approval

```typescript
{
  "prompt": "Refactor all TypeScript files",
  "allowAllPaths": true,  // Skip path approval prompts
  "allowAllTools": true,
  "addDir": ["./src"]
}
```

## Response format

The tool returns a formatted response that includes:

- **GitHub Copilot Session**: Metadata about the session
- **Analysis**: Reasoning and thought process
- **Tool Executions**: List of tools that were executed (if any)
- **Response**: The main response from GitHub Copilot CLI

### Example response

````markdown
**GitHub Copilot Session:**

- Session: abc-123-def
- Tools Used: 3 executions

**Analysis:**
I'll analyze the React component you've provided. Let me examine the file structure and identify any potential improvements.

**Tool Executions:**

- Executing tool: read file src/components/UserProfile.tsx
- Running: npm test -- UserProfile.test.tsx
- Executing tool: analyze code patterns

**Response:**
The UserProfile component is well-structured but could benefit from the following improvements:

1. **Performance Optimization**: Consider using React.memo for props comparison
2. **Accessibility**: Add proper ARIA labels for form elements
3. **Error Handling**: Implement proper error boundaries

Here's the refactored version:

```tsx
// Improved UserProfile component code...
```
````

```

## Error handling

Common errors and their solutions:

### CLI not found
```

❌ Copilot CLI Not Found: GitHub Copilot CLI not found - please install with 'npm install -g @github/copilot-cli'

```

### Authentication failed
```

❌ Authentication Failed: Please log in to GitHub Copilot CLI

Setup Options:

1. Interactive Login: `copilot /login`
2. Check Status: `copilot /user show`

```

### Directory access denied
```

❌ Directory Access Error: Permission denied accessing ./src

Solutions:

1. Add directory access: `addDir: "/path/to/directory"`
2. Add multiple directories: `addDir: ["/path1", "/path2"]`

```

### Tool permission denied
```

❌ Tool Permission Error: Tool 'shell(git)' denied

Solutions:

1. Allow all tools: `allowAllTools: true`
2. Allow specific tools: `allowTool: ["shell(git status)"]`

```

## Security considerations

- **Directory Access**: Only grant access to directories that contain files you want Copilot to analyze or modify
- **Tool Permissions**: Use the principle of least privilege - start with restrictive permissions and add only what's necessary
- **Sensitive Data**: Avoid using in directories with sensitive information like API keys or credentials
- **Session Management**: Be cautious with session resumption in shared environments

## Best practices

1. **Start Restrictive**: Begin with `allowAllTools: false` and add specific permissions
2. **Use Directory Scoping**: Always specify `addDir` to limit file system access
3. **Monitor Tool Usage**: Enable logging to track what tools are being executed
4. **Review Changes**: When using `changeMode`, always review generated changes before applying
5. **Session Hygiene**: Don't resume sessions across different projects or security contexts

## Related tools

- [`batch-copilot`](./batch-copilot) - Process multiple tasks with Copilot CLI
- [`review-copilot`](./review-copilot) - Comprehensive code review with Copilot CLI
- [`ask`](./ask) - Legacy GitHub Copilot CLI integration
```
