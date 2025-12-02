# Working Directory Resolution in Copilot MCP Server

## Overview

The Copilot MCP Server implements an intelligent working directory (PWD) resolution system to ensure GitHub Copilot CLI has proper access to project files, especially when the MCP server starts from outside the project directory.

---

## Problem Statement

### Initial Issue

When MCP servers are launched by IDE clients (like IntelliJ IDEA, VSCode, Claude Desktop), they often start from:

- User's home directory (`~/`)
- System directories
- IDE installation directory

This creates problems:

1. **File Access Failures**: Copilot CLI cannot access project files when running from wrong directory
2. **Path Resolution Errors**: Relative paths in prompts don't resolve correctly
3. **`@path` Syntax Breaks**: File references like `@src/main.ts` fail when cwd is incorrect
4. **`ENOTDIR` Errors**: Passing file paths as `cwd` instead of directories causes crashes

### Example of the Problem

```bash
# MCP server starts from home directory
MCP Server CWD: /Users/username/

# User tries to analyze project file
User prompt: "Analyze @/Users/username/projects/my-app/src/main.ts"

# Copilot CLI receives wrong cwd
Copilot CLI CWD: /Users/username/  # ❌ Wrong - can't access project files
```

---

## Solution: Intelligent Working Directory Resolution

The server implements a **comprehensive fallback chain** with automatic project root detection.

### Resolution Priority (Highest to Lowest)

```typescript
1. Explicit workingDir parameter (highest priority)
2. Environment variables: COPILOT_MCP_CWD > PWD > INIT_CWD
3. Automatic inference from @path syntax in prompt
4. process.cwd() (lowest priority)
```

### Key Components

#### 1. `resolveWorkingDirectory()` Function

Located in `src/utils/copilotExecutor.ts:141-201`

Main orchestrator that implements the fallback chain.

```typescript
function resolveWorkingDirectory(
  workingDir?: string, // Explicit parameter
  prompt?: string // For @path inference
): string | undefined;
```

#### 2. `findProjectRoot()` Function

Located in `src/utils/copilotExecutor.ts:48-99`

Intelligently detects project root by walking up the directory tree looking for markers.

**Supported Project Markers**:

- `package.json` (Node.js/JavaScript)
- `.git` (Git repositories)
- `pyproject.toml` (Python)
- `Cargo.toml` (Rust)
- `go.mod` (Go)
- `pom.xml`, `build.gradle` (Java)
- `composer.json` (PHP)

**Algorithm**:

```typescript
1. Start from provided path (file or directory)
2. If path is a file, use its parent directory
3. Walk up tree (max 10 levels) looking for markers
4. Return first directory containing a marker
5. Fallback to starting directory if no marker found
```

#### 3. `ensureDirectory()` Function

Located in `src/utils/copilotExecutor.ts:101-124`

Guarantees that resolved path always points to a directory, never a file.

```typescript
function ensureDirectory(path?: string): string | undefined {
  // If path is a file, returns its parent directory
  // If path is a directory, returns it as-is
  // Handles edge cases and errors gracefully
}
```

---

## How It Works: Step-by-Step

### Priority 1: Explicit `workingDir` Parameter

**Highest priority** - User explicitly specifies the working directory.

```typescript
// Example: ask tool with explicit workingDir
{
  "prompt": "Analyze the codebase",
  "workingDir": "/Users/username/projects/my-app"
}
```

**Flow**:

```
1. Check if workingDir provided
2. Validate it exists and is a directory
3. If valid → Use it
4. If invalid → Log warning and continue to Priority 2
```

### Priority 2: Environment Variables

**Second priority** - Read from environment variables in order:

```bash
COPILOT_MCP_CWD  # Highest priority env var
PWD              # Standard Unix variable
INIT_CWD         # Node.js initial directory
```

**Configuration Example**:

```json
// MCP client configuration (e.g., Claude Desktop)
{
  "mcpServers": {
    "copilot-cli": {
      "command": "npx",
      "args": ["-y", "@trishchuk/copilot-mcp-server"],
      "env": {
        "COPILOT_MCP_CWD": "/Users/username/projects/my-app"
      }
    }
  }
}
```

**Flow**:

```
1. Check COPILOT_MCP_CWD
2. If not set, check PWD
3. If not set, check INIT_CWD
4. Validate first available value
5. If valid → Use it
6. If invalid → Continue to Priority 3
```

