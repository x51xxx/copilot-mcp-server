# Contributing to Copilot MCP Server

We welcome contributions to the Copilot MCP Server! This document provides guidelines for contributing to the project.

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- GitHub CLI installed and authenticated
- Docker (optional, for testing containerization)

### Development Setup
```bash
# Fork and clone the repository
git clone https://github.com/YOUR_USERNAME/copilot-mcp-server.git
cd copilot-mcp-server

# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test

# Start development server
npm run dev
```

## 📋 Development Process

### 1. Create a Feature Branch
```bash
git checkout -b feature/your-feature-name
```

### 2. Make Your Changes
- Write clean, well-documented code
- Follow the existing code style
- Add tests for new functionality
- Update documentation as needed

### 3. Test Your Changes
```bash
# Run all tests
npm test

# Run linting
npm run lint

# Check build
npm run build

# Test Docker build (optional)
docker build -t copilot-mcp-server:test .
```

### 4. Commit Your Changes
```bash
git add .
git commit -m "feat: add your feature description"
```

We use [Conventional Commits](https://www.conventionalcommits.org/):
- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `style:` - Code style changes
- `refactor:` - Code refactoring
- `test:` - Test additions or modifications
- `chore:` - Build process or auxiliary tool changes

### 5. Push and Create Pull Request
```bash
git push origin feature/your-feature-name
```

Then create a Pull Request on GitHub with:
- Clear description of changes
- Link to any related issues
- Screenshots (if applicable)

## 🧪 Testing Guidelines

### Unit Tests
- Write tests for all new functions and classes
- Use descriptive test names
- Mock external dependencies
- Aim for high test coverage

### Example Test Structure
```typescript
describe('AskTool', () => {
  let askTool: AskTool;
  let mockExecutor: jest.Mocked<CommandExecutor>;

  beforeEach(() => {
    mockExecutor = jest.mocked(new CommandExecutor(mockConfig));
    askTool = new AskTool(mockExecutor, new OutputParser());
  });

  it('should execute a simple query successfully', async () => {
    // Test implementation
  });
});
```

### Integration Tests
- Test complete workflows
- Use real GitHub CLI when possible (in CI)
- Test error scenarios

## 📝 Code Style

### TypeScript Guidelines
- Use strict TypeScript configuration
- Provide explicit return types for functions
- Use proper type definitions, avoid `any`
- Follow naming conventions:
  - Classes: `PascalCase`
  - Functions/variables: `camelCase`
  - Constants: `SCREAMING_SNAKE_CASE`
  - Files: `kebab-case.ts`

### Code Formatting
- Use Prettier for code formatting
- Run `npm run format` before committing
- Use ESLint rules for code quality

### Documentation
- Add JSDoc comments for public APIs
- Update README for significant changes
- Keep examples up to date

## 🏗️ Architecture Guidelines

### Adding New Tools
1. Create tool class in `src/tools/`
2. Implement the tool interface
3. Add proper validation with Zod
4. Write comprehensive tests
5. Update documentation

### Tool Implementation Template
```typescript
import { z } from 'zod';
import { ToolResult, ToolContext, ValidationError } from '../types/index.js';

const YourToolArgsSchema = z.object({
  // Define your arguments
});

export class YourTool {
  async execute(args: unknown, context: ToolContext): Promise<ToolResult> {
    try {
      const validArgs = YourToolArgsSchema.parse(args);
      // Implementation
    } catch (error) {
      // Error handling
    }
  }

  getSchema(): object {
    return {
      name: 'your-tool',
      description: 'Tool description',
      inputSchema: {
        // JSON Schema
      },
    };
  }
}
```

### Error Handling
- Use custom error types from `types/index.ts`
- Provide meaningful error messages
- Log errors appropriately
- Handle async errors properly

## 🐳 Docker Guidelines

### Building Images
```bash
# Build development image
docker build -t copilot-mcp-server:dev .

# Build production image
docker build --target runtime -t copilot-mcp-server:prod .
```

### Testing Docker Images
```bash
# Test basic functionality
docker run --rm copilot-mcp-server:test node -e "console.log('OK')"

# Test with environment variables
docker run --rm \
  -e LOG_LEVEL=debug \
  copilot-mcp-server:test
```

## 📚 Documentation

### Adding Documentation
1. Update relevant `.md` files
2. Add examples for new features
3. Update API documentation
4. Test documentation builds

### Building Documentation
```bash
# Start documentation development server
npm run docs:dev

# Build documentation
npm run docs:build
```

## 🚨 Common Issues

### ESLint/Prettier Conflicts
```bash
# Fix formatting issues
npm run format

# Fix linting issues
npm run lint:fix
```

### TypeScript Errors
- Check `tsconfig.json` configuration
- Ensure all imports use `.js` extensions
- Use proper type definitions

### Test Failures
- Check mock implementations
- Verify async/await usage
- Ensure proper cleanup in tests

## 🤝 Pull Request Guidelines

### Before Submitting
- [ ] Tests pass locally
- [ ] Code is formatted and linted
- [ ] Documentation is updated
- [ ] Commit messages follow conventions
- [ ] PR description is clear and complete

### PR Template
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Documentation update
- [ ] Refactoring

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing performed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] Tests pass
```

## 📞 Getting Help

- **Issues**: [GitHub Issues](https://github.com/x51xxx/copilot-mcp-server/issues)
- **Discussions**: [GitHub Discussions](https://github.com/x51xxx/copilot-mcp-server/discussions)
- **Documentation**: [Project Docs](https://x51xxx.github.io/copilot-mcp-server)

## 🎉 Recognition

Contributors will be recognized in:
- Repository contributors list
- Release notes for significant contributions
- Documentation acknowledgments

Thank you for contributing to Copilot MCP Server! 🚀