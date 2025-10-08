# version Tool

Display version and system information for GitHub Copilot CLI and MCP server.

## Overview

The `version` tool provides comprehensive system information including versions of GitHub Copilot CLI, Node.js, platform details, and MCP server version. This is useful for diagnostics, troubleshooting, and verifying your installation.

## Syntax

```javascript
{
  "name": "version",
  "arguments": {}
}
```

## Parameters

This tool accepts no parameters.

## Examples

### Basic Version Check

```javascript
{
  "name": "version",
  "arguments": {}
}
```

### Example Output

```
**System Information:**
- GitHub Copilot CLI: 0.0.330
- Node.js: v20.11.0
- Platform: darwin
- MCP Server: @trishchuk/copilot-mcp-server v1.0.0

**Installation Commands:**
- GitHub Copilot CLI: `npm install -g @github/copilot-cli`

**Primary Tools:** ask, batch, review, brainstorm
```

## Use Cases

### 1. Verify Installation

Check that all required components are installed:

```javascript
// In Claude or any MCP client
"use version to check my installation"

// Or direct tool call
{ "name": "version", "arguments": {} }
```

### 2. Troubleshooting

When reporting issues, include version information:

```javascript
// Get system info for bug report
{ "name": "version", "arguments": {} }

// Copy output to issue description
```

### 3. Update Verification

After updating tools, verify new versions:

```bash
# Update Copilot CLI
npm update -g @github/copilot-cli

# Then check version
{ "name": "version", "arguments": {} }
```

### 4. Environment Validation

Verify environment before running complex tasks:

```javascript
// Check environment first
{ "name": "version", "arguments": {} }

// Then proceed with tasks
{
  "name": "ask",
  "arguments": {
    "prompt": "analyze @src/"
  }
}
```

## Output Information

The tool provides:

1. **GitHub Copilot CLI Version**
   - Displays installed version number
   - Shows "Not installed" if CLI is not available
   - Example: `0.0.330`

2. **Node.js Version**
   - Current Node.js runtime version
   - Example: `v20.11.0`

3. **Platform**
   - Operating system identifier
   - Values: `darwin` (macOS), `linux`, `win32` (Windows)

4. **MCP Server Version**
   - Current MCP server package version
   - Package name: `@trishchuk/copilot-mcp-server`

5. **Installation Commands**
   - Quick reference for installing missing components

6. **Primary Tools List**
   - Available main tools in this MCP server

## Troubleshooting

### GitHub Copilot CLI Shows "Not installed"

If the Copilot CLI shows as not installed:

1. **Install Copilot CLI:**

```bash
npm install -g @github/copilot-cli
```

2. **Verify installation:**

```bash
copilot --version
```

3. **Check PATH:**

```bash
which copilot  # macOS/Linux
where copilot  # Windows
```

### Version Mismatch

If you see unexpected versions:

1. **Update to latest:**

```bash
# Update Copilot CLI
npm update -g @github/copilot-cli

# Update MCP server
npm update -g @trishchuk/copilot-mcp-server
```

2. **Clear npm cache:**

```bash
npm cache clean --force
```

3. **Reinstall:**

```bash
npm uninstall -g @github/copilot-cli
npm install -g @github/copilot-cli
```

## Integration Examples

### Pre-flight Check Script

```javascript
// Check environment before running tasks
async function checkEnvironment() {
  const version = await mcp.call('version', {});
  console.log(version);

  // Verify Copilot CLI is installed
  if (version.includes('Not installed')) {
    throw new Error('GitHub Copilot CLI is required');
  }

  return true;
}
```

### CI/CD Integration

```yaml
# .github/workflows/check-tools.yml
- name: Verify Tool Versions
  run: |
    echo '{"method":"tools/call","params":{"name":"version","arguments":{}}}' |
    npx @trishchuk/copilot-mcp-server
```

### Health Check

```javascript
// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const version = await mcp.call('version', {});
    res.json({
      status: 'healthy',
      version: version,
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error.message,
    });
  }
});
```

## Comparison with Other Tools

| Tool      | Purpose                    | Parameters | Output          |
| --------- | -------------------------- | ---------- | --------------- |
| `version` | System information         | None       | Version details |
| `ping`    | Connectivity test          | message    | Echo response   |
| `help`    | CLI help and tool list     | None       | Help text       |
| `ask`     | Execute Copilot CLI tasks  | Multiple   | Task results    |
| `review`  | Comprehensive code reviews | Multiple   | Review findings |
| `batch`   | Batch process tasks        | Multiple   | Batch results   |

## Tips

### 1. Include in Bug Reports

Always include version information when reporting issues:

```markdown
**Environment:**

[Paste output from version tool]
```

### 2. Verify Before Updates

Check current versions before updating:

```bash
# Check current
{ "name": "version" }

# Update
npm update -g @github/copilot-cli

# Verify update
{ "name": "version" }
```

### 3. Document Your Setup

Save version output for your project documentation:

```bash
echo '{"name":"version","arguments":{}}' |
npx @trishchuk/copilot-mcp-server > VERSIONS.txt
```

## Related Tools

- [help](./help.md) - Get CLI help and available commands
- [ping](./ping.md) - Test connectivity
- [ask](./ask.md) - Execute GitHub Copilot CLI commands

## See Also

- [Troubleshooting Guide](../../resources/troubleshooting.md)
- [Installation Guide](../../getting-started.md)
- [GitHub Copilot CLI Installation](../../copilot-cli/installation.md)
- [FAQ](../../resources/faq.md)
