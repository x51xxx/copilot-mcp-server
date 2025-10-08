# Using GitHub Copilot CLI

Learn how to use GitHub Copilot from the command line and through the MCP server.

## Who can use this feature?

GitHub Copilot CLI is available with the GitHub Copilot Pro, GitHub Copilot Pro+, GitHub Copilot Business and GitHub Copilot Enterprise plans.

::: info Organization policy
If you receive Copilot from an organization, the Copilot CLI policy must be enabled in the organization's settings.
:::

::: warning Public Preview  
GitHub Copilot CLI is in public preview and subject to change.
:::

## Prerequisite

Install Copilot CLI. See [Installing GitHub Copilot CLI](./installation).

## Using Copilot CLI

### Starting an interactive session

1. In your terminal, navigate to a folder that contains code you want to work with.

2. Enter `copilot` to start Copilot CLI.

3. **Trusted Directory Confirmation**: Copilot will ask you to confirm that you trust the files in this folder.

   ::: danger Important
   During this GitHub Copilot CLI session, Copilot may attempt to read, modify, and execute files in and below this folder. You should only proceed if you trust the files in this location. For more information about trusted directories, see [Security Considerations](./security).
   :::

   Choose one of the options:

   **1. Yes, proceed**: Copilot can work with the files in this location for this session only.

   **2. Yes, and remember this folder for future sessions**: You trust the files in this folder for this and future sessions. You won't be asked again when you start Copilot CLI from this folder. Only choose this option if you are sure that it will always be safe for Copilot to work with files in this location.

   **3. No, exit (Esc)**: End your Copilot CLI session.

4. **Authentication**: If you are not currently logged in to GitHub, you'll be prompted to use the `/login` slash command. Enter this command and follow the on-screen instructions to authenticate.

5. **Enter a prompt**: This can be a simple chat question, or a request for Copilot to perform a specific task, such as fixing a bug, adding a feature to an existing application, or creating a new application.

   For some examples of prompts, see [Use Cases](./use-cases).

### Tool approval workflow

When Copilot wants to use a tool that could modify or execute files—for example, `touch`, `chmod`, `node`, or `sed`—it will ask you to approve the use of the tool.

Choose one of the options:

**1. Yes**: Allow Copilot to use this tool. The next time Copilot wants to use this tool, it will ask you to approve it again.

**2. Yes, and approve TOOL for the rest of the running session**: Allow Copilot to use this tool—with any options—without asking again, for the rest of the currently running session. You will have to approve the command again in future sessions.

::: warning Security consideration
Choosing this option is useful for many tools—such as `chmod`—as it avoids you having to approve similar commands repeatedly in the same session. However, you should be aware of the security implications of this option. Choosing this option for the command `rm`, for example, would allow Copilot to delete any file in or below the current folder without asking for your approval.
:::

**3. No, and tell Copilot what to do differently (Esc)**: Copilot will not run the command. Instead, it ends the current operation and awaits your next prompt. You can tell Copilot to continue the task but using a different approach.

For example, if you ask Copilot to create a bash script but you do not want to use the script Copilot suggests, you can stop the current operation and enter a new prompt, such as: "Continue the previous task but include usage instructions in the script."

## Tips for effective usage

### Stop a currently running operation

If you enter a prompt and then decide you want to stop Copilot from completing the task while it is still "Thinking," press **Esc**.

### Include a specific file in your prompt

To add a specific file to your prompt, use `@` followed by the relative path to the file. For example:

- `Explain @config/ci/ci-required-checks.yml`
- `Fix the bug in @src/app.js`

This adds the contents of the file to your prompt as context for Copilot.

When you start typing a file path, the matching paths are displayed below the prompt box. Use the arrow keys to select a path and press **Tab** to complete the path in your prompt.

### Work with files in a different location

To complete a task, Copilot may need to work with files that are outside the current working directory. If a prompt you have entered in an interactive session requires Copilot to modify a file outside the current location, it will ask you to approve access to the file's directory.

You can also add a trusted directory manually at any time by using the slash command:

```
/add-dir /path/to/directory
```

If all of the files you want to work with are in a different location, you can switch the current working directory without starting a new Copilot CLI session by using the slash command:

```
/cwd /path/to/directory
```

### Resume an interactive session

You can return to a previous interactive session, and continue your conversation with Copilot, by using the `--resume` command line option, then choosing the session you want to resume from the list that's displayed.

```bash
copilot --resume
```

Or resume a specific session:

