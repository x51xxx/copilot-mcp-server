# Installing GitHub Copilot CLI

This guide covers installing and setting up GitHub Copilot CLI for use with the MCP server.

## Prerequisites

Before installing GitHub Copilot CLI, ensure you have:

1. **Node.js** (v18.0.0 or higher)
2. **GitHub account** with Copilot subscription
3. **Git** installed and configured
4. **Terminal access** (Linux, macOS, or WSL on Windows)

## GitHub Copilot subscription requirements

GitHub Copilot CLI is available with:

- GitHub Copilot Pro
- GitHub Copilot Pro+
- GitHub Copilot Business
- GitHub Copilot Enterprise

::: info Organization policy
If you receive Copilot from an organization, the Copilot CLI policy must be enabled in the organization's settings.
:::

## Installation methods

### Method 1: npm (Recommended)

Install GitHub Copilot CLI globally using npm:

```bash
npm install -g @github/copilot-cli
```

### Method 2: Direct download

You can also download the latest release directly from the GitHub repository:

```bash
# Download and install (Linux/macOS)
curl -fsSL https://github.com/github/copilot-cli/releases/latest/download/install.sh | sh
```

### Method 3: Package managers

#### macOS (Homebrew)

```bash
brew install github/gh/copilot-cli
```

#### Windows (Chocolatey)

```bash
choco install github-copilot-cli
```

## Verify installation

After installation, verify that Copilot CLI is available:

```bash
copilot --version
```

You should see output similar to:

```
0.0.327
Commit: 0cbec74
```

## Authentication

### Interactive authentication

Start an interactive session to authenticate:

```bash
copilot
```

On first run, you'll be prompted to authenticate with GitHub. Follow the on-screen instructions to:

1. Open the provided URL in your browser
2. Enter the device code shown in the terminal
3. Authorize the GitHub Copilot CLI application

### Manual authentication

You can also use the login slash command:

```bash
copilot
# Then type: /login
```

### Verify authentication

Check your authentication status:

```bash
copilot
# Then type: /user show
```

## Configuration

### Default configuration

Copilot CLI creates a configuration file at:

- **Linux/macOS**: `~/.config/copilot/config.json`
- **Windows**: `%APPDATA%\copilot\config.json`

### Environment variables

You can customize Copilot CLI behavior with environment variables:

```bash
# Change the default model
export COPILOT_MODEL=gpt-5

# Set custom config directory
export XDG_CONFIG_HOME=/path/to/custom/config
```

### Trusted directories

Configure trusted directories for enhanced security:

```json
{
  "trusted_folders": ["/home/user/projects", "/home/user/work"]
}
```

## Integration with MCP server

### Install the MCP server

Install the Copilot MCP Tool:

```bash
npm install -g @trishchuk/copilot-mcp-server
```

### Claude Desktop configuration

Add to your Claude Desktop configuration:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "copilot-mcp": {
      "command": "npx",
      "args": ["@trishchuk/copilot-mcp-server"]
    }
  }
}
```

**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "copilot-mcp": {
      "command": "npx",
      "args": ["@trishchuk/copilot-mcp-server"]
    }
  }
}
```

### Claude Code (VS Code) configuration

For Claude Code, add the MCP server:

```bash
claude mcp add copilot-cli -- npx -y @trishchuk/copilot-mcp-server
```

## Testing the installation

### Test Copilot CLI directly

```bash
copilot -p "What is the capital of France?" --allow-all-tools
```

### Test MCP integration

In your MCP client (Claude, etc.), try:

```
use ask-copilot to tell me about TypeScript
```

### Verify all tools are available

Check available MCP tools:

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npx @trishchuk/copilot-mcp-server
```

## Troubleshooting

### Common installation issues

#### Permission errors

```bash
# Fix npm permissions (Linux/macOS)
npm config set prefix ~/.npm-global
export PATH=~/.npm-global/bin:$PATH

# Or use npx instead of global install
npx @github/copilot-cli --version
```

#### Authentication failures

```bash
# Clear authentication and retry
rm -rf ~/.config/copilot/
copilot
# Follow authentication prompts again
```

#### Network connectivity

```bash
# Test GitHub connectivity
curl -I https://api.github.com

# Use corporate proxy if needed
npm config set proxy http://proxy.company.com:8080
npm config set https-proxy https://proxy.company.com:8080
```

### CLI-specific issues

#### Command not found

```bash
# Check if CLI is in PATH
which copilot

# If not found, try full path
~/.npm-global/bin/copilot --version

# Or use npx
npx @github/copilot-cli --version
```

#### Model access issues

```bash
# Check subscription status
copilot
# Type: /user show

# Verify organization policies (if applicable)
# Contact your GitHub admin if CLI is disabled
```

### MCP integration issues

#### MCP server not responding

```bash
# Test MCP server directly
npx @trishchuk/copilot-mcp-server
# Send: {"jsonrpc":"2.0","id":1,"method":"tools/list"}
```

#### Tool permissions in MCP

```json
{
  "prompt": "test prompt",
  "allowAllTools": true,
  "addDir": ["."]
}
```

## Next steps

Once installation is complete:

1. **Explore basic usage**: [Usage Examples](./usage-examples)
2. **Learn about security**: [Security Considerations](./security)
3. **Configure tool permissions**: [Tool Permissions](./tool-permissions)
4. **Try use cases**: [Use Cases](./use-cases)

## Support

If you encounter issues:

1. Check the [Troubleshooting guide](/resources/troubleshooting)
2. Review [GitHub Copilot CLI documentation](https://docs.github.com/en/copilot/using-github-copilot/using-github-copilot-in-the-command-line)
3. Submit feedback using `/feedback` in Copilot CLI
4. Report MCP-specific issues on [GitHub](https://github.com/x51xxx/copilot-mcp-server/issues)
