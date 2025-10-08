# Model Selection Examples

## Quick Start

### 1. Set Default Model via Environment

```bash
# Set for current session
export COPILOT_MODEL=claude-sonnet-4.5

# Or add to ~/.bashrc or ~/.zshrc for persistence
echo 'export COPILOT_MODEL=claude-sonnet-4.5' >> ~/.zshrc
```

### 2. Use MCP Tools with Model Selection

```typescript
// Example 1: Ask with specific model
{
  "name": "ask",
  "arguments": {
    "prompt": "Analyze the performance of @src/database.ts",
    "model": "gpt-4o"  // Use GPT-4o for this analysis
  }
}

// Example 2: Code review with Claude Sonnet 4.5
{
  "name": "review",
  "arguments": {
    "target": "@src/",
    "reviewType": "security",
    "model": "claude-sonnet-4.5"
  }
}

// Example 3: Batch processing with o1
{
  "name": "batch",
  "arguments": {
    "tasks": [
      { "task": "Add comprehensive error handling", "target": "@src/api/" },
      { "task": "Optimize database queries", "target": "@src/db/" }
    ],
    "model": "o1"  // Use o1's reasoning for complex refactoring
  }
}

// Example 4: Brainstorming with default model (from env)
{
  "name": "brainstorm",
  "arguments": {
    "prompt": "Ways to improve API performance",
    "methodology": "scamper",
    "domain": "software"
    // No model specified - uses COPILOT_MODEL env var
  }
}
```

## Advanced Scenarios

### Scenario 1: Different Models for Different Tasks

```bash
#!/bin/bash
# setup-models.sh

# Default model for general tasks
export COPILOT_MODEL=claude-sonnet-4

# Use GPT-4o for code reviews
alias review-security='copilot -m gpt-4o'

# Use o1 for architectural decisions
alias design-system='copilot -m o1'

# Use Claude Sonnet 4.5 for code generation
alias generate-code='copilot -m claude-sonnet-4.5'
```

### Scenario 2: Project-Specific Model Configuration

```json
// .copilot-mcp.json (project config)
{
  "defaultModel": "claude-sonnet-4.5",
  "taskModels": {
    "security-review": "gpt-4o",
    "code-generation": "claude-sonnet-4.5",
    "architecture": "o1",
    "documentation": "claude-sonnet-4"
  }
}
```

### Scenario 3: CI/CD Pipeline with Model Selection

```yaml
# .github/workflows/code-review.yml
name: Automated Code Review

on: [pull_request]

jobs:
  review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Install Copilot CLI
        run: npm install -g @github/copilot-cli

      - name: Setup Copilot MCP
        run: npm install -g @trishchuk/copilot-mcp-server

      - name: Security Review with GPT-4o
        env:
          COPILOT_MODEL: gpt-4o
        run: |
          copilot-mcp review \
            --target "src/" \
            --reviewType security \
            --severity high

      - name: Performance Review with Claude
        env:
          COPILOT_MODEL: claude-sonnet-4.5
        run: |
          copilot-mcp review \
            --target "src/" \
            --reviewType performance
```

### Scenario 4: Interactive Model Switching

```bash
#!/bin/bash
# interactive-copilot.sh

echo "Select AI model:"
echo "1) Claude Sonnet 4.5 (Default)"
echo "2) GPT-4o"
echo "3) o1 (Reasoning)"
echo "4) o1-mini"

read -p "Choice (1-4): " choice

case $choice in
  1) export COPILOT_MODEL=claude-sonnet-4.5 ;;
  2) export COPILOT_MODEL=gpt-4o ;;
  3) export COPILOT_MODEL=o1 ;;
  4) export COPILOT_MODEL=o1-mini ;;
  *) echo "Invalid choice" && exit 1 ;;
esac

echo "Using model: $COPILOT_MODEL"
copilot
```

## Performance Tips

### 1. Choose the Right Model for the Task

```typescript
// Fast iteration - use faster models
const codeGeneration = {
  prompt: "Generate CRUD API for User model",
  model: "claude-sonnet-4"  // Fast
};

// Complex reasoning - use reasoning models
const systemDesign = {
  prompt: "Design a scalable microservices architecture",
  model: "o1"  // Better reasoning
};

// Balanced tasks - use latest models
const codeReview = {
  target: "@src/",
  reviewType: "comprehensive",
  model: "claude-sonnet-4.5"  // Balanced
};
```

### 2. Cost Optimization

```typescript
// Development - use cost-effective models
if (process.env.NODE_ENV === 'development') {
  process.env.COPILOT_MODEL = 'claude-sonnet-4';
}

// Production - use best models
if (process.env.NODE_ENV === 'production') {
  process.env.COPILOT_MODEL = 'claude-sonnet-4.5';
}

// Testing - use minimal models
if (process.env.NODE_ENV === 'test') {
  process.env.COPILOT_MODEL = 'o1-mini';
}
```

### 3. Fallback Strategy

```typescript
const modelsInOrder = [
  'claude-sonnet-4.5',
  'claude-sonnet-4',
  'gpt-4o',
  'o1-mini'
];

async function executeWithFallback(prompt: string) {
  for (const model of modelsInOrder) {
    try {
      return await ask({ prompt, model });
    } catch (error) {
      if (error.message.includes('model_not_supported')) {
        continue; // Try next model
      }
      throw error; // Other errors should propagate
    }
  }
  throw new Error('No models available');
}
```

## Monitoring and Debugging

### Check Current Model

```bash
# Via environment variable
echo "Current model: $COPILOT_MODEL"

# Via Copilot CLI
copilot
# Then type: /model

# Via MCP tool
copilot-mcp ping --message "Using model: $COPILOT_MODEL"
```

### Debug Model Selection

```typescript
// Enable debug logging
process.env.LOG_LEVEL = 'debug';

// The logs will show:
// - Selected model
// - Model selection priority (param/env/default)
// - Copilot CLI command with -m flag
```

## Model Comparison for Common Tasks

| Task | Recommended Model | Reasoning |
|------|-------------------|-----------|
| Code generation | `claude-sonnet-4.5` | Best code quality |
| Security review | `gpt-4o` | Comprehensive analysis |
| Architecture design | `o1` | Superior reasoning |
| Documentation | `claude-sonnet-4` | Fast, good quality |
| Refactoring | `claude-sonnet-4.5` | Understands code patterns |
| Bug fixing | `gpt-4o` | Good debugging |
| Performance optimization | `o1` | Deep analysis |
| Quick questions | `o1-mini` | Fast, cost-effective |

## Troubleshooting

### Model Not Available

```bash
# Check available models
copilot
# Type: /model list

# Check your subscription
copilot /user show

# Verify Copilot CLI version (need v0.0.329+)
copilot --version
```

### Model Parameter Not Working

```bash
# Verify TypeScript compilation
npm run build

# Check environment variable
printenv | grep COPILOT_MODEL

# Test with explicit model
npx @trishchuk/copilot-mcp-server ask \
  --prompt "test" \
  --model "claude-sonnet-4.5"
```

## Best Practices

1. **Set a reasonable default** via `COPILOT_MODEL`
2. **Override for specific tasks** that benefit from different models
3. **Monitor costs** - o1 models may be more expensive
4. **Test model availability** before deploying to production
5. **Document model choices** in your project README
6. **Use environment-specific configs** for dev/staging/prod

## Resources

- [Model Selection Guide](../docs/MODEL_SELECTION.md)
- [GitHub Copilot CLI Docs](https://github.com/github/copilot-cli)
- [Copilot MCP Server README](../README.md)
