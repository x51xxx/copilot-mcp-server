---
layout: home

hero:
  name: Copilot MCP Tool
  text: Bridge GitHub Copilot CLI with MCP
  tagline: Model Context Protocol server for GitHub Copilot CLI integration. Execute tasks, analyze code, and leverage AI-powered development tools.
  image:
    src: data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🤖</text></svg>
    alt: Copilot MCP Tool
  actions:
    - theme: brand
      text: Get Started
      link: /getting-started
    - theme: alt
      text: View on GitHub
      link: https://github.com/x51xxx/copilot-mcp-server

features:
  - icon: 🤖
    title: GitHub Copilot CLI Integration
    details: Seamlessly integrate GitHub Copilot CLI capabilities through the Model Context Protocol. Execute AI-powered tasks directly from your MCP client.

  - icon: 🔧
    title: Comprehensive Tool Suite
    details: Ask questions, batch process tasks, perform code reviews, and brainstorm ideas - all through standardized MCP tools.

  - icon: 🔒
    title: Security First
    details: Fine-grained tool permissions, directory access controls, and comprehensive security features to keep your codebase safe.

  - icon: 📊
    title: Progress Streaming
    details: Real-time progress updates for long-running operations. Stay informed with detailed execution feedback.

  - icon: 🎯
    title: File Analysis
    details: Use @ syntax to reference files and images. Analyze codebases with context-aware AI assistance.

  - icon: ⚡
    title: Batch Processing
    details: Process multiple tasks efficiently with parallel or sequential execution. Ideal for mass refactoring and automated transformations.
---

## Quick Start

### Install GitHub Copilot CLI

```bash
npm install -g @github/copilot
copilot /login
```

### Install Copilot MCP Tool

```bash
npm install -g @trishchuk/copilot-mcp-server
```

### Configure Your MCP Client

Add to your MCP client configuration (e.g., Claude Desktop):

```json
{
  "mcpServers": {
    "copilot": {
      "command": "copilot-mcp-server"
    }
  }
}
```

## Core Tools

- **`ask`** - Execute GitHub Copilot CLI with file analysis and tool management
- **`batch`** - Process multiple atomic tasks in batch mode
- **`review`** - Comprehensive code review with security, performance, and quality analysis
- **`brainstorm`** - AI-powered brainstorming with structured methodologies

## Example Usage

### Ask a Question

```typescript
{
  "prompt": "Explain what @src/components/UserProfile.tsx does",
  "addDir": ["./src"],
  "allowAllTools": true
}
```

### Batch Processing

```typescript
{
  "tasks": [
    {
      "task": "Add TypeScript types to user model",
      "target": "@src/models/user.js",
      "priority": "high"
    },
    {
      "task": "Update console.log to proper logging",
      "target": "@src/",
      "priority": "normal"
    }
  ]
}
```

### Code Review

```typescript
{
  "target": "@src/auth/",
  "reviewType": "security",
  "severity": "medium",
  "includeFixSuggestions": true
}
```

## Features

### 🎯 File Analysis with @ Syntax

Reference specific files or directories using the @ syntax for context-aware analysis:

```
@src/components/Button.tsx
@src/utils/
@package.json
```

### 🔒 Security Controls

Fine-grained control over tool permissions and directory access:

- `allowAllTools` - Enable/disable all tools
- `allowTool` - Whitelist specific tools (supports glob patterns)
- `denyTool` - Blacklist specific tools
- `addDir` - Grant access to specific directories

### 📊 Progress Streaming

Real-time progress updates keep you informed during long-running operations:

```
🔍 Starting security review of @src/auth/...
📋 Analyzing authentication module...
✅ Review complete: 8 issues found
```

### ⚡ Multiple AI Models

Choose from multiple AI models:

- `gpt-5` - OpenAI GPT-5
- `claude-sonnet-4` - Anthropic Claude Sonnet 4
- `claude-sonnet-4.5` - Anthropic Claude Sonnet 4.5

## Requirements

- **Node.js** >= 18.0.0
- **GitHub Copilot CLI** (installed and authenticated)
- **MCP Client** (Claude Desktop, or any MCP-compatible client)

## Documentation

- [Installation Guide](/getting-started)
- [GitHub Copilot CLI Setup](/copilot-cli/installation)
- [API Reference](/api/tools/ask)
- [Usage Examples](/examples/basic-usage)
- [Security Considerations](/copilot-cli/security)

## License

Released under the [MIT License](https://github.com/x51xxx/copilot-mcp-server/blob/main/LICENSE).
