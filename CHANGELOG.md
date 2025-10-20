# Changelog

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
