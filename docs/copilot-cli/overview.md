# About GitHub Copilot CLI

Find out about using Copilot from the command line.

## Who can use this feature?

GitHub Copilot CLI is available with the GitHub Copilot Pro, GitHub Copilot Pro+, GitHub Copilot Business and GitHub Copilot Enterprise plans.

::: info Note
If you receive Copilot from an organization, the Copilot CLI policy must be enabled in the organization's settings.
:::

## Introduction

The command-line interface (CLI) for GitHub Copilot allows you to use Copilot directly from your terminal. You can use it to answer questions, write and debug code, and interact with GitHub.com. For example, you can ask Copilot to make some changes to a project and create a pull request.

GitHub Copilot CLI gives you quick access to a powerful AI agent, without having to leave your terminal. It can help you complete tasks more quickly by working on your behalf, and you can work iteratively with GitHub Copilot CLI to build the code you need.

::: warning Public Preview
GitHub Copilot CLI is in public preview and subject to change.
:::

## Supported operating systems

- **Linux**
- **macOS** 
- **Windows** from within Windows Subsystem for Linux (WSL). Native Windows support in Powershell is available, but experimental.

For installation instructions, see [Installing GitHub Copilot CLI](./installation).

## Modes of use

GitHub Copilot CLI can be used in two modes:

### Interactive mode
Start an interactive session by using the `copilot` command. This is the default mode for working with the CLI.

In this mode, you can prompt Copilot to answer a question, or perform a task. You can react to Copilot's responses in the same session.

![Screenshot of the Welcome message in the interactive mode of Copilot](https://docs.github.com/assets/cb-76024/images/help/copilot/copilot-cli-welcome.png)

### Programmatic mode
You can also pass the CLI a single prompt directly on the command line. You do this by using the `-p` or `--prompt` command-line option. To allow Copilot to modify and execute files you should also use one of the approval options (see [Tool Permissions](./tool-permissions) later in this article). For example:

```bash
copilot -p "List my open PRs" --allow-all-tools
```

Alternatively, you can use a script to output command-line options and pipe this to copilot. For example:

```bash
echo ./script-outputting-options.sh | copilot
```

::: danger Caution
If you use an automatic approval option such as `--allow-all-tools`, Copilot has the same access as you do to files on your computer, and can run any shell commands that you can run, without getting your prior approval. See [Security Considerations](./security), later in this article.
:::

## Model usage

The default model used by GitHub Copilot CLI is **Claude Sonnet 4**. GitHub reserves the right to change this model.

You can change the model to **GPT-5** by setting the `COPILOT_MODEL` environment variable to `gpt-5`.

```bash
export COPILOT_MODEL=gpt-5
```

Each time you submit a prompt to Copilot in Copilot CLI's interactive mode, and each time you use Copilot CLI in programmatic mode, your monthly quota of Copilot premium requests is reduced by one. For information about premium requests, see [Requests in GitHub Copilot](https://docs.github.com/en/copilot/using-github-copilot/using-github-copilot-in-your-ide).

## Feedback

If you have any feedback about GitHub Copilot CLI, please let us know by using the `/feedback` slash command in an interactive session and choosing one of the options. You can complete a private feedback survey, submit a bug report, or suggest a new feature.

## Integration with MCP

The **Copilot MCP Tool** bridges GitHub Copilot CLI with Model Context Protocol (MCP) compatible clients like Claude, Cursor, and others. This allows you to:

- Execute Copilot CLI commands from your MCP client
- Stream progress and results back to your client
- Manage tool permissions and directory access
- Perform batch operations and comprehensive code reviews

See the [Getting Started](/getting-started) guide to learn how to set up the MCP integration.