# React Spectrum Charts MCP Server

A [Model Context Protocol (MCP)](https://modelcontextprotocol.io) server for React Spectrum Charts documentation.

## Tools

| Tool | Description |
|------|-------------|
| `search_rsc_docs` | Search documentation by one or more terms; returns matching pages with snippets |
| `get_rsc_doc` | Get full markdown/MDX content for a documentation page by ID |

## Installation

### From npm

```bash
npm install -g @adobe/react-spectrum-charts-mcp
```

### From source

```bash
cd packages/mcp
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
      "command": "npx",
      "args": ["@adobe/react-spectrum-charts-mcp"]
    }
  }
}
```

### Local development

```json
{
  "mcpServers": {
    "react-spectrum-charts": {
      "command": "node",
      "args": ["/path/to/react-spectrum-charts/packages/mcp/dist/index.js"]
    }
  }
}
```

**Note:** The server must be run from the react-spectrum-charts repository root, as it reads docs from `packages/docs/docs`.

## Usage

### Search Documentation

```text
"Search React Spectrum Charts docs for tooltip"
"Find documentation about Bar charts"
"Search for axis configuration"
```

Returns matching pages with IDs, titles, and context snippets.

### Get Full Documentation

```text
"Get the full documentation for guides/chart-basics"
"Show me the api/visualizations/Bar documentation"
```

Uses the `id` from search results to fetch complete page content.

## CLI Options

```text
spectrum-charts-mcp [options]

Options:
  --help, -h      Show help
  --version, -v   Show version
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

## Architecture

- **@modelcontextprotocol/sdk** - Official MCP SDK
- **TypeScript** - Type-safe implementation  
- **Zod** - Schema validation

## Related

- [React Spectrum MCP](https://github.com/adobe/react-spectrum/tree/main/packages/dev/mcp/s2) - Similar MCP server for React Spectrum (S2)
- [Model Context Protocol](https://modelcontextprotocol.io) - MCP specification

## License

Apache-2.0
