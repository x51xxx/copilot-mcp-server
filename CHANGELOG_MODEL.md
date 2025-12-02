# Model Selection Feature - Changelog

## v1.1.0 - Model Selection Support

### Added

#### Environment Variable Support

- Added `COPILOT_MODEL` environment variable for global model configuration
- Environment variables defined in `src/constants.ts`:
  - `COPILOT_MODEL` - Default AI model selection
  - `HTTPS_PROXY` - Proxy configuration (already supported)
  - `HTTP_PROXY` - Proxy configuration (already supported)

#### Model Parameter in All Tools

Added `model` parameter to all core tools:

- ✅ `ask.tool.ts` - Execute Copilot CLI with model selection
- ✅ `batch.tool.ts` - Batch processing with consistent model
- ✅ `review.tool.ts` - Code reviews with specific model
- ✅ `brainstorm.tool.ts` - Brainstorming with chosen model

#### CLI Constants

- Added `CLI.FLAGS.MODEL` constant (`-m` flag)
- Added `CLI.MODELS` with predefined model names:
  - `CLAUDE_SONNET_4_5`: "claude-sonnet-4.5"
  - `CLAUDE_SONNET_4`: "claude-sonnet-4"
  - `GPT_4O`: "gpt-4o"
  - `O1`: "o1"
  - `O1_MINI`: "o1-mini"
- Updated `CLI.DEFAULTS.MODEL` to read from `process.env.COPILOT_MODEL`

#### Executor Updates

- Updated `CopilotExecOptions` interface with `model` parameter
- Modified `executeCopilot()` to handle model selection with priority:
  1. Explicit parameter from tool call
  2. `COPILOT_MODEL` environment variable
  3. Copilot CLI default
- Modified `executeCopilotCLI()` with same model selection logic
- Models passed via `-m` flag to Copilot CLI

#### Documentation

- Updated `CLAUDE.md` with model selection information
- Created `docs/MODEL_SELECTION.md` - Comprehensive model selection guide
- Added "Environment Variables" section to CLAUDE.md

### Implementation Details

```typescript
// Priority: explicit param > env var > default
const model = options?.model || process.env.COPILOT_MODEL;
if (model) {
  args.push('-m', model);
}
```

### Usage Examples

#### Set Global Default via Environment

```bash
export COPILOT_MODEL=claude-sonnet-4.5
```

#### Override Per Request

```typescript
await ask({
  prompt: 'Explain this code',
  model: 'gpt-4o', // Override for this request
});
```

#### MCP Configuration

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

### Files Modified

#### Constants

- `src/constants.ts` - Added ENV object, MODEL flag, MODELS enum

#### Tools

- `src/tools/ask.tool.ts` - Added model parameter and handling
- `src/tools/batch.tool.ts` - Added model parameter and handling
- `src/tools/review.tool.ts` - Added model parameter and handling
- `src/tools/brainstorm.tool.ts` - Added model parameter and handling

#### Executors

- `src/utils/copilotExecutor.ts` - Added model selection logic

#### Documentation

- `CLAUDE.md` - Updated with model selection info
- `docs/MODEL_SELECTION.md` - New comprehensive guide

### Compatibility

- **Minimum Copilot CLI version:** v0.0.329+ (for model selection support)
- **Backward compatible:** Yes - model parameter is optional
- **Breaking changes:** None

### Testing

✅ TypeScript compilation: `npm run build`
✅ Type checking: `npm run lint`
✅ All tools support model parameter
✅ Environment variable fallback works
✅ Priority order: param > env > default

### References

- GitHub Copilot CLI v0.0.329 - Added `/model` command and model selection
- [Copilot CLI Releases](https://github.com/github/copilot-cli/releases)
