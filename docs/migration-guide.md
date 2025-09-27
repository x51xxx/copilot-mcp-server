# Migration Guide: Codex to Copilot CLI

This guide helps you migrate from using Codex CLI to GitHub Copilot CLI with the MCP server.

## Overview

Version 1.2.0 introduces primary support for GitHub Copilot CLI while maintaining backward compatibility with Codex CLI. This migration provides:

- **Enhanced AI capabilities** with GitHub's latest models
- **Better tool integration** and permission management
- **Improved session management** and resumption
- **Comprehensive code review** features
- **Enterprise-grade security** controls

## What's changing

### Package name
- **Old**: `@trishchuk/codex-mcp-tool`
- **New**: `@trishchuk/copilot-mcp-tool`

### Primary tools
- **New primary**: `ask-copilot`, `batch-copilot`, `review-copilot`
- **Legacy support**: `ask-codex`, `batch-codex`, `review-codex` (still available)

### Binary name
- **Old**: `codex-mcp`
- **New**: `copilot-mcp`

## Migration steps

### Step 1: Install GitHub Copilot CLI

First, ensure you have GitHub Copilot CLI installed:

```bash
npm install -g @github/copilot-cli
```

Verify installation:
```bash
copilot --version
```

### Step 2: Update MCP server package

#### For Claude Desktop users

Update your configuration file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "copilot-mcp": {
      "command": "npx",
      "args": ["@trishchuk/copilot-mcp-tool"]
    }
  }
}
```

#### For Claude Code users

```bash
# Remove old server
claude mcp remove codex-cli

# Add new server
claude mcp add copilot-cli -- npx -y @trishchuk/copilot-mcp-tool
```

### Step 3: Update tool usage

#### Codex CLI → Copilot CLI tool mapping

| Old Tool | New Tool | Status |
|----------|----------|--------|
| `ask-codex` | `ask-copilot` | ✅ **Recommended** |
| `batch-codex` | `batch-copilot` | ✅ **Recommended** |
| `review-codex` | `review-copilot` | ✅ **Recommended** |
| `ask-codex` | `ask-codex` | ⚠️ **Legacy support** |

#### Parameter changes

**Old Codex approach** (model selection):
```typescript
{
  "prompt": "Analyze this code",
  "model": "gpt-5-codex",
  "sandbox": true,
  "approvalPolicy": "on-request"
}
```

**New Copilot approach** (tool permissions):
```typescript
{
  "prompt": "Analyze this code", 
  "allowAllTools": true,
  "addDir": ["."],
  "logLevel": "info"
}
```

### Step 4: Update workflows

#### Basic usage migration

**Before** (Codex):
```
ask codex to analyze @src/main.js and suggest improvements
```

**After** (Copilot - recommended):
```
ask copilot to analyze @src/main.js and suggest improvements
```

**Legacy support** (still works):
```
ask codex to analyze @src/main.js and suggest improvements
```

#### Batch processing migration

**Before** (Codex):
```typescript
{
  "tool": "batch-codex",
  "tasks": [...],
  "model": "gpt-5-codex",
  "sandbox": "workspace-write"
}
```

**After** (Copilot):
```typescript
{
  "tool": "batch-copilot", 
  "tasks": [...],
  "allowAllTools": true,
  "addDir": ["./src"]
}
```

#### Code review migration

**Before** (Codex):
```typescript
{
  "tool": "review-codex",
  "target": "@src/",
  "model": "o3",
  "reviewFocus": "security"
}
```

**After** (Copilot):
```typescript
{
  "tool": "review-copilot",
  "target": "@src/",
  "reviewType": "security",
  "severity": "medium",
  "includeFixSuggestions": true
}
```

## Feature comparison

| Feature | Codex CLI | Copilot CLI | Notes |
|---------|-----------|-------------|-------|
| **Models** | Multiple (gpt-5, o3, etc.) | Claude Sonnet 4 (default), GPT-5 | Copilot manages models internally |
| **Tool permissions** | Sandbox modes | Fine-grained tool control | More precise security |
| **Directory access** | Working directory | Explicit directory grants | Better isolation |
| **Session management** | Basic | Resume by session ID | Enhanced continuity |
| **File analysis** | @ syntax | @ syntax | Same functionality |
| **Batch processing** | Sequential only | Sequential + parallel | More options |
| **Code review** | Basic | Multi-type with reports | Enhanced features |

## Authentication changes

### Codex CLI authentication
```bash
# Codex uses OpenAI API key or login
export OPENAI_API_KEY=your-key
# OR
codex login
```

### Copilot CLI authentication  
```bash
# Copilot uses GitHub authentication
copilot
# Follow prompts to authenticate with GitHub
```

## Security model changes

### Codex CLI security
- **Sandbox modes**: `read-only`, `workspace-write`, `danger-full-access`
- **Approval policies**: `never`, `on-request`, `on-failure`, `untrusted`

### Copilot CLI security
- **Tool permissions**: `allowAllTools`, `allowTool`, `denyTool`
- **Directory access**: `addDir` for explicit directory grants
- **Trusted directories**: User confirmation on first access

#### Migration examples

**Codex sandbox mode**:
```typescript
{
  "sandboxMode": "workspace-write",
  "approvalPolicy": "on-request"
}
```

**Copilot equivalent**:
```typescript
{
  "allowAllTools": false,
  "allowTool": ["write", "read"],
  "addDir": ["./src", "./docs"]
}
```

## Troubleshooting migration

### Common issues and solutions

#### 1. "Copilot CLI not found"
```bash
# Install GitHub Copilot CLI
npm install -g @github/copilot-cli

