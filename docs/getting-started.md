# Getting Started

This guide will help you install and configure Copilot MCP Tool with your MCP client.

## Prerequisites

Before you begin, ensure you have:

- **Node.js** >= 18.0.0 installed
- A GitHub Copilot subscription
- An MCP-compatible client (e.g., Claude Desktop)

## Step 1: Install GitHub Copilot CLI

First, install and authenticate with GitHub Copilot CLI:

```bash
# Install GitHub Copilot CLI globally
npm install -g @github/copilot

# Authenticate with GitHub
copilot /login
```

Follow the authentication prompts to connect your GitHub account.

### Verify Installation

```bash
# Check version
copilot --version

# Test basic functionality
copilot -p "what is 2+2?"
```

## Step 2: Install Copilot MCP Tool

Install the Copilot MCP server:

```bash
npm install -g @trishchuk/copilot-mcp-server
```

### Verify Installation

```bash
# Check if the command is available
which copilot-mcp

# The server communicates via stdio, so running it directly won't be very useful
# It needs to be configured with an MCP client
```

## Step 3: Configure Your MCP Client

### Claude Desktop Configuration

Add the following to your Claude Desktop configuration file:

**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`

**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "copilot-cli": {
      "command": "npx",
      "args": ["-y", "@trishchuk/copilot-mcp-server"]
    }
  }
}
```

**With default model configuration**:

```json
{
  "mcpServers": {
    "copilot-cli": {
      "command": "npx",
      "args": ["-y", "@trishchuk/copilot-mcp-server"],
      "env": {
        "COPILOT_MODEL": "gpt-5"
      }
    }
  }
}
```

### Restart Claude Desktop

After adding the configuration, restart Claude Desktop to load the MCP server.

## Step 4: Verify MCP Integration

In Claude Desktop, you should now see the Copilot MCP tools available. Try a simple test:

```
Can you use the ping tool to test the Copilot MCP connection?
```

If successful, you should see a response from the ping tool.

## Basic Usage

### Ask a Question

```
Use the ask tool to analyze @package.json and explain the project dependencies
```

### Run a Code Review

```
Use the review tool to perform a security review of @src/auth/ directory
```

### Batch Processing

```
Use the batch tool to:
1. Add error handling to @src/utils/api.ts
2. Add JSDoc comments to @src/services/user.ts
```

## Configuration Options

### Directory Access

By default, the server has limited file system access. Grant access to directories using the `addDir` parameter:

```typescript
{
  "prompt": "Analyze the codebase",
  "addDir": ["./src", "./tests"]
}
```

### Tool Permissions

Control which tools Copilot can execute:

```typescript
{
  "prompt": "Review the code",
  "allowAllTools": false,
  "allowTool": ["read", "analyze"],
  "denyTool": ["write", "shell"]
}
```

### AI Model Selection

Choose which AI model to use:

```typescript
{
  "prompt": "Explain this code",
  "model": "claude-sonnet-4.5"
}
```

Available models:

- `gpt-5` (1x)
- `claude-sonnet-4` (1x)
- `claude-sonnet-4.5` (1x, default)
- `claude-haiku-4.5` (0.33x, fastest/cheapest)

## Troubleshooting

### Copilot CLI Not Found

If you see "Copilot CLI not found" errors:

1. Ensure GitHub Copilot CLI is installed: `npm install -g @github/copilot`
2. Verify it's in your PATH: `which copilot`
3. Restart your MCP client after installation

### Authentication Failed

If you see authentication errors:

1. Log in to GitHub Copilot: `copilot /login`
2. Check your subscription status: `copilot /user show`
3. Restart your MCP client

### Directory Access Denied

If you see "Permission denied" errors:

1. Add the directory to `addDir`: `"addDir": ["./src"]`
2. Use absolute paths if relative paths don't work
3. Verify the directory exists and is readable

### Tool Permission Denied

If you see "Tool denied" errors:

1. Enable all tools: `"allowAllTools": true`
2. Or allow specific tools: `"allowTool": ["shell(git status)"]`

## Next Steps

