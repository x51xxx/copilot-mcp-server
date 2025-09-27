# Changelog

## [1.2.0] - 2024-12-XX - Major Migration to GitHub Copilot CLI

### ✨ Added
- **GitHub Copilot CLI Integration**: Full support for GitHub Copilot CLI as primary tool
- **New Primary Tools**:
  - `ask-copilot` - Execute GitHub Copilot CLI with comprehensive tool management
  - `batch-copilot` - Batch processing with Copilot CLI
  - `review-copilot` - Comprehensive code review with Copilot CLI
- **Advanced Features**:
  - Tool permissions management (`allowAllTools`, `allowTool`, `denyTool`)
  - Directory access control (`addDir`)
  - Session management and resume functionality
  - Multiple review types (security, performance, code-quality, architecture, etc.)
  - Severity filtering for code reviews
  - Multiple output formats (markdown, json, text)
- **Enhanced Error Handling**: Better error messages and troubleshooting guidance
- **Dual CLI Support**: Both Copilot CLI and Codex CLI supported simultaneously

### 🔄 Changed
- **Package Name**: Changed from `@trishchuk/codex-mcp-tool` to `@trishchuk/copilot-mcp-tool`
- **Primary Focus**: GitHub Copilot CLI is now the primary tool, Codex CLI is legacy
- **Tool Categories**: Added 'copilot' category alongside existing 'codex', 'utility', 'simple'
- **Help System**: Updated to show both Copilot and Codex CLI information
- **Version Tool**: Now reports versions for both CLI tools

### 🏗️ Technical
- **New Executor**: Added `copilotExecutor.ts` for GitHub Copilot CLI integration
- **Enhanced Output Parsing**: Added Copilot-specific output formatting
- **Type Safety**: Improved TypeScript types for new tool parameters
- **Logging**: Updated logging prefix to `[COPILOT-MCP]`

### 📚 Documentation
- **README Update**: Comprehensive documentation for both Copilot and Codex CLI usage
- **Usage Examples**: Added examples for all new tools and features
- **Installation**: Updated installation instructions for both CLI tools

### 🔧 Maintenance
- **Backward Compatibility**: All existing Codex tools continue to work
- **Dependencies**: No breaking changes to existing dependencies
- **Configuration**: Existing MCP configurations continue to work

## [1.1.0] - Previous Release

- Enhanced Codex CLI integration
- Batch processing support
- Code review tools
- Change mode support

## [1.0.0] - Initial Release

- Public release
- Basic Codex CLI integration
- Support for file analysis with @ syntax
- Sandbox mode support