# Verify installation
copilot --version
```

#### 2. "Authentication failed"
```bash
# Authenticate with GitHub
copilot
# Type: /login
# Follow authentication prompts
```

#### 3. "Directory access denied"
```typescript
// Add explicit directory access
{
  "addDir": [".", "./src", "./docs"]
}
```

#### 4. "Tool permission denied"
```typescript
// Use explicit tool permissions
{
  "allowAllTools": false,
  "allowTool": ["read", "write", "shell(git status)"]
}
```

### Compatibility mode

If you need to use both Codex and Copilot tools:

```typescript
{
  "tasks": [
    {
      "tool": "ask-copilot",  // New primary tool
      "prompt": "Analyze security"
    },
    {
      "tool": "ask-codex",    // Legacy fallback
      "prompt": "Generate with specific model",
      "model": "o3"
    }
  ]
}
```

## Testing your migration

### 1. Verify tools are available
```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | npx @trishchuk/copilot-mcp-tool
```

Should show both Copilot and Codex tools.

### 2. Test basic functionality
```typescript
// Test new Copilot tool
{
  "tool": "ask-copilot",
  "prompt": "What is TypeScript?",
  "allowAllTools": true
}

// Test legacy Codex tool  
{
  "tool": "ask-codex",
  "prompt": "What is TypeScript?",
  "model": "gpt-5-codex"
}
```

### 3. Test file analysis
```typescript
{
  "tool": "ask-copilot",
  "prompt": "Explain @package.json",
  "addDir": ["."]
}
```

### 4. Test code review
```typescript
{
  "tool": "review-copilot",
  "target": "@src/",
  "reviewType": "security",
  "generateReport": true
}
```

## Rollback plan

If you need to rollback:

### 1. Keep both packages
```bash
# Install both (old and new)
npm install -g @trishchuk/codex-mcp-tool
npm install -g @trishchuk/copilot-mcp-tool
```

### 2. Use legacy tools
```typescript
{
  "tool": "ask-codex",     // Use old tool explicitly
  "prompt": "your prompt",
  "model": "gpt-5-codex"
}
```

### 3. Revert MCP configuration
```json
{
  "mcpServers": {
    "codex-mcp": {
      "command": "npx", 
      "args": ["@trishchuk/codex-mcp-tool"]
    }
  }
}
```

## Next steps

After migration:

1. **Explore new features**: Try the enhanced code review capabilities
2. **Update documentation**: Update any internal docs or scripts
3. **Train your team**: Share the new tool capabilities and security model
4. **Monitor usage**: Use logging to track tool usage and permissions
5. **Optimize workflows**: Leverage new batch processing and session management features

## Getting help

- **Documentation**: [GitHub Copilot CLI docs](./copilot-cli/overview)
- **Troubleshooting**: [Troubleshooting guide](/resources/troubleshooting)
- **Issues**: [GitHub repository](https://github.com/x51xxx/copilot-mcp-server/issues)
- **Feedback**: Use `/feedback` in Copilot CLI

The migration maintains full backward compatibility, so you can migrate gradually and keep using Codex tools alongside new Copilot tools.