### Priority 3: Automatic Inference from `@path` Syntax

**Third priority** - Extract working directory from `@path` mentions in prompt.

**Supported Formats**:

```typescript
// Unquoted paths
@/absolute/path/to/file.ts
@/home/user/project/src/main.ts

// Quoted paths with spaces (Windows compatible)
@"C:\\Users\\Jane Doe\\Projects\\app\\file.ts"
@'/Users/Jane Doe/Projects/app/file.ts'
```

**Algorithm**:

```
1. Scan prompt for all @path mentions using regex
2. For each path found:
   a. Check if it's an absolute path
   b. Check if it exists on filesystem
   c. Find project root using findProjectRoot()
   d. If project root found → Use it
   e. Otherwise try next @path
3. Fallback to Priority 4 if no valid path found
```

**Example**:

```typescript
// User prompt with @path
{
  "prompt": "Explain what @/Users/username/projects/my-app/src/main.ts does"
}

// Server automatically:
// 1. Extracts: /Users/username/projects/my-app/src/main.ts
// 2. Finds parent: /Users/username/projects/my-app/src/
// 3. Searches up for project markers
// 4. Finds: /Users/username/projects/my-app/ (has package.json)
// 5. Sets cwd: /Users/username/projects/my-app/
```

### Priority 4: `process.cwd()`

**Lowest priority** - Fallback to Node.js process working directory.

```typescript
// Last resort - use wherever the MCP server was started
const cwd = process.cwd();
```

---

## Configuration Guide

### Method 1: Environment Variable (Recommended for IDEs)

**Best for**: IntelliJ IDEA, WebStorm, PyCharm, other IDEs

```json
// ~/.config/Code/User/globalStorage/rooveterinaryinc.roo-cline/settings/cline_mcp_settings.json
{
  "mcpServers": {
    "copilot-cli": {
      "command": "npx",
      "args": ["-y", "@trishchuk/copilot-mcp-server"],
      "env": {
        "COPILOT_MCP_CWD": "${workspaceFolder}" // VSCode variable
      }
    }
  }
}
```

**For IntelliJ IDEA**:

```json
{
  "mcpServers": {
    "copilot-cli": {
      "command": "npx",
      "args": ["-y", "@trishchuk/copilot-mcp-server"],
      "env": {
        "COPILOT_MCP_CWD": "/absolute/path/to/your/project"
      }
    }
  }
}
```

### Method 2: Per-Request Parameter

**Best for**: Dynamic projects, automated scripts

```typescript
// Each request can specify workingDir
{
  "prompt": "Analyze the code",
  "workingDir": "/path/to/project"
}
```

### Method 3: Rely on Automatic Inference

**Best for**: Interactive use with `@path` syntax

```typescript
// No configuration needed
// Just use @path with absolute paths
{
  "prompt": "What does @/Users/me/project/src/main.ts do?"
}
// Server automatically detects project root
```

---

## Edge Cases Handled

### 1. File Path vs Directory Path

**Problem**: User passes file path, but `cwd` must be directory

**Solution**: `ensureDirectory()` automatically extracts parent directory

```typescript
// Input: /project/src/main.ts (file)
// Output: /project/src/ (directory)
```

### 2. Spaces in Paths (Windows)

**Problem**: Windows paths with spaces in usernames

**Solution**: Support quoted paths in `@path` syntax

```typescript
// Supported formats:
@"C:\\Users\\Jane Doe\\Projects\\app\\file.ts"
@'C:\\Users\\Jane Doe\\Projects\\app\\file.ts'
```

### 3. Multiple `@path` Mentions

**Problem**: Prompt has multiple file references

**Solution**: Iterate through all until finding valid absolute path

```typescript
prompt: 'Compare @relative/path.ts and @/absolute/path/file.ts';
//       ^ Skipped (relative)      ^ Used (absolute + exists)
```

### 4. No Project Markers

**Problem**: Directory has no standard project markers

**Solution**: Fallback to the path itself

```typescript
// If no package.json, .git, etc. found
// Returns the starting directory as fallback
```

### 5. Symlinks and Mounted Drives

**Problem**: Symlinked directories might break path resolution

**Solution**: Node.js `fs.statSync()` automatically resolves symlinks

---

## Debugging Working Directory Issues

### Enable Debug Logging

