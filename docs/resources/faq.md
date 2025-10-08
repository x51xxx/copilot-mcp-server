# Frequently Asked Questions

## General Questions

### What is Copilot MCP Tool?

Copilot MCP Tool is a Model Context Protocol (MCP) server that bridges OpenAI's GitHub Copilot CLI with MCP-compatible clients like Claude Desktop and Claude Code. It enables seamless AI-powered code analysis, generation, and brainstorming directly within your development environment.

### Why use Copilot MCP Tool instead of GitHub Copilot CLI directly?

**Benefits of using Copilot MCP Tool:**

- **Non-interactive execution** - No manual prompts or confirmations needed
- **Integration** - Works seamlessly with Claude Desktop/Code
- **File references** - Use @ syntax to include files easily
- **Structured output** - Get organized responses with changeMode
- **Progress tracking** - Real-time updates for long operations
- **Multiple tools** - Access specialized tools beyond basic prompts

### Which AI models are supported?

Currently supported models via GitHub Copilot CLI:

- **gpt-5** - OpenAI's latest model, best for complex tasks
- **claude-sonnet-4** - Anthropic's Claude model, balanced performance
- **claude-sonnet-4.5** - Anthropic's advanced Claude model, superior reasoning

### Is this an official OpenAI tool?

No, this is a community-developed integration tool. It uses the official GitHub Copilot CLI but is not directly affiliated with or endorsed by OpenAI.

## Installation & Setup

### What are the prerequisites?

1. **Node.js** >= 18.0.0
2. **GitHub Copilot CLI** installed and authenticated
3. **MCP client** (Claude Desktop or Claude Code)
4. **OpenAI API access** with appropriate model permissions

### How do I install Copilot MCP Tool?

**For Claude Code (recommended):**

```bash
claude mcp add copilot-cli -- npx -y @trishchuk/copilot-mcp-server
```

**For Claude Desktop:**

```bash
npm install -g @trishchuk/copilot-mcp-server
```

Then add to your configuration file.

### Where is the configuration file located?

**Claude Desktop configuration locations:**

- **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`
- **Linux:** `~/.config/claude/claude_desktop_config.json`

### How do I verify the installation?

Test with these commands in your MCP client:

```javascript
// Test connectivity
/copilot-cli:ping "Hello"

// Check help
/copilot-cli:help

// Simple task
/copilot-cli:ask "explain what Python decorators are"
```

## Usage Questions

### How do I reference files in my prompts?

Use the @ syntax:

```javascript
// Single file
'explain @src/main.ts';

// Multiple files
'compare @src/old.ts @src/new.ts';

// Glob patterns
'review @src/*.ts';
'analyze @src/**/*.ts';

// With paths containing spaces (use quotes)
"@\"My Documents/project/file.ts\"";
```

### What's the difference between sandbox modes?

| Mode                 | Read | Write | Delete | Execute | Use Case                |
| -------------------- | ---- | ----- | ------ | ------- | ----------------------- |
| `read-only`          | ✅   | ❌    | ❌     | ❌      | Analysis, reviews       |
| `workspace-write`    | ✅   | ✅    | ⚠️     | ❌      | Refactoring, generation |
| `danger-full-access` | ✅   | ✅    | ✅     | ✅      | Full automation         |

### How do I use different models?

Specify the model in your request:

```javascript
{
  "name": "ask",
  "arguments": {
    "prompt": "your task",
    "model": "gpt-5"  // or "claude-sonnet-4", "claude-sonnet-4.5"
  }
}
```

### What is changeMode?

ChangeMode returns structured file edits instead of conversational responses:

```javascript
{
  "prompt": "refactor this code",
  "changeMode": true
}
// Returns OLD/NEW edit blocks that can be directly applied
```

### How do I handle large responses?

For large changeMode responses, use chunking:

```javascript
// Initial request returns cacheKey
{ "prompt": "large refactor", "changeMode": true }