- [GitHub Copilot CLI Overview](/copilot-cli/overview)
- [API Reference](/api/tools/ask)
- [Usage Examples](/examples/basic-usage)
- [Security Considerations](/copilot-cli/security)
- [Tool Permissions Guide](/copilot-cli/tool-permissions)

## ⚠️ Important: MCP Environment Variables (Copilot CLI v0.0.340+)

If you're configuring MCP servers in `~/.copilot/mcp-config.json`, ensure you use `${VARIABLE_NAME}` syntax for environment variable references:

```json
{
  "mcpServers": {
    "my-server": {
      "command": "node",
      "args": ["server.js"],
      "env": {
        "API_KEY": "${MY_API_KEY}" // ✅ Correct
        // "API_KEY": "MY_API_KEY"  // ❌ Wrong - will be treated as literal string
      }
    }
  }
}
```

**Breaking Change**: Starting with Copilot CLI v0.0.340, environment variables must use `${VAR}` syntax. Without the `${}` wrapper, values are treated as literal strings.

## Environment Variables

You can configure default behavior using environment variables:

### `COPILOT_MODEL`

**Purpose**: Sets the default AI model for all requests to GitHub Copilot CLI.

**Available models**:

- `claude-sonnet-4.5` (1x) - Anthropic Claude Sonnet 4.5 (default, best for code generation)
- `claude-sonnet-4` (1x) - Anthropic Claude Sonnet 4 (balanced performance)
- `claude-haiku-4.5` (0.33x) - Anthropic Claude Haiku 4.5 (fastest, most economical)
- `gpt-5` (1x) - OpenAI GPT-5

**Configuration**:

**Method 1: In MCP Configuration (Recommended)**

Add the `env` field to your MCP server configuration:

```json
{
  "mcpServers": {
    "copilot-cli": {
      "command": "npx",
      "args": ["-y", "@trishchuk/copilot-mcp-server"],
      "env": {
        "COPILOT_MODEL": "claude-sonnet-4.5"
      }
    }
  }
}
```

**Method 2: System Environment Variable**

```bash
# For current session
export COPILOT_MODEL=claude-sonnet-4.5

# Permanently (add to ~/.bashrc or ~/.zshrc)
echo 'export COPILOT_MODEL=claude-sonnet-4.5' >> ~/.zshrc
source ~/.zshrc

# For Windows (PowerShell)
$env:COPILOT_MODEL = "claude-sonnet-4.5"

# For Windows (permanently)
setx COPILOT_MODEL "claude-sonnet-4.5"
```

**Model Selection Priority**:

1. **`model` parameter** in request (highest priority)
2. **`COPILOT_MODEL` variable** (medium priority)
3. **Copilot CLI default** (lowest priority, usually `gpt-5`)

**Usage Example**:

```bash
# Set default model
export COPILOT_MODEL=claude-sonnet-4.5

# Requests will use claude-sonnet-4.5
# except when another model is explicitly specified
```

**Overriding in Requests**:

```
# Will use COPILOT_MODEL (claude-sonnet-4.5)
Use the ask tool to analyze @src/main.ts

# Will use gpt-5 (override)
Use the ask tool with model gpt-5 to analyze @src/main.ts
```

### `LOG_LEVEL`

**Purpose**: Sets the logging level for the server.

**Available values**: `error`, `warning`, `info`, `debug`

```bash
export LOG_LEVEL=info
```

### Example `.env` file

Create a `.env` file in the project root:

```bash
# AI Model Configuration
COPILOT_MODEL=claude-sonnet-4.5

# Logging
LOG_LEVEL=info

# Proxy (optional)
HTTPS_PROXY=http://proxy.company.com:8080
HTTP_PROXY=http://proxy.company.com:8080
```

**Loading .env file**:

```bash
# Use dotenv to load
npm install -g dotenv-cli

# Run with .env
dotenv npx @trishchuk/copilot-mcp-server
```

## Support

- [GitHub Issues](https://github.com/x51xxx/copilot-mcp-server/issues)
- [Documentation](/)
- [FAQ](/resources/faq)
- [Troubleshooting Guide](/resources/troubleshooting)