```typescript
// The server logs all working directory decisions
Logger.debug(`Using explicit working directory: ${explicitDir}`);
Logger.debug(`Using environment variable working directory: ${envDir}`);
Logger.debug(`Inferred working directory from @path: ${projectDir}`);
Logger.debug(`Using process.cwd() as working directory: ${cwd}`);
```

### Check Effective Working Directory

Add logging to your tool execution:

```typescript
{
  "prompt": "What is the current working directory?",
  "logLevel": "debug"
}
```

### Common Issues and Solutions

#### Issue: "Permission denied accessing ./src"

**Cause**: Wrong working directory

**Solutions**:

1. Set `COPILOT_MCP_CWD` environment variable
2. Use `workingDir` parameter
3. Use absolute paths with `@` syntax

#### Issue: "`ENOTDIR`: not a directory"

**Cause**: File path passed as `cwd` (fixed in v1.2.0)

**Solution**: Upgrade to v1.2.0+ which includes `ensureDirectory()` fix

#### Issue: "Cannot find module 'package.json'"

**Cause**: Wrong project root detected

**Solution**: Ensure project has recognizable marker (`package.json`, `.git`, etc.)

---

## Performance Considerations

### Caching

Working directory is resolved **once per request**, not cached globally.

**Rationale**: Different requests might target different projects.

### File System Calls

- **`existsSync()`**: Called multiple times during resolution
- **`statSync()`**: Called to verify directories
- **Impact**: Minimal (~1-5ms) for typical project structures

### Optimization Tips

1. **Use explicit `workingDir`**: Skips all detection logic
2. **Set `COPILOT_MCP_CWD`**: Skips `@path` parsing
3. **Use absolute paths in `@path`**: Faster than relative path resolution

---

## Migration Guide

### From v1.1.x to v1.2.0+

**Before (v1.1.x)**:

```typescript
// Working directory was always process.cwd()
// No way to configure it
// @path parsing was limited
```

**After (v1.2.0+)**:

```typescript
// Multiple configuration options
{
  "workingDir": "/path/to/project"  // New parameter
}

// Or use environment variable
COPILOT_MCP_CWD=/path/to/project

// Or rely on automatic detection from @path
```

### Breaking Changes

**None** - All changes are backwards compatible. If no configuration is provided, behavior falls back to `process.cwd()` like before.

---

## Testing Working Directory Resolution

### Test Script

```bash
# Set environment variable
export COPILOT_MCP_CWD=/path/to/your/project

# Start MCP server
npm run dev

# Test with prompt
{
  "prompt": "List files in current directory"
}
```

### Verification Checklist

- [ ] Server starts successfully
- [ ] Copilot CLI can access project files
- [ ] `@path` syntax works with absolute paths
- [ ] Relative paths resolve correctly
- [ ] No `ENOTDIR` or permission errors
- [ ] Project root is correctly detected

---

## Related Documentation

- [Getting Started Guide](/docs/getting-started.md)
- [COPILOT_MCP_CWD Environment Variable](/CLAUDE.md#copilot_mcp_cwd)
- [File Analysis with @ Syntax](/docs/concepts/file-analysis.md)
- [CHANGELOG v1.2.0](/CHANGELOG.md#120---2025-10-20)

---

## Technical References

### Source Code Locations

- **Main Resolution Logic**: `src/utils/copilotExecutor.ts:141-201`
- **Project Root Detection**: `src/utils/copilotExecutor.ts:48-99`
- **Directory Validation**: `src/utils/copilotExecutor.ts:101-124`
- **Usage in Tools**:
  - `src/tools/ask.tool.ts:60,90,102,114`
  - `src/tools/batch.tool.ts:49,77,130,145`
  - `src/tools/review.tool.ts:52,85,175,190`
  - `src/tools/brainstorm.tool.ts:136,164,195`

### Related Issues

- [Issue #261](https://github.com/github/copilot-cli/issues/261) - Windows path handling
- Critical bug fix in v1.2.0 - `ENOTDIR` errors

---

## Summary

The working directory resolution system provides:

✅ **Automatic detection** from `@path` syntax
✅ **Flexible configuration** via env vars or parameters
✅ **Intelligent project root finding** for 8+ languages
✅ **Windows compatibility** with spaces in paths
✅ **Robust fallback chain** ensuring it always works
✅ **Zero breaking changes** - backwards compatible

This ensures GitHub Copilot CLI always has proper access to your project files, regardless of where the MCP server starts. 🚀
