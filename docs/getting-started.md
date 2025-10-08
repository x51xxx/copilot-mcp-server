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
which copilot-mcp-server

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
    "copilot": {
      "command": "copilot-mcp-server"
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
- `gpt-5` (default)
- `claude-sonnet-4`
- `claude-sonnet-4.5`

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

## Environment Variables

You can configure default behavior using environment variables:

- `COPILOT_MODEL` - Default AI model (e.g., `claude-sonnet-4.5`)
- `COPILOT_TIMEOUT` - Default timeout in milliseconds (e.g., `300000`)
- `LOG_LEVEL` - Logging level: `error`, `warning`, `info`, `debug`

Example `.env` file:

```bash
COPILOT_MODEL=claude-sonnet-4.5
COPILOT_TIMEOUT=300000
LOG_LEVEL=info
```

## Support

- [GitHub Issues](https://github.com/x51xxx/copilot-mcp-server/issues)
- [Documentation](/)
- [FAQ](/resources/faq)
- [Troubleshooting Guide](/resources/troubleshooting)
