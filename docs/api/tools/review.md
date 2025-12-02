# review

Comprehensive code review using GitHub Copilot CLI with multiple review types and detailed reporting.

## Description

The `review` tool provides sophisticated code review capabilities using GitHub Copilot CLI. It supports multiple review types (security, performance, code quality, architecture, etc.), severity filtering, and comprehensive reporting with fix suggestions and priority ranking.

## Parameters

| Parameter                | Type               | Required | Default         | Description                                                                                                                                               |
| ------------------------ | ------------------ | -------- | --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `target`                 | string             | ✅       | -               | Target files/directories to review (use @ syntax)                                                                                                         |
| `reviewType`             | enum               | ❌       | `comprehensive` | Type of review: `code-quality`, `security`, `performance`, `best-practices`, `architecture`, `testing`, `documentation`, `accessibility`, `comprehensive` |
| `model`                  | string             | ❌       | -               | AI model: `gpt-5`, `claude-sonnet-4`, `claude-sonnet-4.5`, or `claude-haiku-4.5`                                                                          |
| `severity`               | enum               | ❌       | -               | Minimum severity level: `low`, `medium`, `high`, `critical`                                                                                               |
| `outputFormat`           | enum               | ❌       | `markdown`      | Output format: `markdown`, `json`, `text`                                                                                                                 |
| `includeFixSuggestions`  | boolean            | ❌       | `true`          | Include specific fix suggestions                                                                                                                          |
| `includePriorityRanking` | boolean            | ❌       | `true`          | Include priority ranking for issues                                                                                                                       |
| `excludePatterns`        | string[]           | ❌       | `[]`            | File patterns to exclude (glob patterns)                                                                                                                  |
| `maxIssues`              | number             | ❌       | `20`            | Maximum number of issues to report (1-100)                                                                                                                |
| `addDir`                 | string \| string[] | ❌       | -               | Additional directories to grant access                                                                                                                    |
| `timeout`                | number             | ❌       | -               | Maximum execution time in milliseconds                                                                                                                    |
| `allowAllTools`          | boolean            | ❌       | `true`          | Allow all tools for comprehensive analysis                                                                                                                |
| `allowAllPaths`          | boolean            | ❌       | `false`         | Allow access to all filesystem paths for context; overrides typical directory restrictions                                                                |
| `additionalMcpConfig`    | string \| object   | ❌       | -               | Additional MCP configuration (JSON string or object) merged into the runtime                                                                              |
| `workingDir`             | string             | ❌       | `.`             | Working directory for the review; base for relative targets and path resolution                                                                           |
| `resume`                 | string \| boolean  | ❌       | -               | Resume from a previous session (optionally specify session ID)                                                                                            |
| `continue`               | boolean            | ❌       | -               | Resume the most recent session                                                                                                                            |

## Review types

### `security`

Focuses on security vulnerabilities, authentication issues, input validation, XSS, SQL injection, CSRF, and secure coding practices.

### `performance`

Focuses on performance bottlenecks, inefficient algorithms, memory usage, caching opportunities, and optimization potential.

### `code-quality`

Focuses on code structure, readability, maintainability, SOLID principles, design patterns, and clean code practices.

### `best-practices`

Focuses on language-specific best practices, conventions, idiomatic code, and industry standards.

### `architecture`

Focuses on system design, component coupling, separation of concerns, scalability, and architectural patterns.

### `testing`

Focuses on test coverage, test quality, test patterns, edge cases, and testing best practices.

### `documentation`

Focuses on code documentation, comments, README files, API documentation, and knowledge sharing.

### `accessibility`

Focuses on web accessibility (WCAG), semantic HTML, ARIA attributes, keyboard navigation, and inclusive design.

### `comprehensive`

Performs a comprehensive review covering security, performance, code quality, best practices, and architecture.

## Examples

### Basic security review

```typescript
{
  "target": "@src/auth/",
  "reviewType": "security",
  "severity": "medium",
  "includeFixSuggestions": true,
  "generateReport": true
}
```

### Performance analysis with exclusions

```typescript
{
  "target": "@src/",
  "reviewType": "performance",
  "severity": "high",
  "excludePatterns": ["*.test.js", "node_modules/**", "dist/**"],
  "maxIssues": 15,
  "outputFormat": "json"
}
```

