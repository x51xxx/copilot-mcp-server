# Use Cases for GitHub Copilot CLI

The following sections provide examples of tasks you can complete with GitHub Copilot CLI.

## Local tasks

From within a project directory you can ask Copilot to make a change to the code in the project. 

### Code Modification
**Example**: Change styling in your project
```bash
copilot -p "Change the background-color of H1 headings to dark blue" --allow-all-tools
```

Copilot finds the CSS file where H1 headings are defined and changes the color value.

### File History Analysis
**Example**: Review recent changes
```bash
copilot -p "Show me the last 5 changes made to the CHANGELOG.md file. Who changed the file, when, and give a brief summary of the changes they made" --allow-all-tools
```

### Code Improvement
**Example**: Enhance existing code
```bash
copilot -p "Suggest improvements to content.js" --allow-all-tools
```

```bash
copilot -p "Rewrite the readme in this project to make it more accessible to newcomers" --allow-all-tools
```

### Git Operations
**Example**: Version control tasks
```bash
copilot -p "Commit the changes to this repo" --allow-all-tools
```

```bash
copilot -p "Revert the last commit, leaving the changes unstaged" --allow-all-tools
```

### Application Creation
**Example**: Build applications from scratch
```bash
copilot -p "Use the create-next-app kit and tailwind CSS to create a next.js app. The app should be a dashboard built with data from the GitHub API. It should track this project's build success rate, average build duration, number of failed builds, and automated test pass rate. After creating the app, give me easy to follow instructions on how to build, run, and view the app in my browser." --allow-all-tools
```

### Troubleshooting
**Example**: Debug and fix issues
```bash
copilot -p "You said: 'The application is now running on http://localhost:3002 and is fully functional!' but when I browse to that URL I get 'This site can't be reached'" --allow-all-tools
```

## Tasks involving GitHub.com

### Fetching GitHub Data
**Example**: List your work
```bash
copilot -p "List my open PRs" --allow-all-tools
```

This lists your open pull requests from any repository on GitHub. For more specific results, include the repository name in your prompt:

```bash
copilot -p "List all open issues assigned to me in OWNER/REPO" --allow-all-tools
```

### Working on Issues
**Example**: Start working on an assigned issue
```bash
copilot -p "I've been assigned this issue: https://github.com/octo-org/octo-repo/issues/1234. Start working on this for me in a suitably named branch." --allow-all-tools
```

### Creating Pull Requests
**Example**: Make changes and create PR
```bash
copilot -p "In the root of this repo, add a Node script called user-info.js that outputs information about the user who ran the script. Create a pull request to add this file to the repo on GitHub." --allow-all-tools
```

```bash
copilot -p "Create a PR that updates the README at https://github.com/octo-org/octo-repo, changing the subheading 'How to run' to 'Example usage'" --allow-all-tools
```

Copilot creates a pull request on github.com, on your behalf. You are marked as the pull request author.

### Issue Management
**Example**: Create issues
```bash
copilot -p "Raise an improvement issue in octo-org/octo-repo. In src/someapp/somefile.py the \`file = open('data.txt', 'r')\` block opens a file but never closes it." --allow-all-tools
```

### Code Review
**Example**: Review pull request changes
```bash
copilot -p "Check the changes made in PR https://github.com/octo-org/octo-repo/pull/57575. Report any serious errors you find in these changes." --allow-all-tools
```

Copilot responds in the CLI with a summary of any problems it finds.

### Pull Request Management
**Example**: Manage PRs
```bash
copilot -p "Merge all of the open PRs that I've created in octo-org/octo-repo" --allow-all-tools
```

```bash
copilot -p "Close PR #11 on octo-org/octo-repo" --allow-all-tools
```

### Finding Issues
**Example**: Discover good first issues
```bash
copilot -p "Use the Github MCP server to find good first issues for a new team member to work on from octo-org/octo-repo" --allow-all-tools
```

::: tip
If you know that a specific MCP server can achieve a particular task, then specifying it in your prompt can help Copilot to deliver the results you want.
:::

### GitHub Actions
**Example**: Find workflows
```bash
copilot -p "List any Actions workflows in this repo that add comments to PRs" --allow-all-tools
```

**Example**: Create GitHub Actions workflow
```bash
copilot -p "Branch off from main and create a github actions workflow that will run on pull requests, or can be run manually. The workflow should run eslint to check for problems in the changes made in the PR. If warnings or errors are found these should be shown as messages in the diff view of the PR. I want to prevent code with errors from being merged into main so, if any errors are found, the workflow should cause the PR check to fail. Push the new branch and create a pull request." --allow-all-tools
```

## MCP Integration Use Cases

When using GitHub Copilot CLI through the MCP server, you can leverage additional capabilities:

### Batch Processing
**Example**: Process multiple tasks
```typescript
// Using batch-copilot tool
{
  "tasks": [
    {
      "task": "Add TypeScript types to user.js",
      "target": "@src/models/user.js",
      "priority": "high"
    },
    {
      "task": "Update all console.log to use logger",
      "target": "@src/",
      "priority": "normal"
    }
  ],
  "parallel": false,
  "stopOnError": true
}
```

### Comprehensive Code Review
**Example**: Multi-faceted code review
```typescript
// Using review-copilot tool
{
  "target": "@src/",
  "reviewType": "comprehensive",
  "severity": "medium",
  "includeFixSuggestions": true,
  "generateReport": true
}
```

### Structured Analysis
**Example**: File analysis with @ syntax
```bash
ask-copilot: "Analyze @src/main.ts and explain the architecture patterns used"
```

These use cases demonstrate the versatility of GitHub Copilot CLI for both standalone terminal use and integration with MCP clients for enhanced development workflows.