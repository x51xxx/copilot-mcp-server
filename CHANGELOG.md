# Changelog

## [1.3.0] - 2025-10-21

### Added

- **Claude Haiku 4.5 Model Support** (Copilot CLI v0.0.343+)
  - New cost-effective model with 0.33x multiplier (3x cheaper than standard models)
  - Fastest response times for quick tasks and budget-conscious usage
  - Available via `model: "claude-haiku-4.5"` parameter
- **`allowAllPaths` parameter** (Copilot CLI v0.0.340+)
  - Automatically approve access to all file paths
  - Useful for automated workflows and CI/CD
  - Added to ask, batch, and review tools
- **`additionalMcpConfig` parameter** (Copilot CLI v0.0.343+)
  - Temporary MCP server configuration per-session
  - Supports inline JSON or file reference with `@` prefix
  - Enables testing MCP servers without modifying global config
- **Comprehensive changelog integration guide** (`docs/copilot-cli/changelog-integration.md`)
  - Version compatibility matrix
  - Upgrade guide for Copilot CLI v0.0.340+
  - Feature status tracking

### Changed

- Updated all tool model descriptions to include Claude Haiku 4.5 with cost multiplier info
- Updated `CopilotExecOptions` interface with new parameters
- Enhanced documentation in CLAUDE.md with Copilot CLI v0.0.346+ features

### Documentation

- ⚠️ **Breaking Change Notice**: Copilot CLI v0.0.340+ requires `${VAR}` syntax for environment variables in MCP configs
  - Before: `"API_KEY": "MY_API_KEY"` (literal string)
  - After: `"API_KEY": "${MY_API_KEY}"` (resolved from environment)
- Updated Getting Started guide with breaking change warning
- Updated API documentation with new parameters and examples
- Added budget-optimization examples using Claude Haiku 4.5
- Added examples for `allowAllPaths` and `additionalMcpConfig` usage

### Technical Details

- Updated `copilotExecutor.ts` to handle new CLI flags
- Updated tool schemas in ask.tool.ts, batch.tool.ts, review.tool.ts, brainstorm.tool.ts
- All changes are backwards compatible with existing configurations
- Passed TypeScript type checking (npm run lint)
- Code formatted with Prettier (npm run format)

## [1.2.0] - 2025-10-20

### Fixed

- **[P0]** Critical bug: `resolveWorkingDirectory` was passing file paths as `cwd` instead of directories, causing
  `ENOTDIR` errors
- **[P1]** Regex did not support spaces in quoted `@path` references, breaking functionality for Windows users with
  spaces in usernames (e.g., `C:\Users\Jane Doe\...`)
- Only the first `@path` mention in prompt was processed, ignoring other potentially valid paths

### Added

- `findProjectRoot()` function for intelligent project root detection
  - Supports Node.js (package.json), Git (.git), Python (pyproject.toml), Rust (Cargo.toml), Go (go.mod), Java (
    pom.xml, build.gradle), PHP (composer.json)
  - Walks up directory tree up to 10 levels looking for project markers
- `ensureDirectory()` function to guarantee `cwd` always points to a directory
- Support for multiple `@path` mentions in prompts - iterates until finding valid absolute path
- Support for quoted paths with spaces: `@"C:\\Users\\Jane Doe\\file.ts"` or `@'/path/with spaces/file.ts'`
- `workingDir` parameter added to all tools (ask, batch, review, brainstorm)

### Improved

- Enhanced `@path` regex to support both quoted (with spaces) and unquoted paths
- Automatic project root detection from `@path` references in prompts
- Better Windows compatibility for paths with spaces in usernames
- More robust working directory resolution with comprehensive fallback chain
- Updated documentation in CLAUDE.md and README.md with `COPILOT_MCP_CWD` environment variable usage

## [1.1.0] - Previous Release

- Enhanced GitHub Copilot CLI integration
- Batch processing support
- Code review tools
- Change mode support

## [1.0.0] - Initial Release

- Public release
- Basic GitHub Copilot CLI integration
- Support for file analysis with @ syntax
- Sandbox mode support