### Comprehensive code review

```typescript
{
  "target": "@.",
  "reviewType": "comprehensive",
  "severity": "low",
  "excludePatterns": [
    "node_modules/**",
    "dist/**",
    "build/**",
    "*.test.js",
    "*.spec.ts"
  ],
  "maxIssues": 50,
  "includeFixSuggestions": true,
  "includePriorityRanking": true,
  "generateReport": true,
  "allowAllTools": true,
  "addDir": ["."]
}
```

### Architecture review with restricted permissions

```typescript
{
  "target": "@src/",
  "reviewType": "architecture",
  "severity": "medium",
  "allowAllTools": false,
  "allowTool": ["read", "analyze"],
  "denyTool": ["write", "shell"],
  "outputFormat": "markdown",
  "generateReport": true
}
```

### Accessibility review for web application

```typescript
{
  "target": "@src/components/",
  "reviewType": "accessibility",
  "severity": "medium",
  "includeFixSuggestions": true,
  "maxIssues": 25,
  "outputFormat": "markdown",
  "generateReport": true
}
```

## Response format

### Markdown output (default)

````markdown
# Security Code Review Report

**Target:** `@src/auth/`  
**Review Type:** security  
**Generated:** 2024-01-15T10:30:00.000Z  
**Min Severity:** medium

---

**GitHub Copilot Session:**

- Session: abc-123-def
- Tools Used: 5 executions

**Analysis:**
I'll analyze the authentication module for security vulnerabilities, focusing on common issues like input validation, session management, and secure coding practices.

**Response:**

## Critical Issues (2)

### 1. SQL Injection Vulnerability

**File:** `src/auth/login.js:42`  
**Severity:** Critical  
**Priority:** High

**Description:**
Direct string concatenation in SQL query allows SQL injection attacks.

**Current Code:**

```javascript
const query = `SELECT * FROM users WHERE email = '${email}'`;
```
````

**Fix Suggestion:**

```javascript
const query = 'SELECT * FROM users WHERE email = ?';
const result = await db.query(query, [email]);
```

### 2. Password Storage Issue

**File:** `src/auth/register.js:28`
**Severity:** Critical
**Priority:** High

**Description:**
Passwords are stored in plaintext without proper hashing.

**Fix Suggestion:**

```javascript
const bcrypt = require('bcrypt');
const hashedPassword = await bcrypt.hash(password, 12);
```

## High Issues (3)

### 3. Missing Rate Limiting

**File:** `src/auth/login.js:15`
**Severity:** High
**Priority:** High

**Description:**
Login endpoint lacks rate limiting, vulnerable to brute force attacks.

**Fix Suggestion:**

```javascript
const rateLimit = require('express-rate-limit');
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
});
```

---

**GitHub Copilot CLI Review completed** ✨

````

### JSON output