// Fetch subsequent chunks
{ "cacheKey": "abc123", "chunkIndex": 2 }
```

## Tools & Features

### What tools are available?

1. **ask** - Execute GitHub Copilot CLI commands with file references
2. **brainstorm** - Generate ideas with structured methodologies
3. **ping** - Test connectivity
4. **help** - Show GitHub Copilot CLI help
5. **fetch-chunk** - Retrieve cached response chunks
6. **timeout-test** - Test long-running operations

### How does the brainstorm tool work?

The brainstorm tool offers multiple methodologies:

```javascript
{
  "prompt": "ways to improve performance",
  "methodology": "scamper",  // or "divergent", "convergent", etc.
  "domain": "backend",
  "ideaCount": 10,
  "includeAnalysis": true
}
```

### Can I create custom tools?

Yes! Create a new tool in `src/tools/`:

```typescript
// src/tools/my-tool.tool.ts
export const myTool: UnifiedTool = {
  name: 'my-tool',
  description: 'My custom tool',
  schema: MyToolSchema,
  async execute(args, progress) {
    // Implementation
  },
};
```

### How do progress notifications work?

Long-running operations send progress updates every 25 seconds:

```javascript
// In tool implementation
progress?.('Processing file 1 of 10...');
progress?.('Analyzing dependencies...');
progress?.('Generating output...');
```

## Security & Privacy

### Is my code sent to OpenAI?

Yes, when you use Copilot MCP Tool, your prompts and referenced files are sent to OpenAI's API for processing. Ensure you:

- Don't include sensitive data
- Review OpenAI's data usage policies
- Use appropriate sandbox modes

### How do approval policies work?

| Policy       | Description             | Use Case           |
| ------------ | ----------------------- | ------------------ |
| `never`      | No approvals needed     | Trusted automation |
| `on-request` | Approve each action     | Careful operation  |
| `on-failure` | Approve on errors       | Semi-automated     |
| `untrusted`  | Always require approval | Maximum safety     |

### Can I use this in production?

Copilot MCP Tool is designed for development environments. For production:

- Review security implications
- Implement proper access controls
- Monitor API usage and costs
- Consider rate limiting

### Are API keys stored securely?

API keys should be:

- Set via environment variables (`OPENAI_API_KEY`)
- Never committed to version control
- Managed through GitHub Copilot CLI authentication
- Rotated regularly

## Troubleshooting

### Why is the tool not responding?

Check:

1. GitHub Copilot CLI is installed: `copilot --version`
2. Authentication is valid: `copilot /user show`
3. MCP server is running: restart your client
4. Configuration syntax is correct

### How do I enable debug logging?

```bash
# Enable all debug output
DEBUG=* npx @trishchuk/copilot-mcp-server

# Enable specific modules
DEBUG=copilot-mcp:* npx @trishchuk/copilot-mcp-server
```

### What if I get "model not available"?

1. Check available models: `copilot /model`
2. Verify API access permissions
3. Try a different model (e.g., `claude-sonnet-4`)
4. Check GitHub Copilot account status

### How do I report bugs?

1. Check [existing issues](https://github.com/x51xxx/copilot-mcp-tool/issues)
2. Gather diagnostic information
3. Use the [bug report template](https://github.com/x51xxx/copilot-mcp-tool/issues/new?template=bug_report.md)
4. Include reproducible steps

## Advanced Topics

### Can I use multiple MCP servers simultaneously?

Yes, configure multiple servers in your MCP client:

```json
{
  "mcpServers": {
    "copilot-cli": { ... },
    "another-server": { ... }
  }
}
```

### How do I contribute to the project?

See our [Contributing Guide](https://github.com/x51xxx/copilot-mcp-tool/blob/main/CONTRIBUTING.md):

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

### What's the difference between different AI models?

- **gpt-5** - OpenAI's latest general-purpose model with strong code capabilities
- **claude-sonnet-4** - Anthropic's balanced model, good for most tasks
- **claude-sonnet-4.5** - Anthropic's advanced model with enhanced reasoning capabilities

### Can I use this with other AI providers?

Currently, Copilot MCP Tool is designed for OpenAI's models via GitHub Copilot CLI. For other providers, consider:

- Forking and adapting the codebase
- Using different MCP servers
- Contributing multi-provider support

## Performance & Optimization

### How can I improve response times?

1. **Use faster models:** `claude-sonnet-4` for balanced speed and quality
2. **Be specific with file references:** Avoid broad globs
3. **Enable caching:** Reuse common analyses
4. **Process in batches:** Break large tasks

### What are the context limits?

Context limits vary by model. Check GitHub Copilot CLI documentation for current limits:

| Model             | Provider  |
| ----------------- | --------- |
| gpt-5             | OpenAI    |
| claude-sonnet-4   | Anthropic |
| claude-sonnet-4.5 | Anthropic |

### How do I estimate costs?

Costs are managed through your GitHub Copilot subscription. The tool doesn't directly charge for API usage - check your GitHub Copilot billing for usage costs.

## Future & Roadmap

### What features are planned?

- Streaming responses
- Local model support
- Enhanced caching
- Web UI interface
- Custom model configurations
- Batch processing
- Team collaboration features

### How do I request features?

1. Check [existing requests](https://github.com/x51xxx/copilot-mcp-tool/issues?label=enhancement)
2. Use the [feature request template](https://github.com/x51xxx/copilot-mcp-tool/issues/new?template=feature_request.md)
3. Provide use cases and examples

### Is there a roadmap?

Check our [GitHub Projects](https://github.com/x51xxx/copilot-mcp-tool/projects) for planned features and progress.

## Related Resources

- [Installation Guide](../getting-started.md)
- [Troubleshooting Guide](./troubleshooting.md)
- [API Reference](../api/tools/ask-copilot.md)
- [Examples](../examples/basic-usage.md)
- [Contributing](https://github.com/x51xxx/copilot-mcp-tool/blob/main/CONTRIBUTING.md)
