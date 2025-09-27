import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Copilot MCP Server',
  description: 'MCP server for GitHub Copilot CLI integration',
  
  themeConfig: {
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Guide', link: '/guide/getting-started' },
      { text: 'API', link: '/api/tools' },
      { text: 'Examples', link: '/examples/basic-usage' }
    ],

    sidebar: {
      '/guide/': [
        {
          text: 'Getting Started',
          items: [
            { text: 'Introduction', link: '/guide/introduction' },
            { text: 'Installation', link: '/guide/installation' },
            { text: 'Configuration', link: '/guide/configuration' },
            { text: 'Getting Started', link: '/guide/getting-started' }
          ]
        }
      ],
      '/api/': [
        {
          text: 'API Reference',
          items: [
            { text: 'Tools Overview', link: '/api/tools' },
            { text: 'Ask Tool', link: '/api/ask-tool' },
            { text: 'Batch Tool', link: '/api/batch-tool' },
            { text: 'Review Tool', link: '/api/review-tool' },
            { text: 'Brainstorm Tool', link: '/api/brainstorm-tool' }
          ]
        }
      ],
      '/examples/': [
        {
          text: 'Examples',
          items: [
            { text: 'Basic Usage', link: '/examples/basic-usage' },
            { text: 'Batch Operations', link: '/examples/batch-operations' },
            { text: 'Code Review', link: '/examples/code-review' },
            { text: 'Brainstorming', link: '/examples/brainstorming' }
          ]
        }
      ]
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/x51xxx/copilot-mcp-server' }
    ]
  }
})