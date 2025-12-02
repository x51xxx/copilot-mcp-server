# Repository Guidelines

## Project Structure & Module Organization

- `src/` holds the MCP server entrypoint (`index.ts`), shared constants, and reusable utilities; tools live in `src/tools/` and register through its local `index.ts`.
- Place shared executors, parsers, and helpers in `src/utils/` to avoid duplicating logic per tool.
- `docs/` runs the VitePress documentation site; update individual tool references in `docs/api/tools/` when behaviour changes.
- Build artifacts are emitted to `dist/`; support scripts sit under `scripts/`, and runnable samples stay in `examples/` for quick demos.

## Build, Test, and Development Commands

- `npm install` installs dependencies (Node ≥ 18).
- `npm run build` transpiles TypeScript to ESM code in `dist/`.
- `npm run dev` rebuilds then boots the MCP server for iterative smoke tests.
- `npm start` launches the already compiled server output.
- `npm run lint` executes `tsc --noEmit` in strict mode; treat any failure as a blocker.
- `npm test` currently passes as a placeholder—extend with targeted suites before relying on automation.
- Docs workflows: `npm run docs:dev`, `npm run docs:build`, and `npm run docs:preview` for local authoring.

## Coding Style & Naming Conventions

- Use TypeScript with explicit types and Zod schemas for runtime validation.
- Follow 2-space indentation, single quotes, and ESM imports ending in `.js`.
- Name tools `tool-name.tool.ts`, export `const toolNameTool`, and register them in `src/tools/index.ts`.
- Centralise shared behaviour in `src/utils/` rather than copying logic across tools.

## Testing Guidelines

- Add focused test files beside the code under test (e.g. `src/tools/ask.tool.test.ts`).
- Run `npm run lint` and `npm run build` before every PR to catch typing and compile issues.
- Manually validate new tools via the GitHub Copilot CLI and confirm progress callbacks, error handling, and docs alignment.

## Commit & Pull Request Guidelines

- Use Conventional Commits (`feat:`, `fix:`, `chore:`) mirroring the existing history, and scope changes narrowly.
- Document intent in each message, such as `feat: add review prompt caching`.
- PRs should include a concise summary, linked issues, testing notes, relevant doc updates, and CLI output or screenshots for user-visible updates.

## Security & Configuration Tips

- Keep credentials and local CLI configs out of source control; rely on ignored `.env` entries when needed.
- Use the `timeout-test` tool to verify long-running actions emit progress updates without leaking sensitive data.
