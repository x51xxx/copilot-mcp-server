# Tool Permissions

GitHub Copilot CLI provides fine-grained control over tool permissions to balance functionality with security.

## Allowing tools to be used without manual approval

There are three command-line options that you can use for either interactive or programmatic mode to determine tools that Copilot can use without asking for your approval:

### `--allow-all-tools`

Allows Copilot to use any tool without asking for your approval.

For example, you can use this option with programmatic mode to allow the CLI to run any command:

```bash
copilot -p "Revert the last commit" --allow-all-tools
```

::: danger Caution
This option grants Copilot full access to all tools and commands available to your user account. Use with extreme caution.
:::

### `--deny-tool`

Prevents Copilot from using a specific tool.

This option takes precedence over the `--allow-all-tools` and `--allow-tool` options.

### `--allow-tool`

Allows Copilot to use a specific tool without asking for your approval.

## Using the approval options

The `--deny-tool` and `--allow-tool` options require one of the following arguments:

### Shell commands: `'shell(COMMAND)'`

For example, `copilot --deny-tool 'shell(rm)'` prevents Copilot from using any `rm` command.

For git and gh commands, you can specify a particular first-level subcommand to allow or deny:

```bash
copilot --deny-tool 'shell(git push)'
```

The tool specification is optional. For example, `copilot --allow-tool 'shell'` allows Copilot to use any shell command without individual approval.

#### Examples of shell command permissions:

```bash
# Allow all shell commands
copilot --allow-tool 'shell'

# Allow only git status and log commands
copilot --allow-tool 'shell(git status)' --allow-tool 'shell(git log)'

# Deny dangerous commands
copilot --deny-tool 'shell(rm)' --deny-tool 'shell(chmod)' --deny-tool 'shell(sudo)'

# Allow git commands except push
copilot --allow-tool 'shell(git)' --deny-tool 'shell(git push)'
```

### File modification: `'write'`

This argument allows or denies tools—other than shell commands—permission to modify files.

```bash
# Allow file modifications
copilot --allow-tool 'write'

# Deny file modifications (read-only mode)
copilot --deny-tool 'write'
```

For example, `copilot --allow-tool 'write'` allows Copilot to edit files without your individual approval.

### MCP server tools: `'MCP_SERVER_NAME'`

This argument allows or denies tools from the specified MCP server, where `MCP_SERVER_NAME` is the name of an MCP server that you have configured. Tools from the server are specified in parentheses, using the tool name that is registered with the MCP server. Using the server name without specifying a tool allows or denies all tools from that server.

For example, `copilot --deny-tool 'My-MCP-Server(tool_name)'` prevents Copilot from using the tool called `tool_name` from the MCP server called `My-MCP-Server`.

You can find an MCP server's name by entering `/mcp` in the interactive mode of Copilot CLI and selecting the server from the list that's displayed.

#### Examples of MCP server permissions:

```bash
# Allow all tools from a specific MCP server
copilot --allow-tool 'GitHub-MCP'

# Deny a specific tool from an MCP server
copilot --deny-tool 'GitHub-MCP(delete_repo)'

# Allow most tools but deny dangerous ones
copilot --allow-tool 'GitHub-MCP' --deny-tool 'GitHub-MCP(delete_issue)' --deny-tool 'GitHub-MCP(force_push)'
```

## Combining approval options

You can use a combination of approval options to determine exactly which tools Copilot can use without asking for your approval.

### Example 1: Selective shell command permissions

To prevent Copilot from using the `rm` and `git push` commands, but automatically allow all other tools:

```bash
copilot --allow-all-tools --deny-tool 'shell(rm)' --deny-tool 'shell(git push)'
```

### Example 2: MCP server tool management

To prevent Copilot from using the tool `tool_name` from the MCP server named `My-MCP-Server`, but allow all other tools from that server:

```bash
copilot --allow-tool 'My-MCP-Server' --deny-tool 'My-MCP-Server(tool_name)'
```

### Example 3: Comprehensive security configuration

A security-focused configuration that allows safe operations while blocking dangerous ones:

```bash
copilot \
  --allow-tool 'write' \
  --allow-tool 'shell(git status)' \
  --allow-tool 'shell(git log)' \
  --allow-tool 'shell(git diff)' \
  --allow-tool 'shell(npm install)' \
  --allow-tool 'shell(npm test)' \
  --deny-tool 'shell(rm)' \
  --deny-tool 'shell(sudo)' \
  --deny-tool 'shell(chmod)' \
  --deny-tool 'shell(git push)' \
  --deny-tool 'shell(npm publish)'
```

## MCP Integration Tool Permissions

When using GitHub Copilot CLI through the MCP server, you can specify tool permissions in the tool arguments:

### ask-copilot tool permissions

```typescript
{
  "prompt": "Analyze the codebase and suggest improvements",
  "allowAllTools": false,
  "allowTool": ["write", "shell(git status)", "shell(npm test)"],
  "denyTool": ["shell(rm)", "shell(sudo)", "shell(git push)"],
  "addDir": ["./src", "./tests"]
}
```

### batch-copilot tool permissions

```typescript
{
  "tasks": [
    {
      "task": "Run tests for all components",
      "target": "@src/components/",
      "priority": "high"
    }
  ],
  "allowAllTools": false,
  "allowTool": ["shell(npm test)", "shell(jest)"],
  "denyTool": ["shell(rm)", "write"]
}
```

### review-copilot tool permissions

```typescript
{
  "target": "@src/security/",
  "reviewType": "security",
  "allowAllTools": false,
  "allowTool": ["read", "analyze"],
  "denyTool": ["write", "shell"]
}
```

## Best practices for tool permissions

### 1. Principle of least privilege

Start with minimal permissions and add only what's necessary:

```bash
# Start restrictive
copilot --deny-tool 'shell' --allow-tool 'write'

# Add specific permissions as needed
copilot --allow-tool 'shell(git status)' --allow-tool 'shell(npm test)'
```

### 2. Use deny-tool for dangerous commands

Always explicitly deny dangerous operations:

```bash
copilot --allow-all-tools \
  --deny-tool 'shell(rm)' \
  --deny-tool 'shell(sudo)' \
  --deny-tool 'shell(chmod +x)'
```

### 3. Session-scoped vs persistent permissions

- Use command-line options for session-scoped permissions
- Be cautious with persistent configurations
- Regularly review and update permission policies

### 4. Environment-specific configurations

Different permission sets for different environments:

```bash
# Development environment (more permissive)
copilot --allow-all-tools --deny-tool 'shell(git push)'

# Production environment (highly restrictive)
copilot --allow-tool 'shell(git status)' --allow-tool 'shell(git log)' --deny-tool 'write'

# CI/CD environment (automated testing)
copilot --allow-tool 'shell(npm test)' --allow-tool 'shell(npm build)' --deny-tool 'shell(git push)'
```

### 5. Monitoring and auditing

- Use logging to track tool usage
- Regularly review permission grants
- Implement alerting for dangerous command attempts

```bash
# Enable comprehensive logging
copilot --log-level debug --log-dir ./copilot-logs
```

By carefully configuring tool permissions, you can harness the full power of GitHub Copilot CLI while maintaining appropriate security controls for your specific use case.
