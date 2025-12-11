# React Spectrum Charts MCP Server

A [Model Context Protocol (MCP)](https://modelcontextprotocol.io) server that exposes React Spectrum Charts documentation to AI assistants like Claude and Cursor.

## Tools

| Tool | Description |
|------|-------------|
| `list_rsc_docs` | Lists all documentation pages with IDs and titles |
| `read_rsc_doc` | Returns full markdown content for a documentation page |

## Setup

Add the server to your AI tool's MCP configuration. The tool will automatically start and manage the server.

### Cursor

Add to your project's `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "react-spectrum-charts": {
      "command": "yarn",
      "args": ["dlx", "@adobe/react-spectrum-charts-mcp"]
    }
  }
}
```

Then restart Cursor.

### Claude Desktop

Add to your config file:

**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`  
**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "react-spectrum-charts": {
      "command": "yarn",
      "args": ["dlx", "@adobe/react-spectrum-charts-mcp"]
    }
  }
}
```

Then restart Claude Desktop.

> **Note:** You can also use `npx` or `pnpm dlx` instead of `yarn dlx`.

## Usage

Once configured, ask your AI assistant about React Spectrum Charts:

- "What chart components are available in React Spectrum Charts?"
- "Show me how to create a bar chart"
- "What props does the Line component accept?"

The AI will automatically use the MCP tools to fetch documentation.

## Development

### Build from source

```bash
cd packages/mcp
yarn build
```

### Run tests

```bash
yarn test
```

### Test with MCP Inspector

```bash
yarn build
npx @modelcontextprotocol/inspector node dist/index.js
```

### Local development config

For testing local changes, point to the built file:

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

- [MCP Server Documentation](https://opensource.adobe.com/react-spectrum-charts/docs/docs/developers/McpServer) - Full setup guide