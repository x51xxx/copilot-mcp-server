# Advanced Usage

This guide covers advanced patterns and techniques for using Copilot MCP Tool effectively in complex scenarios.

## Working with Large Codebases

### Chunked Analysis Strategy

When analyzing large codebases, break down the analysis into manageable chunks:

```javascript
// Step 1: Get overview
{
  "name": "ask",
  "arguments": {
    "prompt": "provide high-level architecture overview of @src/",
    "model": "claude-sonnet-4"
  }
}

// Step 2: Deep dive into specific modules
{
  "name": "ask",
  "arguments": {
    "prompt": "analyze @src/core/ in detail",
    "model": "gpt-5"
  }
}

// Step 3: Cross-module dependencies
{
  "name": "ask",
  "arguments": {
    "prompt": "map dependencies between @src/core/ and @src/utils/",
    "model": "claude-sonnet-4.5"
  }
}
```

### Memory-Efficient Processing

For very large files or directories:

```javascript
// Use changeMode with chunking
{
  "name": "ask",
  "arguments": {
    "prompt": "refactor all TypeScript files in @src/",
    "changeMode": true,
    "model": "gpt-5"
  }
}

// Fetch chunks as needed
{
  "name": "fetch-chunk",
  "arguments": {
    "cacheKey": "refactor-xyz",
    "chunkIndex": 1
  }
}
```

## Complex Refactoring Patterns

### Multi-Stage Refactoring

Execute refactoring in controlled stages:

```javascript
// Stage 1: Analysis
const analysis = {
  name: 'ask',
  arguments: {
    prompt: 'identify all code smells and anti-patterns in @src/',
    sandboxMode: 'read-only',
  },
};

// Stage 2: Planning
const plan = {
  name: 'brainstorm',
  arguments: {
    prompt: 'create refactoring plan for identified issues',
    methodology: 'convergent',
    existingContext: '[analysis results]',
  },
};

// Stage 3: Implementation
const implement = {
  name: 'ask',
  arguments: {
    prompt: 'implement refactoring plan step by step',
    changeMode: true,
    sandboxMode: 'workspace-write',
    approvalPolicy: 'on-request',
  },
};
```

### Incremental Migration

For framework or library migrations:

```javascript
// Migrate component by component
const components = ['Button', 'Form', 'Modal', 'Table'];

for (const component of components) {
  // Analyze current implementation
  await mcp.call('ask', {
    prompt: `analyze @src/components/${component}.tsx`,
    sandboxMode: 'read-only',
  });

  // Generate migration
  await mcp.call('ask', {
    prompt: `migrate ${component} from v4 to v5 API`,
    changeMode: true,
    approvalPolicy: 'on-request',
  });

  // Verify migration
  await mcp.call('ask', {
    prompt: `verify ${component} migration is complete`,
    sandboxMode: 'read-only',
  });
}
```

## Advanced Brainstorming Techniques

### Iterative Refinement

Build on previous brainstorming sessions:

```javascript
// Round 1: Generate ideas
const round1 = {
  name: 'brainstorm',
  arguments: {
    prompt: 'innovative features for developer tool',
    methodology: 'divergent',
    ideaCount: 30,
  },
};

// Round 2: Filter and refine
const round2 = {
  name: 'brainstorm',
  arguments: {
    prompt: 'refine top 10 ideas from previous session',
    methodology: 'convergent',
    existingContext: '[round1 results]',
    constraints: 'must be implementable in 2 weeks',
  },
};

// Round 3: Implementation planning
const round3 = {
  name: 'brainstorm',
  arguments: {
    prompt: 'create implementation plan for top 3 ideas',
    methodology: 'design-thinking',
    existingContext: '[round2 results]',
    includeAnalysis: true,
  },
};
```

### Cross-Domain Innovation

Combine multiple domains for creative solutions:

```javascript
{
  "name": "brainstorm",
  "arguments": {
    "prompt": "apply gaming mechanics to productivity app",
    "methodology": "lateral",
    "domain": "gaming,productivity,psychology",
    "ideaCount": 20
  }
}
```

## Automation Workflows

### CI/CD Integration

Integrate Copilot MCP Tool into your CI/CD pipeline:

```yaml
# .github/workflows/code-review.yml
name: Automated Code Review

on:
  pull_request:
    types: [opened, synchronize]

jobs:
  review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Copilot MCP
        run: npm install -g @trishchuk/copilot-mcp-server

      - name: Security Review
        run: |
          echo '{
            "method": "tools/call",
            "params": {
              "name": "ask",
              "arguments": {
                "prompt": "security audit @src/",
                "model": "gpt-5",
                "sandboxMode": "read-only"
              }
            }
          }' | npx @trishchuk/copilot-mcp-server

      - name: Performance Review
        run: |
          echo '{
            "method": "tools/call",
            "params": {
              "name": "ask",
              "arguments": {
                "prompt": "identify performance bottlenecks @src/",
                "model": "gpt-5"
              }
            }
          }' | npx @trishchuk/copilot-mcp-server
```

