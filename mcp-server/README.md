# React Spectrum Charts MCP Server

A [Model Context Protocol (MCP)](https://modelcontextprotocol.io) server for React Spectrum Charts. Similar to the official [@react-spectrum/mcp](https://github.com/adobe/react-spectrum/tree/main/packages/dev/mcp/s2) server, it provides tools for browsing documentation, exploring the codebase, and generating chart components.

## Features

### 📚 Documentation Tools

| Tool | Description |
|------|-------------|
| `list_rsc_pages` | List all documentation pages (filter by category) |
| `get_rsc_page_info` | Get page info with section list |
| `get_rsc_page` | Get full page content or specific section |
| `search_rsc_docs` | Search documentation by keyword |
| `list_rsc_components` | List all chart components with docs |

### 🚀 Code Generation Tools

| Tool | Description |
|------|-------------|
| `create_bar_chart` | Create bar chart from natural language |
| `generate_bar_chart` | Generate bar chart with explicit config |
| `list_example_data` | List available data templates |

### 🔍 Exploration Tools

| Tool | Description |
|------|-------------|
| `list_packages` | List all monorepo packages |
| `get_package_info` | Get package.json details |
| `search_files` | Search files by pattern |
| `get_repo_structure` | Get repository overview |

## Installation

### Option 1: From npm (after publishing)

```bash
npm install -g @adobe/react-spectrum-charts-mcp
```

### Option 2: From source

```bash
cd mcp-server
yarn install
yarn build
```

## Configuration

### Cursor IDE

Add to `~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "react-spectrum-charts": {
      "command": "node",
      "args": ["/path/to/react-spectrum-charts/mcp-server/dist/index.js"]
    }
  }
}
```

### Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "react-spectrum-charts": {
      "command": "node",
      "args": ["/path/to/react-spectrum-charts/mcp-server/dist/index.js"]
    }
  }
}
```

### External Usage (with workspace path)

If running from outside the repo:

```json
{
  "mcpServers": {
    "react-spectrum-charts": {
      "command": "spectrum-charts-mcp",
      "args": ["--workspace=/path/to/react-spectrum-charts"]
    }
  }
}
```

## Example Commands

### 📚 Browse Documentation

```text
"List all React Spectrum Charts documentation pages"
"Show me the Bar component documentation"
"Get the Props section from the Bar docs"
"Search the docs for tooltip"
"What chart components are available?"
```

### 📊 Generate Charts

```text
"Create a bar chart for sales data"
"Create a horizontal bar chart for browser downloads"
"Create a stacked bar chart for quarterly revenue by region"
"Create a bar chart titled 'Product Performance'"
```

### 🔍 Explore Codebase

```text
"List all packages in the monorepo"
"What's in the @adobe/react-spectrum-charts package?"
"Search for test files"
"Show me the repository structure"
```

## CLI Options

```text
spectrum-charts-mcp [options]

Options:
  --workspace=<path>  Path to react-spectrum-charts repo
  -w <path>           Short form of --workspace
  --help, -h          Show help
  --version, -v       Show version

Environment Variables:
  RSC_WORKSPACE       Path to react-spectrum-charts repo
```

## Project Structure

```text
mcp-server/
├── index.ts                 # Main server implementation
├── src/
│   └── docs-manager.ts      # Documentation parsing module
├── package.json
├── tsconfig.json
├── README.md
├── EXAMPLE_USAGE.md
└── dist/                    # Compiled output
```

## Development

### Build

```bash
yarn build
```

### Test locally

```bash
node dist/index.js --help
node dist/index.js --version
```

### Adding New Tools

1. Add tool definition in `ListToolsRequestSchema` handler
2. Add handler in `CallToolRequestSchema` switch statement
3. Rebuild with `yarn build`

## Available Example Data

| Template | Fields | Description |
|----------|--------|-------------|
| **sales** | category, revenue | Product category sales |
| **browsers** | browser, downloads | Browser download stats |
| **quarterly** | quarter, revenue, region | Regional quarterly data |
| **products** | product, units, profit | Product performance |
| **monthly** | month, value | Monthly trends |

## Architecture

- **@modelcontextprotocol/sdk** - Official MCP SDK
- **TypeScript** - Type-safe implementation
- **Zod** - Runtime validation
- **Node.js** - File system APIs

## Related

- [Example Usage Guide](./EXAMPLE_USAGE.md) - Detailed examples of natural language interactions
- [React Spectrum MCP](https://github.com/adobe/react-spectrum/tree/main/packages/dev/mcp/s2) - Similar MCP server for React Spectrum (S2)
- [Model Context Protocol](https://modelcontextprotocol.io) - MCP specification

## License

Apache-2.0
