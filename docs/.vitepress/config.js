import { defineConfig } from 'vitepress'
import { withMermaid } from 'vitepress-plugin-mermaid'

export default withMermaid(
  defineConfig({
    title: 'Copilot MCP Tool',
    titleTemplate: ':title | Copilot MCP Tool Docs',
    description: 'Bridge GitHub Copilot CLI and Codex CLI with MCP-compatible clients. Execute tasks, analyze codebases, and stream progress to your MCP client.',
    base: '/copilot-mcp-tool/',
    lastUpdated: true,
    cleanUrls: true,
    
    // Force dark mode by default
    //appearance: 'dark',
    
    head: [
      // Using emoji as favicon
      ['link', { rel: 'icon', href: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🤖</text></svg>' }],
      ['meta', { name: 'theme-color', content: '#0ea5e9' }],
      ['meta', { property: 'og:type', content: 'website' }],
      ['meta', { property: 'og:locale', content: 'en' }],
      ['meta', { property: 'og:title', content: 'Copilot MCP Tool | Bridge GitHub Copilot CLI with MCP' }],
      ['meta', { property: 'og:site_name', content: 'Copilot MCP Tool' }],
      ['meta', { property: 'og:description', content: 'Model Context Protocol server for GitHub Copilot CLI and Codex CLI integration. Analyze code, brainstorm ideas, and execute tasks with AI.' }],
      ['meta', { property: 'og:url', content: 'https://x51xxx.github.io/copilot-mcp-tool/' }]
    ],
    
    themeConfig: {
    // No logo - using text branding instead
    
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Getting Started', link: '/getting-started' },
      { text: 'GitHub Copilot CLI', link: '/copilot-cli/overview' }
    ],

    sidebar: [
      {
        text: 'Getting Started',
        collapsed: false,
        items: [
          { text: 'Overview', link: '/' },
          { text: 'Installation', link: '/getting-started' }
        ]
      },
      {
        text: 'GitHub Copilot CLI',
        collapsed: false,
        items: [
          { text: 'Overview', link: '/copilot-cli/overview' },
          { text: 'Installation', link: '/copilot-cli/installation' },
          { text: 'Usage Examples', link: '/copilot-cli/usage-examples' },
          { text: 'Security Considerations', link: '/copilot-cli/security' },
          { text: 'Tool Permissions', link: '/copilot-cli/tool-permissions' },
          { text: 'Use Cases', link: '/copilot-cli/use-cases' }
        ]
      },
      {
        text: 'Core Concepts',
        collapsed: false,
        items: [
          { text: 'How It Works', link: '/concepts/how-it-works' },
          { text: 'File Analysis (@)', link: '/concepts/file-analysis' }
        ]
      },
      {
        text: 'API Reference',
        collapsed: false,
        items: [
          {
            text: 'Primary Tools',
            items: [
              { text: 'ask', link: '/api/tools/ask' },
              { text: 'batch', link: '/api/tools/batch' },
              { text: 'review', link: '/api/tools/review' }
            ]
          },
          {
            text: 'Utility Tools',
            items: [
              { text: 'brainstorm', link: '/api/tools/brainstorm' },
              { text: 'ping', link: '/api/tools/ping' },
              { text: 'help', link: '/api/tools/help' },
              { text: 'version', link: '/api/tools/version' },
              { text: 'timeout-test', link: '/api/tools/timeout-test' }
            ]
          }
        ]
      },
      {
        text: 'Examples',
        collapsed: false,
        items: [
          { text: 'Basic Usage', link: '/examples/basic-usage' },
          { text: 'Advanced Usage', link: '/examples/advanced-usage' },
          { text: 'Brainstorming', link: '/examples/brainstorming' }
        ]
      },
      {
        text: 'Resources',
        collapsed: false,
        items: [
          { text: 'Troubleshooting', link: '/resources/troubleshooting' },
          { text: 'FAQ', link: '/resources/faq' }
        ]
      },
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/x51xxx/copilot-mcp-server' }
    ],

    footer: {
      message: 'Released under the MIT License.',
      copyright: `Copyright © ${new Date().getFullYear()} Copilot MCP Tool Contributors`
    },

    search: {
      provider: 'local',
      options: {
        placeholder: 'Search docs...',
        detailedView: true,
        translations: {
          button: {
            buttonText: 'Search',
            buttonAriaLabel: 'Search documentation'
          },
          modal: {
            noResultsText: 'No results found',
            resetButtonTitle: 'Clear search',
            footer: {
              selectText: 'to select',
              navigateText: 'to navigate',
              closeText: 'to close'
            }
          }
        }
      }
    },

    editLink: {
      pattern: 'https://github.com/x51xxx/copilot-mcp-server/edit/main/docs/:path',
      text: 'Edit this page on GitHub'
    },

    lastUpdated: {
      text: 'Last updated',
      formatOptions: {
        dateStyle: 'medium',
        timeStyle: 'short'
      }
    },

    docFooter: {
      prev: 'Previous page',
      next: 'Next page'
    },

    outline: {
      label: 'On this page',
      level: [2, 3]
    },

    returnToTopLabel: 'Return to top',
    sidebarMenuLabel: 'Menu',
    darkModeSwitchLabel: 'Appearance',
    lightModeSwitchTitle: 'Switch to light theme',
    darkModeSwitchTitle: 'Switch to dark theme'
  }
})
)