```bash
copilot --resume session-id-123
```

## Custom instructions

You can enhance Copilot's performance by adding custom instructions to the repository you are working in. Custom instructions are natural language descriptions saved in Markdown files in the repository. They are automatically included in prompts you enter while working in that repository. This helps Copilot to better understand the context of your project and how to respond to your prompts.

Copilot CLI supports:

- **Repository-wide instructions** in the `.github/copilot-instructions.md` file.
- **Path-specific instructions** files: `.github/copilot-instructions/**/*.instructions.md`.
- **Agent files** such as `AGENTS.md`.

For more information, see [Adding repository custom instructions for GitHub Copilot](https://docs.github.com/en/copilot/customizing-copilot/adding-custom-instructions-for-github-copilot).

## MCP server integration

### Add an MCP server

Copilot CLI comes with the GitHub MCP server already configured. This MCP server allows you to interact with resources on GitHub.com—for example, allowing you to merge pull requests from the CLI.

To extend the functionality available to you in Copilot CLI, you can add more MCP servers:

1. Use the following slash command:

   ```
   /mcp add
   ```

2. Fill in the details for the MCP server you want to add, using the **Tab** key to move between fields.

3. Press **Ctrl+S** to save the details.

Details of your configured MCP servers are stored in the `mcp-config.json` file, which is located, by default, in the `~/.config` directory. This location can be changed by setting the `XDG_CONFIG_HOME` environment variable.

### Using the Copilot MCP Tool

The Copilot MCP Tool provides seamless integration between MCP clients and GitHub Copilot CLI:

#### Through MCP clients (Claude, Cursor, etc.)

```typescript
// Using ask-copilot tool
{
  "prompt": "Analyze the security of @src/auth.js",
  "allowAllTools": true,
  "addDir": ["./src"]
}

// Using batch-copilot for multiple tasks
{
  "tasks": [
    {
      "task": "Add error handling to API endpoints",
      "target": "@src/api/",
      "priority": "high"
    },
    {
      "task": "Update documentation",
      "target": "@docs/",
      "priority": "normal"
    }
  ]
}

// Using review-copilot for code review
{
  "target": "@src/",
  "reviewType": "security",
  "severity": "medium",
  "generateReport": true
}
```

## Slash commands and options

### Interactive mode slash commands

- `/add-dir <directory>` - Add a directory to the allowed list for file access
- `/clear` - Clear chat history on the screen
- `/cwd [directory]` - Change working directory or show current directory
- `/exit` - Exit the CLI
- `/feedback` - Provide feedback about the CLI
- `/help` - Show help for interactive commands
- `/list-dirs` - Display all allowed directories for file access
- `/login` - Log in to Copilot
- `/logout` - Log out of Copilot
- `/mcp [show|add|edit|delete|disable|enable] [server-name]` - Manage MCP server configuration
- `/reset-allowed-tools` - Reset the list of allowed tools
- `/session` - Show information about the current CLI session
- `/theme [show|set|list] [auto|dark|light]` - View or configure terminal theme
- `/user [show|list|switch]` - Manage GitHub user list

### Command line options

- `--add-dir <directory>` - Add a directory to the allowed list for file access (can be used multiple times)
- `--allow-all-tools` - Allow all tools to run automatically without confirmation; required for non-interactive mode
- `--allow-tool [tools...]` - Allow specific tools
- `--banner` - Always show the animated banner on startup
- `--deny-tool [tools...]` - Deny specific tools, takes precedence over --allow-tool or --allow-all-tools
- `--disable-mcp-server <server-name>` - Disable a specific MCP server (can be used multiple times)
- `-h, --help` - Display help for command
- `--log-dir <directory>` - Set log file directory (default: ~/.copilot/logs/)
- `--log-level <level>` - Set the log level (error, warning, info, debug, all, default, none)
- `--no-color` - Disable all color output
- `-p, --prompt <text>` - Execute a prompt directly without interactive mode
- `--resume [sessionId]` - Resume from a previous session (optionally specify session ID)
- `--screen-reader` - Enable screen reader optimizations
- `-v, --version` - Show version information

## Examples

### Basic usage

```bash
# Start interactive mode
copilot

# Execute a prompt directly
copilot -p "Fix the bug in main.js" --allow-all-tools

# Resume the latest session
copilot --resume

# Resume a specific session by ID
copilot --resume session-id

# Resume with auto-approval
copilot --allow-all-tools --resume

# Show the animated banner
copilot --banner

# Set logging to ./logs
copilot --log-dir ./logs

# Enable debug level logging
copilot --log-level debug
```

### Directory and tool management

```bash
# Allow access to additional directory
copilot --add-dir /home/user/projects

# Allow multiple directories
copilot --add-dir ~/workspace --add-dir /tmp

# Allow touch commands
copilot --allow-tool 'shell(touch)'

# Deny git push commands
copilot --deny-tool 'shell(git push)'

# Allow all file editing
copilot --allow-tool 'write'

# Allow all but one specific tool from MCP server with name "MyMCP"
copilot --deny-tool 'MyMCP(denied_tool)' --allow-tool 'MyMCP'
```

### File analysis examples

```bash
# Interactive mode with file reference
copilot
# Then type: Explain what @src/main.js does

# Direct execution with file analysis
copilot -p "Review @package.json and suggest improvements" --allow-all-tools --add-dir .

# Multiple file analysis
copilot -p "Compare @src/old-api.js and @src/new-api.js and explain the differences" --allow-all-tools
```

## Find out more

For a complete list of the command line options and slash commands that you can use with Copilot CLI, do one of the following:

- Enter `?` in the prompt box in an interactive session.
- Enter `copilot help` in your terminal.

For additional information use one of the following commands in your terminal:

### Configuration settings

```bash
copilot help config
```

You can adjust the configuration settings by editing the `config.json` file, which is located, by default, in the `~/.config` directory. This location can be changed by setting the `XDG_CONFIG_HOME` environment variable.

### Environment variables

```bash
copilot help environment
```

### Available logging levels

```bash
copilot help logging
```

### Tool permissions

```bash
copilot help permissions
```

## Feedback

If you have any feedback about GitHub Copilot CLI, please let us know by using the `/feedback` slash command in an interactive session and choosing one of the options. You can complete a private feedback survey, submit a bug report, or suggest a new feature.

For MCP-specific feedback or issues, please visit the [Copilot MCP Server repository](https://github.com/x51xxx/copilot-mcp-server/issues).

## Next steps

- **Learn about security**: [Security Considerations](./security)
- **Understand tool permissions**: [Tool Permissions](./tool-permissions)
- **Explore use cases**: [Use Cases](./use-cases)
- **Try examples**: [Usage Examples](./usage-examples)

### Simple questions

```bash
copilot -p "What is the difference between let and const in JavaScript?"
```

### File analysis

```bash
# Analyze a specific file
copilot -p "Explain what this file does" --add-dir . --allow-all-tools
cd /path/to/your/project
copilot -p "Analyze the main.js file and explain its purpose" --allow-all-tools
```

### Code generation

```bash
copilot -p "Create a Python function that calculates the factorial of a number" --allow-all-tools
```

### Code modification

```bash
copilot -p "Add error handling to the database connection function in src/db.js" --allow-all-tools
```

## Interactive Mode Examples

Start interactive mode:

```bash
copilot
```

Then try these prompts:

### Project analysis

```
Analyze this React project and identify potential performance improvements
```

### Git operations

```
Show me the last 3 commits and their changes
```

### Code refactoring

```
Refactor the UserService class to use async/await instead of promises
```

### Documentation

```
Generate API documentation for all endpoints in src/routes/
```

## MCP Integration Examples

### Using ask-copilot tool

#### Basic usage

```typescript
{
  "prompt": "Explain the architecture of this Node.js application",
  "allowAllTools": true,
  "addDir": ["."]
}
```

#### Secure usage with limited permissions

```typescript
{
  "prompt": "Review the security of the authentication module",
  "allowAllTools": false,
  "allowTool": ["read"],
  "denyTool": ["write", "shell"],
  "addDir": ["./src/auth"]
}
```

#### Change mode for structured edits

```typescript
{
  "prompt": "Update all React components to use functional components with hooks",
  "changeMode": true,
  "allowAllTools": true,
  "addDir": ["./src/components"]
}
```

### Using batch-copilot tool

#### Processing multiple files

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
  "parallel": false,
  "stopOnError": true,
  "allowAllTools": true,
  "addDir": ["./src"]
}
```

#### Parallel processing (use with caution)

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
    }
  ],
  "parallel": true,
  "allowAllTools": false,
  "allowTool": ["shell(npm test)"],
  "workingDir": "."
}
```

### Using review-copilot tool

#### Security review

```typescript
{
  "target": "@src/auth/",
  "reviewType": "security",
  "severity": "medium",
  "outputFormat": "markdown",
  "includeFixSuggestions": true,
  "includePriorityRanking": true,
  "maxIssues": 20,
  "allowAllTools": false,
  "allowTool": ["read"],
  "addDir": ["./src"]
}
```

#### Performance review

```typescript
{
  "target": "@src/api/",
  "reviewType": "performance",
  "severity": "high",
  "outputFormat": "json",
  "includeFixSuggestions": true,
  "generateReport": true,
  "allowAllTools": true,
  "addDir": ["./src"]
}
```

#### Comprehensive code review

```typescript
{
  "target": "@.",
  "reviewType": "comprehensive",
  "severity": "low",
  "excludePatterns": ["node_modules/**", "dist/**", "*.test.js"],
  "maxIssues": 50,
  "generateReport": true,
  "allowAllTools": true,
  "addDir": ["."]
}
```

## Advanced Examples

### Working with GitHub repositories

```bash
# List open pull requests
copilot -p "List all my open PRs across all repositories" --allow-all-tools

# Create a pull request
copilot -p "Create a PR that adds ESLint configuration to this project" --allow-all-tools

# Review a specific PR
copilot -p "Review PR #123 in owner/repo and check for security issues" --allow-all-tools
```

### CI/CD integration

```bash
# Create GitHub Actions workflow
copilot -p "Create a GitHub Actions workflow for Node.js that runs tests on PR and deploys to staging on merge to main" --allow-all-tools

# Analyze build failures
copilot -p "Check the last failed CI build and suggest fixes" --allow-all-tools
```

### Database operations

```bash
# Generate migration scripts
copilot -p "Generate a database migration to add user roles table with appropriate foreign keys" --allow-all-tools

# Optimize queries
copilot -p "Review the database queries in src/models/ and suggest optimizations" --allow-all-tools
```

### Documentation generation

```bash
# Generate README
copilot -p "Create a comprehensive README.md for this project including setup instructions and API documentation" --allow-all-tools

# Generate API docs
copilot -p "Generate OpenAPI specification for all REST endpoints in this Express.js application" --allow-all-tools
```

## Error handling and debugging

### Debugging with Copilot

```bash
# Analyze error logs
copilot -p "Analyze the error logs in logs/error.log and suggest fixes" --add-dir ./logs --allow-all-tools

# Debug failing tests
copilot -p "The tests in test/user.test.js are failing. Analyze and fix the issues" --allow-all-tools
```

### Troubleshooting MCP integration

#### Test MCP connectivity

```typescript
{
  "name": "ping",
  "arguments": {
    "prompt": "Test MCP connection"
  }
}
```

#### Check CLI versions

```typescript
{
  "name": "version",
  "arguments": {}
}
```

#### Get help information

```typescript
{
  "name": "help",
  "arguments": {}
}
```

## Best practices examples

### Secure development workflow

```bash
# Security-focused review
copilot -p "Perform a security audit of the authentication system" \
  --allow-tool 'read' \
  --deny-tool 'write' \
  --deny-tool 'shell' \
  --add-dir ./src/auth
```

### Code quality improvement

```typescript
{
  "target": "@src/",
  "reviewType": "code-quality",
  "severity": "medium",
  "includeFixSuggestions": true,
  "excludePatterns": ["*.test.js", "node_modules/**"],
  "allowAllTools": false,
  "allowTool": ["read", "write"],
  "denyTool": ["shell"]
}
```

### Gradual migration workflow

```bash
# Step 1: Analyze current code
copilot -p "Analyze this jQuery codebase and create a migration plan to React" --allow-all-tools

# Step 2: Create migration scripts
copilot -p "Create utility scripts to help migrate jQuery components to React" --allow-all-tools

# Step 3: Migrate incrementally
copilot -p "Convert the user profile component from jQuery to React" --allow-all-tools
```

## Integration with development tools

### VS Code integration

```bash
# Generate VS Code configuration
copilot -p "Create VS Code workspace settings for this TypeScript React project with appropriate extensions and settings" --allow-all-tools
```

### Docker integration

```bash
# Generate Dockerfile
copilot -p "Create a production-ready Dockerfile for this Node.js application with multi-stage builds" --allow-all-tools

# Docker compose for development
copilot -p "Create docker-compose.yml for local development with database, Redis, and the application" --allow-all-tools
```

These examples demonstrate the versatility and power of GitHub Copilot CLI for various development workflows. Start with simple examples and gradually explore more advanced use cases as you become comfortable with the tool.
