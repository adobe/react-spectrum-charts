# MCP Server

React Spectrum Charts provides an [MCP (Model Context Protocol)](https://modelcontextprotocol.io/) server that exposes documentation to AI assistants like Claude and Cursor. This enables AI tools to access accurate, up-to-date documentation when helping you build charts.

## Installation

The MCP server is published as a standalone package. AI tools run it directly using your preferred package runner:

```bash
# Using npx (npm)
npx @adobe/react-spectrum-charts-mcp

# Using yarn
yarn dlx @adobe/react-spectrum-charts-mcp

# Using pnpm
pnpm dlx @adobe/react-spectrum-charts-mcp
```

## Configuration

### Claude Desktop

Add to your Claude Desktop configuration file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

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

> **Note:** You can also use `npx` or `pnpm dlx` depending on your preferred package manager.

## Available Tools

The MCP server provides two tools:

### list_rsc_docs

Lists all available documentation pages with their IDs and titles.

**Example response:**
```json
[
  { "id": "intro", "title": "Introduction to React Spectrum Charts" },
  { "id": "api/Chart", "title": "Chart" },
  { "id": "api/visualizations/Bar", "title": "Bar" }
]
```

### read_rsc_doc

Returns the full markdown content for a documentation page by ID.

**Parameters:**
- `id` (string, required): Document ID from `list_rsc_docs`

**Example usage:**
```
read_rsc_doc({ id: "api/visualizations/Bar" })
```

## Usage Tips

When working with an AI assistant that has the MCP server configured:

1. Ask the assistant to check the React Spectrum Charts documentation for specific components
2. The assistant will use `list_rsc_docs` to find relevant pages
3. Then use `read_rsc_doc` to retrieve the full documentation

**Example prompts:**
- "Check the React Spectrum Charts docs for how to create a bar chart"
- "Look up the Chart component API in the RSC documentation"
- "What props does the Line component support? Check the docs."

## Troubleshooting

### Server not connecting

1. Check that the MCP configuration file is valid JSON
2. Restart the AI tool after configuration changes
3. For Claude Desktop, ensure Node.js 18+ is installed on your system

### Command not found

Try using the full path to your package runner:

```json
{
  "mcpServers": {
    "react-spectrum-charts": {
      "command": "/usr/local/bin/yarn",
      "args": ["dlx", "@adobe/react-spectrum-charts-mcp"]
    }
  }
}
```

