# Copilot MCP Tool

<div align="center">

[![GitHub Release](https://img.shields.io/github/v/release/x51xxx/copilot-mcp-server?logo=github&label=GitHub)](https://github.com/x51xxx/copilot-mcp-server/releases)
[![npm version](https://img.shields.io/npm/v/@trishchuk/copilot-mcp-server)](https://www.npmjs.com/package/@trishchuk/copilot-mcp-server)
[![npm downloads](https://img.shields.io/npm/dt/@trishchuk/copilot-mcp-server)](https://www.npmjs.com/package/@trishchuk/copilot-mcp-server)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Open Source](https://img.shields.io/badge/Open%20Source-❤️-red.svg)](https://github.com/x51xxx/copilot-mcp-server)

</div>

**Copilot MCP Tool** is an open‑source Model Context Protocol (MCP) server that connects your IDE or AI assistant (Claude, Cursor, etc.) to **GitHub Copilot CLI**. It enables non‑interactive automation, safe tool execution with permissions, and large‑scale code analysis via `@` file references. Built for reliability and speed, it streams progress updates, and integrates cleanly with standard MCP clients for code review, refactoring, documentation, and CI automation.

- **Primary**: Ask GitHub Copilot CLI questions from your MCP client, with comprehensive tool management
- **Advanced**: Batch processing, code review, and brainstorming capabilities

<a href="https://glama.ai/mcp/servers/@trishchuk/copilot-mcp-server">
  <img width="380" height="200" src="https://glama.ai/mcp/servers/@trishchuk/copilot-mcp-server/badge" alt="Copilot MCP server" />
</a>

## TLDR: [![Claude](https://img.shields.io/badge/Claude-D97757?logo=claude&logoColor=fff)](#) + GitHub Copilot CLI

**Goal**: Use GitHub Copilot CLI directly from your MCP-enabled editor to analyze and edit code efficiently.

## Prerequisites

Before using this tool, ensure you have:

1. **[Node.js](https://nodejs.org/)** (v18.0.0 or higher)
2. **[GitHub Copilot CLI](https://github.com/github/copilot-cli)** - Required

### One-Line Setup

```bash
claude mcp add copilot-cli -- npx -y @trishchuk/copilot-mcp-server
```

### Verify Installation

Type `/mcp` inside Claude Code to verify the Copilot MCP is active.

---

### Alternative: Import from Claude Desktop

If you already have it configured in Claude Desktop:

1. Add to your Claude Desktop config:

```json
"copilot-cli": {
  "command": "npx",
  "args": ["-y", "@trishchuk/copilot-mcp-server"]
}
```

2. Import to Claude Code:

```bash
claude mcp add-from-claude-desktop
```

## Configuration

Register the MCP server with your MCP client:

### For NPX Usage (Recommended)

Add this configuration to your Claude Desktop config file:

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

### For Global Installation

If you installed globally, use this configuration instead:

```json
{
  "mcpServers": {
    "copilot-cli": {
      "command": "copilot-mcp",
      "env": {
        "COPILOT_MODEL": "claude-sonnet-4.5"
      }
    }
  }
}
```

**Configuration File Locations:**

- **Claude Desktop**:
  - **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
  - **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
  - **Linux**: `~/.config/claude/claude_desktop_config.json`

After updating the configuration, restart your terminal session.

### Environment Variables

Configure default behavior with environment variables:

#### `COPILOT_MODEL` - Default AI Model

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
# Set for current session
export COPILOT_MODEL=claude-sonnet-4.5

# Permanently (add to ~/.bashrc or ~/.zshrc)
echo 'export COPILOT_MODEL=claude-sonnet-4.5' >> ~/.zshrc
```

**Available models**:

- `claude-sonnet-4.5` - Default, best for code generation
- `claude-sonnet-4` - Faster version
- `gpt-5` - OpenAI GPT-5

**Priority**: `model` parameter > `COPILOT_MODEL` env > Copilot CLI default (`claude-sonnet-4.5`)

**Override in requests**:

```
# Uses COPILOT_MODEL
Use ask tool to analyze @src/

# Overrides with gpt-5
Use ask tool with model gpt-5 to analyze @src/
```

#### `COPILOT_MCP_CWD` - Working Directory

**Purpose**: Sets the working directory for Copilot CLI command execution. This is especially important when the MCP server starts from a different directory than your project (e.g., from home directory in IDE integrations).

**Method 1: In MCP Configuration (Recommended for IDE)**

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

**Method 2: System Environment Variable**

```bash
# Set for current session
export COPILOT_MCP_CWD=/path/to/your/project

# Permanently (add to ~/.bashrc or ~/.zshrc)
echo 'export COPILOT_MCP_CWD=/path/to/your/project' >> ~/.zshrc
```

**Resolution Priority**:

1. `workingDir` parameter in request (highest)
2. `COPILOT_MCP_CWD` env variable
3. `PWD` or `INIT_CWD` env variables
4. Auto-inferred from `@path` in prompt
5. `process.cwd()` (lowest)

**Override in requests**:

```
# Use explicit workingDir parameter
Use ask tool with workingDir "/path/to/project" to analyze the codebase
```

**For IntelliJ IDEA / IDE Users**: If Copilot CLI cannot find your project files, set `COPILOT_MCP_CWD` in your MCP server configuration to point to your project directory.

See [Getting Started Guide](https://x51xxx.github.io/copilot-mcp-tool/getting-started#environment-variables) for full configuration details.

## Example Workflow

- **Natural language**: "use copilot to explain index.html", "understand this repo with @src", "look for vulnerabilities and suggest fixes"
- **Claude Code**: Type `/copilot` to access the MCP server tools.

## Usage Examples

### GitHub Copilot CLI

```javascript
// Use GitHub Copilot CLI for analysis
'explain the architecture of @src/';

// Code review with specific focus
'use copilot to review @src/main.ts for security vulnerabilities';

// Batch processing multiple files
'use batch to refactor all JavaScript files in @src/ for ES6 syntax';

// Comprehensive code review
'use review to perform security review of @api/ with high severity filter';
```

### With File References (using @ syntax)

- `ask copilot to analyze @src/main.ts and explain what it does`
- `use copilot to summarize @. the current directory`
- `analyze @package.json and list dependencies using copilot`

### General Questions (without files)

- `ask copilot to explain div centering`
- `ask copilot about best practices for React development`
- `use copilot for TypeScript debugging help`

### Advanced Examples

```javascript
// GitHub Copilot CLI batch processing
'use batch to update all React components in @src/components/ for React 18 patterns';

// Comprehensive code review
'use review for security review of @api/ with critical severity filter and fix suggestions';

// Multiple task processing
'use batch to: 1) add JSDoc comments to @utils.js, 2) fix ESLint issues in @main.ts, 3) update imports in @index.js';
```

### Brainstorming & Ideation

- `brainstorm ways to optimize our CI/CD pipeline using SCAMPER method`
- `use copilot to brainstorm 10 innovative features for our app`
- `ask copilot to generate product ideas for the healthcare domain with design-thinking approach`

### Tool Permissions & Safety

GitHub Copilot CLI supports tool permissions and directory access controls. This server defaults to allowing all tools for non-interactive mode.

- `use copilot to create and run a Python script that processes data`
- `ask copilot to safely test @script.py and explain what it does`

### Tools (for the AI)

These tools are designed to be used by the AI assistant.

#### Primary Tools (GitHub Copilot CLI)

- **`ask`**: Executes GitHub Copilot CLI with comprehensive tool and directory management.
  - Supports `@` file references for including file content
  - Tool permissions: `allowAllTools`, `allowTool`, `denyTool`
  - Directory access: `addDir` for granting file system access
  - Advanced options: `logLevel`, `resume` (session management), `screenReader` support
  - Session management and logging controls

- **`batch`**: Processes multiple atomic tasks with GitHub Copilot CLI in batch mode.
  - Supports parallel or sequential execution
  - Priority-based task ordering (high, normal, low)
  - Comprehensive error handling and progress reporting
  - Stop-on-error or continue-on-error modes
  - Detailed execution reports with timing and status

- **`review`**: Comprehensive code review using GitHub Copilot CLI.
  - Multiple review types: `security`, `performance`, `code-quality`, `best-practices`, `architecture`, `testing`, `documentation`, `accessibility`, `comprehensive`
  - Severity filtering: `low`, `medium`, `high`, `critical`
  - Output formats: `markdown`, `json`, `text`
  - Fix suggestions and priority ranking
  - File pattern exclusions and issue limits

#### Utility Tools

- **`brainstorm`**: Generate novel ideas with structured methodologies.
  - Multiple frameworks: divergent, convergent, SCAMPER, design-thinking, lateral
  - Domain-specific context (software, business, creative, research, product, marketing)
  - Configurable idea count and analysis depth
  - Includes feasibility, impact, and innovation scoring
  - Example: `brainstorm prompt:"ways to improve code review process" domain:"software" methodology:"scamper"`

- **`ping`**: A simple test tool that echoes back a message.
  - Use to verify MCP connection is working
  - Example: `/copilot:ping (MCP) "Hello from Copilot MCP!"`

- **`Help`**: Shows CLI help text for GitHub Copilot.
  - Automatically detects available CLI tools
  - Displays installation instructions if tools are missing

- **`version`**: Shows version information for all CLI tools and MCP server.
  - Reports GitHub Copilot CLI, Node.js, and MCP server versions
  - Includes installation commands for missing tools

- **`timeout-test`**: Test tool for timeout prevention.
  - Runs for a specified duration in milliseconds
  - Useful for testing long-running operations

### Slash Commands (for the User)

You can use these commands directly in Claude Code's interface (compatibility with other clients has not been tested).

- **/analyze**: Analyzes files or directories using Copilot, or asks general questions.
  - **`prompt`** (required): The analysis prompt. Use `@` syntax to include files (e.g., `/analyze prompt:@src/ summarize this directory`) or ask general questions (e.g., `/analyze prompt:Please use a web search to find the latest news stories`).
- **/review**: Performs comprehensive code review using Copilot.
  - **`target`** (required): Files/directories to review (e.g., `/review target:@src/` or `/review target:@main.js`).
  - **`reviewType`** (optional): Type of review - security, performance, code-quality, etc.
- **/batch**: Processes multiple tasks in batch mode.
  - **`tasks`** (required): Array of tasks to process.
- **/help**: Displays CLI help information for available tools.
- **/ping**: Tests the connection to the server.
  - **`message`** (optional): A message to echo back.

## Acknowledgments

This project was inspired by the excellent work from [jamubc/gemini-mcp-tool](https://github.com/jamubc/gemini-mcp-tool). Special thanks to [@jamubc](https://github.com/jamubc) for the original MCP server architecture and implementation patterns.

## Contributing

Contributions are welcome! Please submit pull requests or report issues through GitHub.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

**Disclaimer:** This is an unofficial, third-party tool and is not affiliated with, endorsed, or sponsored by GitHub or Microsoft.