```json
{
  "reviewSummary": {
    "target": "@src/auth/",
    "reviewType": "security",
    "generated": "2024-01-15T10:30:00.000Z",
    "minSeverity": "medium",
    "totalIssues": 8,
    "severityBreakdown": {
      "critical": 2,
      "high": 3,
      "medium": 2,
      "low": 1
    }
  },
  "issues": [
    {
      "id": 1,
      "title": "SQL Injection Vulnerability",
      "file": "src/auth/login.js",
      "line": 42,
      "severity": "critical",
      "priority": "high",
      "description": "Direct string concatenation in SQL query allows SQL injection attacks.",
      "currentCode": "const query = `SELECT * FROM users WHERE email = '${email}'`;",
      "suggestion": "const query = 'SELECT * FROM users WHERE email = ?';\nconst result = await db.query(query, [email]);",
      "category": "security",
      "tags": ["sql-injection", "database", "input-validation"]
    }
  ],
  "metadata": {
    "toolsUsed": 5,
    "processingTime": "45s",
    "copilotVersion": "0.0.327"
  }
}
````

## Severity levels

| Severity   | Description                                                        | Examples                                                             |
| ---------- | ------------------------------------------------------------------ | -------------------------------------------------------------------- |
| `critical` | Issues that pose immediate security risks or cause system failures | SQL injection, XSS vulnerabilities, exposed secrets                  |
| `high`     | Serious issues that should be addressed soon                       | Missing authentication, performance bottlenecks, architectural flaws |
| `medium`   | Important improvements that enhance code quality                   | Code duplication, missing error handling, suboptimal patterns        |
| `low`      | Minor suggestions for code improvement                             | Naming conventions, code organization, documentation                 |

## Output formats

### Markdown

- **Best for**: Human-readable reports, documentation, pull request comments
- **Features**: Rich formatting, code blocks, clear structure
- **Use case**: Code review workflows, documentation generation

### JSON

- **Best for**: Programmatic processing, integration with other tools
- **Features**: Structured data, easy parsing, metadata inclusion
- **Use case**: CI/CD pipelines, automated quality gates, metrics collection

### Text

- **Best for**: Simple logging, basic reporting
- **Features**: Plain text output, minimal formatting
- **Use case**: Terminal output, basic logging systems

## Exclusion patterns

Use glob patterns to exclude files from review:

```typescript
{
  "excludePatterns": [
    "node_modules/**",        // Dependencies
    "dist/**",               // Build output
    "build/**",              // Build directory
    "*.test.js",             // Test files
    "*.spec.ts",             // Spec files
    "**/__tests__/**",       // Test directories
    "coverage/**",           // Coverage reports
    ".git/**",               // Version control
    "*.min.js",              // Minified files
    "vendor/**"              // Third-party code
  ]
}
```

## Performance considerations

### Large codebases

```typescript
{
  "target": "@src/",
  "maxIssues": 25,           // Limit results
  "timeout": 600000,         // 10 minutes
  "excludePatterns": [       // Exclude non-essential files
    "node_modules/**",
    "*.test.js"
  ]
}
```

### Focused reviews

```typescript
{
  "target": "@src/security/", // Specific directory
  "reviewType": "security",   // Focused review type
  "severity": "medium"        // Filter by severity
}
```

## Integration examples

### CI/CD pipeline integration

```yaml
# .github/workflows/code-review.yml
- name: Security Review
  run: |
    # Use the MCP tool via your preferred method
    # Example: via Claude Code or direct MCP client
    echo "Run security review using MCP client"
```

### Pre-commit hook

```javascript
// pre-commit-review.js
const { reviewCopilot } = require('@trishchuk/copilot-mcp-server');

async function preCommitReview() {
  const result = await reviewCopilot({
    target: '@src/',
    reviewType: 'code-quality',
    severity: 'high',
    maxIssues: 10,
  });

  if (result.includes('Critical') || result.includes('High')) {
    console.error('High or critical issues found. Please fix before committing.');
    process.exit(1);
  }
}
```

## Best practices

### 1. Start with focused reviews

```typescript
// Good: Focused on specific area
{
  "target": "@src/auth/",
  "reviewType": "security"
}

// Avoid: Too broad initially
{
  "target": "@.",
  "reviewType": "comprehensive"
}
```

### 2. Use appropriate severity filters

```typescript
// For critical fixes
{
  "severity": "high",
  "maxIssues": 5
}

// For general improvement
{
  "severity": "low",
  "maxIssues": 50
}
```

### 3. Exclude irrelevant files

```typescript
{
  "excludePatterns": [
    "node_modules/**",
    "*.test.js",
    "dist/**"
  ]
}
```

### 4. Use structured output for automation

```typescript
{
  "outputFormat": "json",
  "generateReport": false  // For programmatic processing
}
```

## Error handling

Common errors and solutions:

### Target not found

```
❌ Target Error: Target @src/nonexistent/ not found
```

**Solution**: Verify the target path exists and use correct @ syntax.

### Directory access denied

```
❌ Directory Access Error: Permission denied accessing ./src
```

**Solution**: Add directory access with `addDir: ["./src"]`.

### Review timeout

```
❌ Review Timeout: Large codebase review took longer than expected
```

**Solutions**:

- Increase timeout: `timeout: 900000` (15 minutes)
- Reduce scope: Review smaller directories
- Use exclusion patterns to skip large files

## Related tools

- [`ask`](./ask) - General purpose Copilot CLI integration
- [`batch`](./batch) - Batch processing with Copilot CLI
- [`brainstorm`](./brainstorm) - Creative idea generation