### Scheduled Maintenance

Automate regular code maintenance tasks:

```javascript
// Weekly technical debt review
const weeklyReview = async () => {
  // Identify technical debt
  const debt = await mcp.call('ask', {
    prompt: 'identify technical debt in @src/',
    model: 'gpt-5',
  });

  // Generate improvement plan
  const plan = await mcp.call('brainstorm', {
    prompt: 'prioritize technical debt fixes',
    existingContext: debt,
    constraints: '4 hours per week available',
  });

  // Create tickets
  await createGitHubIssues(plan);
};
```

## Performance Optimization

### Model Selection Strategy

Choose the right model for the task:

```javascript
const selectModel = task => {
  switch (task.type) {
    case 'quick-analysis':
      return 'claude-sonnet-4'; // Fast, balanced

    case 'complex-reasoning':
      return 'claude-sonnet-4.5'; // Advanced reasoning

    case 'large-refactoring':
      return 'gpt-5'; // Maximum context

    default:
      return 'claude-sonnet-4';
  }
};

// Use in practice
const model = selectModel({ type: 'complex-reasoning' });
await mcp.call('ask', {
  prompt: 'your task',
  model: model,
});
```

### Parallel Processing

Execute independent tasks in parallel:

```javascript
// Parallel analysis of different modules
const modules = ['auth', 'api', 'database', 'ui'];

const analyses = await Promise.all(
  modules.map(module =>
    mcp.call('ask', {
      prompt: `analyze @src/${module}/`,
      model: 'claude-sonnet-4',
    })
  )
);

// Combine results
const summary = await mcp.call('ask', {
  prompt: 'synthesize module analyses into system overview',
  existingContext: analyses.join('\n'),
  model: 'gpt-5',
});
```

## Custom Tool Chains

### Building Complex Workflows

Chain multiple tools for sophisticated operations:

```javascript
class CopilotWorkflow {
  async reviewAndRefactor(path) {
    // Step 1: Initial review
    const review = await this.review(path);

    // Step 2: Generate improvement ideas
    const ideas = await this.brainstorm(review);

    // Step 3: Implement top improvements
    const changes = await this.implement(ideas);

    // Step 4: Verify changes
    const verification = await this.verify(changes);

    return { review, ideas, changes, verification };
  }

  async review(path) {
    return mcp.call('ask', {
      prompt: `comprehensive review of @${path}`,
      model: 'gpt-5',
      sandboxMode: 'read-only',
    });
  }

  async brainstorm(context) {
    return mcp.call('brainstorm', {
      prompt: 'improvement suggestions',
      existingContext: context,
      methodology: 'scamper',
      ideaCount: 10,
    });
  }

  async implement(ideas) {
    return mcp.call('ask', {
      prompt: `implement top 3 improvements: ${ideas}`,
      changeMode: true,
      sandboxMode: 'workspace-write',
      approvalPolicy: 'on-request',
    });
  }

  async verify(changes) {
    return mcp.call('ask', {
      prompt: 'verify changes maintain functionality',
      sandboxMode: 'read-only',
    });
  }
}
```

## Security Best Practices

### Secure Code Review

Implement security-focused reviews:

```javascript
{
  "name": "ask",
  "arguments": {
    "prompt": `Check @src/ for:
      - SQL injection vulnerabilities
      - XSS vulnerabilities
      - Authentication bypasses
      - Insecure deserialization
      - Sensitive data exposure
      - Security misconfigurations
      - Using components with known vulnerabilities
      - Insufficient logging and monitoring`,
    "model": "gpt-5",
    "sandboxMode": "read-only"
  }
}
```

### Compliance Checking

Ensure code meets compliance requirements:

```javascript
{
  "name": "ask",
  "arguments": {
    "prompt": "verify @src/ compliance with GDPR, HIPAA, and SOC 2",
    "model": "gpt-5",
    "sandboxMode": "read-only"
  }
}
```

## Debugging Complex Issues

### Root Cause Analysis

Systematic debugging approach:

```javascript
// Step 1: Reproduce issue
const reproduce = {
  name: 'ask',
  arguments: {
    prompt: 'trace execution path for [error scenario] in @src/',
    model: 'o3',
  },
};

// Step 2: Identify root cause
const rootCause = {
  name: 'ask',
  arguments: {
    prompt: 'identify root cause of [error] based on trace',
    model: 'gpt-5',
  },
};

// Step 3: Generate fixes
const fixes = {
  name: 'brainstorm',
  arguments: {
    prompt: 'possible fixes for [root cause]',
    methodology: 'convergent',
    includeAnalysis: true,
  },
};
```

## Related Resources

- [Basic Usage](./basic-usage.md)
- [API Reference](../api/tools/ask.md)
- [Troubleshooting](../resources/troubleshooting.md)
- [FAQ](../resources/faq.md)
