# Copilot CLI Changelog Integration

## Supported Versions

This MCP server supports **GitHub Copilot CLI v0.0.333+**.

Latest integrated features from **v0.0.346** (2025-10-19).

---

## Recent Integrations

### ✅ v0.0.343 - Claude Haiku 4.5 Model

**Status**: Integrated
**Feature**: New cost-effective model available via `model: "claude-haiku-4.5"`

**Benefits**:

- **0.33x cost multiplier** - 3x cheaper than standard models
- Fastest response times
- Ideal for quick tasks and budget-conscious usage

**Usage**:

```typescript
{
  "prompt": "Fix typo in README.md",
  "model": "claude-haiku-4.5"
}
```

---

### ✅ v0.0.343 - Additional MCP Config

**Status**: Integrated
**Feature**: Temporary MCP server configuration via `additionalMcpConfig` parameter

**Benefits**:

- Add MCP servers on-the-fly without modifying global config
- Test MCP servers before permanent installation
- Override existing MCP server configurations per-session

**Usage**:

```typescript
{
  "prompt": "Use custom tool",
  "additionalMcpConfig": {
    "mcpServers": {
      "custom-tool": {
        "command": "node",
        "args": ["custom-server.js"]
      }
    }
  }
}

// Or from file:
{
  "prompt": "Use custom tool",
  "additionalMcpConfig": "@/path/to/mcp-config.json"
}
```

---

### ✅ v0.0.340 - Allow All Paths

**Status**: Integrated
**Feature**: Automated path approval via `allowAllPaths: true`

**Benefits**:

- Skip path approval prompts for automated workflows
- Useful for CI/CD and batch processing
- **Caution**: Use only in trusted environments

**Usage**:

```typescript
{
  "prompt": "Refactor all files",
  "allowAllPaths": true,
  "allowAllTools": true
}
```

---

### ⚠️ v0.0.340 - Environment Variable Syntax Change

**Status**: Documented (Breaking Change)
**Feature**: MCP config env variables require `${VAR}` syntax

**Impact**:

- **Before**: `"API_KEY": "MY_API_KEY"` (treated as literal)
- **After**: `"API_KEY": "${MY_API_KEY}"` (resolved from environment)

**Migration**:
Update `~/.copilot/mcp-config.json`:

```json
{
  "mcpServers": {
    "my-server": {
      "env": {
        "API_KEY": "${MY_API_KEY}" // Add ${}
      }
    }
  }
}
```

---

## Not Applicable (CLI-Internal Features)

These features work automatically and don't require MCP server changes:

### v0.0.344 - Multi-line Input Support

- Kitty protocol support
- `/terminal-setup` command
- Automatically available in compatible terminals

### v0.0.344 - Detached Bash Processes

- Background process support
- Automatic handling by Copilot CLI

### v0.0.344 - GitHub MCP Server in Prompt Mode

- Internal CLI feature
- No action needed from MCP server

### v0.0.342+ - Session Logging Improvements

- New session format in `~/.copilot/session-state`
- Legacy sessions migrated automatically

### v0.0.336+ - Proxy Support

- `HTTPS_PROXY` / `HTTP_PROXY` environment variables
- Automatically picked up by Node.js

### v0.0.342+ - Persistent Log Level

- `log_level` option in `~/.copilot/config`
- Internal CLI configuration

---

## Version Compatibility

| Copilot CLI Version | MCP Server Support | Notes                        |
| ------------------- | ------------------ | ---------------------------- |
| v0.0.346+           | ✅ Full            | Latest features              |
| v0.0.340 - v0.0.345 | ✅ Full            | Breaking change for env vars |
| v0.0.333 - v0.0.339 | ✅ Core features   | Missing latest features      |
| < v0.0.333          | ⚠️ Limited         | Update recommended           |

---

## Upgrade Guide

### From v0.0.339 or Earlier

1. **Update environment variable syntax**:
   - Add `${}` wrappers to all env variable references in MCP configs

2. **Test new models**:

   ```bash
   # Try the new budget-friendly model
   copilot -p "test prompt" --model claude-haiku-4.5
   ```

3. **Verify compatibility**:
   ```bash
   copilot --version  # Should be >= 0.0.340
   ```

### From v0.0.340+

No breaking changes. New features are backwards compatible.

---

## Future Integrations

Features under consideration:

- Usage tracking API integration
- Custom model configuration
- Advanced session management

---

## Resources

- [Copilot CLI Releases](https://github.com/github/copilot-cli/releases)
- [MCP Server Documentation](/getting-started)
- [API Reference](/api/tools/ask)
