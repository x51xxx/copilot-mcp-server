# Security Considerations

When you use Copilot CLI, Copilot can perform tasks on your behalf, such as executing or modifying files, or running shell commands.

You should therefore always keep security considerations in mind when using Copilot CLI, just as you would when working directly with files yourself, or running commands directly in your terminal. You should always review suggested commands carefully when Copilot CLI requests your approval.

## Trusted directories

When you start a GitHub Copilot CLI session, you'll be asked to confirm that you trust the files in, and below, the directory from which you launched the CLI.

::: danger Warning
You should only launch Copilot CLI from directories that you trust. You should not use Copilot CLI in directories that may contain executable files you can't be sure you trust. Similarly, if you launch the CLI from a directory that contains sensitive or confidential data, or files that you don't want to be changed, you could inadvertently expose those files to risk. Typically, you should not launch Copilot CLI from your home directory.

Scoping of permissions is heuristic and GitHub does not guarantee that all files outside trusted directories will be protected. See [Risk mitigation](#risk-mitigation) later in this article.
:::

You can choose to trust the current directory for:

1. **The currently running session only**
2. **This and future sessions**

If you choose to trust the directory for future sessions, the trusted directory prompt will not be displayed again. You should only choose this second option if you are sure that this location will always be a safe place for Copilot to operate.

You can edit the list of permanently trusted directories by amending the contents of the `trusted_folders` array in the CLI's `config.json` file. This is located, by default, in the `~/.config` directory. You can change this location by setting the `XDG_CONFIG_HOME` environment variable.

## Allowed tools

The first time that Copilot needs to use a tool that could be used to modify or execute a file—for example, `touch`, `chmod`, `node`, or `sed`—it will ask you whether you want to allow it to use that tool.

Typically, you can choose from three options:

1. **Yes**
2. **Yes, and approve TOOL for the rest of the running session**
3. **No, and tell Copilot what to do differently (Esc)**

### Option 1: Yes (once only)

Allows Copilot to run this particular command, this time only. The next time it needs to use this tool, it will ask you again.

### Option 2: Yes, approve for session

Allows Copilot to use this tool again, without asking you for permission, for the duration of the currently running session. It will ask for your approval again in new sessions, or if you resume the current session in the future.

::: warning Important
If you choose this option, you are allowing Copilot to use this tool in any way it thinks is appropriate. For example, if Copilot asks you to allow it to run the command `rm ./this-file.txt`, and you choose option 2, then Copilot can run any `rm` command (for example, `rm -rf ./*`) during the current run of this session, without asking for your approval.
:::

### Option 3: No, try differently

Cancels the proposed command and allows you to tell Copilot to try a different approach.

## Security implications of automatic tool approval

It's important to be aware of the security implications of using the approval command-line options. These options allow Copilot to execute commands needed to complete your request, without giving you the opportunity to review and approve those commands before they are run. While this streamlines workflows, and allows headless operation of the CLI, it increases the risk of unintended actions being taken that might result in data loss or corruption, or other security issues.

## Risk mitigation

You can mitigate the risks associated with using the automatic approval options by using Copilot CLI in a restricted environment, such as a virtual machine, container, or dedicated system, without internet access. This confines any potential damage that could occur when allowing Copilot to execute commands that you have not reviewed and verified.

### Best practices for secure usage

#### 1. Environment isolation

- Use Copilot CLI in containerized environments for sensitive operations
- Consider using virtual machines for testing destructive operations
- Limit network access when possible

#### 2. Directory management

- Always launch from trusted project directories
- Avoid launching from home directories or system directories
- Regularly review and clean up trusted directories list

#### 3. Tool permissions

- Start with restrictive permissions and gradually expand as needed
- Review tool approval requests carefully
- Use session-scoped approvals rather than permanent ones

#### 4. Code review practices

- Always review generated code before committing
- Test changes in isolated environments first
- Use version control to track all changes made by Copilot

#### 5. Data protection

- Avoid using Copilot CLI in directories with sensitive data
- Be cautious with repositories containing secrets or credentials
- Use `.gitignore` and similar files to protect sensitive files

## MCP Integration Security

When using GitHub Copilot CLI through the MCP server, additional security considerations apply:

### Tool permissions in MCP

The MCP server provides additional safety layers:

- `allowAllTools`: Grants broad permissions (use with caution)
- `allowTool`: Grants specific tool permissions
- `denyTool`: Explicitly denies specific tools (takes precedence)

### Directory access control

- `addDir`: Explicitly grants access to specific directories
- Multiple directories can be granted access simultaneously
- Access is scoped to the specific MCP session

### Example secure configuration

```typescript
{
  "prompt": "Review the security of @src/auth.js",
  "allowAllTools": false,
  "allowTool": ["read", "analyze"],
  "denyTool": ["shell(rm)", "shell(chmod)"],
  "addDir": "./src"
}
```

This configuration:

- Disables automatic tool approval
- Allows only read and analyze operations
- Explicitly denies dangerous shell commands
- Restricts access to the `./src` directory only

## Monitoring and auditing

### Logging

GitHub Copilot CLI provides comprehensive logging:

- Set `logLevel` to track all operations
- Use `logDir` to centralize logs for audit purposes
- Monitor logs for unexpected or suspicious activities

### Session management

- Use session IDs to track operations across time
- Review session history for compliance purposes
- Implement session timeout policies where appropriate

By following these security best practices, you can safely leverage the power of GitHub Copilot CLI while maintaining appropriate security controls.
