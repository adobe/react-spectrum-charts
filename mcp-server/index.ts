/*
 * Copyright 2025 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

/**
 * MCP Server for React Spectrum Charts
 * Provides tools and resources for exploring the React Spectrum Charts codebase
 * and generating chart components from text commands
 */
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, GetPromptRequestSchema, ListPromptsRequestSchema, ListResourcesRequestSchema, ListToolsRequestSchema, ReadResourceRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'fs';
import { homedir } from 'os';
import { dirname, join, relative, resolve } from 'path';
import { fileURLToPath } from 'url';



import { PageInfo, buildPageIndex, getComponentPages, getPageContent, getPageInfo, isUsingRemoteMode, searchDocs } from './src/docs-manager.js';


// ES Module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const VERSION = '3.1.0';

// ============================================
// CLI Argument Parsing & Workspace Resolution
// ============================================

/**
 * Show help message and exit
 */
function showHelp(): void {
  console.log(`
React Spectrum Charts MCP Server v${VERSION}

A Model Context Protocol server for React Spectrum Charts.
Browse documentation, explore the codebase, and generate chart components.

Usage:
  spectrum-charts-mcp [options]

Options:
  --workspace=<path>  Path to react-spectrum-charts repository (optional)
  -w <path>           Short form of --workspace
  --help, -h          Show this help message
  --version, -v       Show version number

Environment Variables:
  RSC_WORKSPACE       Path to react-spectrum-charts repository

Modes:
  Remote Mode (default):
    Documentation is fetched from GitHub. No local clone needed.
    Works anywhere - just install and use!

  Local Mode (with --workspace):
    Uses local files for faster access and file operations.
    Required for saving generated files to the repository.

Examples:
  # Remote mode - works without any setup!
  spectrum-charts-mcp

  # Local mode - use with a cloned repo
  spectrum-charts-mcp --workspace=/Users/me/react-spectrum-charts

Claude Desktop / Cursor Configuration:
  {
    "mcpServers": {
      "react-spectrum-charts": {
        "command": "npx",
        "args": ["@adobe/react-spectrum-charts-mcp"]
      }
    }
  }

Documentation: https://opensource.adobe.com/react-spectrum-charts/docs/
GitHub: https://github.com/adobe/react-spectrum-charts
`);
  process.exit(0);
}

/**
 * Expand ~ to home directory in paths
 */
function expandPath(path: string): string {
  if (path.startsWith('~')) {
    return path.replace('~', homedir());
  }
  return resolve(path);
}

/**
 * Parse command line arguments and environment variables
 * to determine the workspace path (optional - returns undefined for remote mode)
 */
function getWorkspacePath(): string | undefined {
  const args = process.argv.slice(2);

  // Priority 1: --workspace=/path argument
  const workspaceArg = args.find((arg) => arg.startsWith('--workspace='));
  if (workspaceArg) {
    return expandPath(workspaceArg.split('=')[1]);
  }

  // Priority 2: -w /path argument
  const wIndex = args.indexOf('-w');
  if (wIndex !== -1 && args[wIndex + 1]) {
    return expandPath(args[wIndex + 1]);
  }

  // Priority 3: RSC_WORKSPACE environment variable
  if (process.env.RSC_WORKSPACE) {
    return expandPath(process.env.RSC_WORKSPACE);
  }

  // Priority 4: Check if running from within repo (mcp-server/dist/)
  const possibleRepoRoot = resolve(__dirname, '..', '..');
  const packagesDir = join(possibleRepoRoot, 'packages');
  if (existsSync(packagesDir)) {
    return possibleRepoRoot;
  }

  // No workspace - will use remote mode
  return undefined;
}

/**
 * Validate that the workspace contains react-spectrum-charts (only if workspace provided)
 */
function validateWorkspace(workspacePath: string): boolean {
  const packageJsonPath = join(workspacePath, 'package.json');

  if (!existsSync(packageJsonPath)) {
    console.error(`Warning: No package.json found at "${workspacePath}"`);
    return false;
  }

  try {
    const pkg = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
    const isSpectrumCharts = pkg.name?.includes('spectrum-charts') || pkg.workspaces?.includes('packages/*');

    if (!isSpectrumCharts) {
      console.error(`Warning: "${workspacePath}" may not be a react-spectrum-charts repository.`);
      return false;
    }
  } catch (error) {
    console.error(`Warning: Error reading package.json: ${error}`);
    return false;
  }

  // Check packages directory exists
  const packagesDir = join(workspacePath, 'packages');
  if (!existsSync(packagesDir)) {
    console.error(`Warning: No "packages" directory found at "${workspacePath}"`);
    return false;
  }

  return true;
}

// Handle --help and --version flags early
const cliArgs = process.argv.slice(2);
if (cliArgs.includes('--help') || cliArgs.includes('-h')) {
  showHelp();
}
if (cliArgs.includes('--version') || cliArgs.includes('-v')) {
  console.log(VERSION);
  process.exit(0);
}

// Resolve workspace path (optional - undefined means remote mode)
const WORKSPACE_ROOT = getWorkspacePath();
const PACKAGES_DIR = WORKSPACE_ROOT ? join(WORKSPACE_ROOT, 'packages') : undefined;

// Validate if workspace is provided
if (WORKSPACE_ROOT) {
  validateWorkspace(WORKSPACE_ROOT);
}

interface PackageInfo {
  name: string;
  version: string;
  description?: string;
  path: string;
}

interface BarChartConfig {
  title?: string;
  dimension: string;
  metric: string;
  color?: string;
  orientation?: 'vertical' | 'horizontal';
  type?: 'stacked' | 'dodged';
  showTooltip?: boolean;
  showLegend?: boolean;
  showAnnotations?: boolean;
  annotationKey?: string;
  width?: number;
  height?: number;
}

interface ChartData {
  [key: string]: string | number;
}

// Type for tool call arguments
interface ToolArguments {
  command?: string;
  customData?: ChartData[];
  saveToFile?: boolean;
  fileName?: string;
  data?: ChartData[];
  dimension?: string;
  metric?: string;
  title?: string;
  color?: string;
  orientation?: 'vertical' | 'horizontal';
  type?: 'stacked' | 'dodged';
  showTooltip?: boolean;
  showLegend?: boolean;
  width?: number;
  height?: number;
  filter?: string;
  packageName?: string;
  pattern?: string;
  directory?: string;
  dataType?: string;
  // Docs tools
  includeDescription?: boolean;
  category?: string;
  page_name?: string;
  section_name?: string;
  query?: string;
}

// ============================================
// Example Data Templates
// ============================================
const EXAMPLE_DATA_TEMPLATES: Record<string, ChartData[]> = {
  sales: [
    { category: 'Electronics', revenue: 125000 },
    { category: 'Clothing', revenue: 89000 },
    { category: 'Home & Garden', revenue: 67000 },
    { category: 'Sports', revenue: 54000 },
    { category: 'Books', revenue: 50000 },
  ],
  browsers: [
    { browser: 'Chrome', downloads: 27000 },
    { browser: 'Firefox', downloads: 8000 },
    { browser: 'Safari', downloads: 7750 },
    { browser: 'Edge', downloads: 7600 },
    { browser: 'Explorer', downloads: 500 },
  ],
  quarterly: [
    { quarter: 'Q1', revenue: 145000, region: 'North' },
    { quarter: 'Q2', revenue: 158000, region: 'North' },
    { quarter: 'Q3', revenue: 172000, region: 'North' },
    { quarter: 'Q4', revenue: 195000, region: 'North' },
    { quarter: 'Q1', revenue: 98000, region: 'South' },
    { quarter: 'Q2', revenue: 112000, region: 'South' },
    { quarter: 'Q3', revenue: 125000, region: 'South' },
    { quarter: 'Q4', revenue: 138000, region: 'South' },
  ],
  products: [
    { product: 'Widget A', units: 1250, profit: 18750 },
    { product: 'Widget B', units: 850, profit: 12750 },
    { product: 'Widget C', units: 320, profit: 9600 },
    { product: 'Widget D', units: 210, profit: 8400 },
  ],
  monthly: [
    { month: 'Jan', value: 4200 },
    { month: 'Feb', value: 3800 },
    { month: 'Mar', value: 5100 },
    { month: 'Apr', value: 4800 },
    { month: 'May', value: 5500 },
    { month: 'Jun', value: 6200 },
  ],
};

/**
 * Get all packages in the monorepo (requires local workspace)
 */
function getPackages(): PackageInfo[] {
  if (!PACKAGES_DIR || !WORKSPACE_ROOT) {
    throw new Error('Local workspace required. Use --workspace=/path/to/react-spectrum-charts');
  }

  const packages: PackageInfo[] = [];

  try {
    const packageDirs = readdirSync(PACKAGES_DIR);

    for (const dir of packageDirs) {
      const packagePath = join(PACKAGES_DIR, dir);
      const packageJsonPath = join(packagePath, 'package.json');

      try {
        if (statSync(packageJsonPath).isFile()) {
          const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
          packages.push({
            name: packageJson.name,
            version: packageJson.version,
            description: packageJson.description,
            path: relative(WORKSPACE_ROOT, packagePath),
          });
        }
      } catch (error) {
        console.error(
          `Warning: Could not read package at ${packagePath}:`,
          error instanceof Error ? error.message : error
        );
        continue;
      }
    }
  } catch (error) {
    console.error('Error reading packages:', error);
  }

  return packages;
}

/**
 * Find files recursively in a directory (requires local workspace)
 */
function findFiles(dir: string, pattern: RegExp, maxDepth: number = 5): string[] {
  if (!WORKSPACE_ROOT) {
    throw new Error('Local workspace required for file search');
  }

  const workspaceRoot = WORKSPACE_ROOT; // TypeScript narrowing
  const files: string[] = [];

  function walk(currentDir: string, depth: number) {
    if (depth > maxDepth) return;

    try {
      const entries = readdirSync(currentDir);

      for (const entry of entries) {
        const fullPath = join(currentDir, entry);
        const stat = statSync(fullPath);

        if (stat.isDirectory() && !entry.startsWith('.') && entry !== 'node_modules' && entry !== 'dist') {
          walk(fullPath, depth + 1);
        } else if (stat.isFile() && pattern.test(entry)) {
          files.push(relative(workspaceRoot, fullPath));
        }
      }
    } catch (error) {
      // Log but continue on inaccessible directories
      console.error(
        `Warning: Could not access directory ${currentDir}:`,
        error instanceof Error ? error.message : error
      );
    }
  }

  walk(dir, 0);
  return files;
}

/**
 * Read file content safely (requires local workspace)
 */
function readFileSafe(filePath: string): string {
  if (!WORKSPACE_ROOT) {
    throw new Error('Local workspace required for file operations');
  }
  try {
    return readFileSync(join(WORKSPACE_ROOT, filePath), 'utf-8');
  } catch (error) {
    throw new Error(`Failed to read file: ${filePath}`);
  }
}

/**
 * Generate bar chart component code
 */
function generateBarChartCode(data: ChartData[], config: BarChartConfig): string {
  const {
    title,
    dimension,
    metric,
    color,
    orientation = 'vertical',
    type = 'stacked',
    showTooltip = true,
    showLegend = false,
    showAnnotations = false,
    annotationKey,
    width = 700,
    height = 450,
  } = config;

  const isHorizontal = orientation === 'horizontal';
  const hasColorSeries = color && color !== 'value' && !color.startsWith('{');

  // Generate imports
  const imports = [`import { ReactElement } from 'react';`, `import { Chart } from '@adobe/react-spectrum-charts';`];

  const components = ['Axis', 'Bar'];
  if (showTooltip) components.push('ChartTooltip');
  if (showLegend && hasColorSeries) components.push('Legend');
  if (title) components.push('Title');
  if (showAnnotations) components.push('Annotation');

  imports.push(`import { ${components.join(', ')} } from '@adobe/react-spectrum-charts';`);

  // Generate data constant
  const dataString = JSON.stringify(data, null, 2);

  // Generate color prop
  let colorProp = '';
  if (color) {
    if (color.startsWith('{') || color.includes('-')) {
      colorProp = `color={{ value: '${color.replace(/[{}'"]/g, '')}' }}`;
    } else {
      colorProp = `color="${color}"`;
    }
  }

  // Build component
  const code = `/*
 * Bar Chart Component
 * Generated by React Spectrum Charts MCP Server
 */

${imports.join('\n')}

const chartData = ${dataString};

export const GeneratedBarChart = (): ReactElement => {
  return (
    <Chart data={chartData} width={${width}} height={${height}}>
      ${title ? `<Title text="${title}" />` : ''}
      <Axis 
        position="${isHorizontal ? 'left' : 'bottom'}" 
        baseline 
        title="${dimension.charAt(0).toUpperCase() + dimension.slice(1)}" 
      />
      <Axis 
        position="${isHorizontal ? 'bottom' : 'left'}" 
        grid 
        title="${metric.charAt(0).toUpperCase() + metric.slice(1)}" 
        labelFormat="shortNumber"
      />
      ${showLegend && hasColorSeries ? `<Legend position="bottom" />` : ''}
      <Bar 
        dimension="${dimension}" 
        metric="${metric}"
        ${colorProp}
        ${orientation !== 'vertical' ? `orientation="${orientation}"` : ''}
        ${type !== 'stacked' ? `type="${type}"` : ''}
      >
        ${
          showTooltip
            ? `<ChartTooltip>
          {(datum) => (
            <div style={{ padding: '8px' }}>
              <strong>{datum.${dimension}}</strong>
              <div>${metric}: {datum.${metric}?.toLocaleString()}</div>
            </div>
          )}
        </ChartTooltip>`
            : ''
        }
        ${showAnnotations && annotationKey ? `<Annotation textKey="${annotationKey}" />` : ''}
      </Bar>
    </Chart>
  );
};

export default GeneratedBarChart;
`;

  return code;
}

/**
 * Parse natural language command to extract chart configuration
 */
function parseChartCommand(command: string): { dataType: string; config: Partial<BarChartConfig> } {
  const lowerCommand = command.toLowerCase();

  // Determine data type
  let dataType = 'sales'; // default
  if (lowerCommand.includes('browser') || lowerCommand.includes('download')) {
    dataType = 'browsers';
  } else if (lowerCommand.includes('quarter') || lowerCommand.includes('region')) {
    dataType = 'quarterly';
  } else if (lowerCommand.includes('product') || lowerCommand.includes('unit')) {
    dataType = 'products';
  } else if (lowerCommand.includes('month')) {
    dataType = 'monthly';
  }

  // Parse configuration from command
  const config: Partial<BarChartConfig> = {};

  // Orientation
  if (lowerCommand.includes('horizontal')) {
    config.orientation = 'horizontal';
  }

  // Type
  if (lowerCommand.includes('grouped') || lowerCommand.includes('dodged') || lowerCommand.includes('side by side')) {
    config.type = 'dodged';
  } else if (lowerCommand.includes('stacked')) {
    config.type = 'stacked';
  }

  // Features
  if (lowerCommand.includes('tooltip') || lowerCommand.includes('hover')) {
    config.showTooltip = true;
  }
  if (lowerCommand.includes('legend')) {
    config.showLegend = true;
  }
  if (lowerCommand.includes('label') || lowerCommand.includes('annotation')) {
    config.showAnnotations = true;
  }

  // Title extraction
  const titleMatch = command.match(/titled?\s+["']([^"']+)["']/i) || command.match(/title:\s*["']?([^"'\n,]+)["']?/i);
  if (titleMatch) {
    config.title = titleMatch[1].trim();
  }

  return { dataType, config };
}

/**
 * Main server setup
 */
async function main() {
  const server = new Server(
    {
      name: 'react-spectrum-charts-mcp',
      version: VERSION,
    },
    {
      capabilities: {
        tools: {},
        resources: {},
        prompts: {},
      },
    }
  );

  /**
   * List available tools
   */
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        // ============================================
        // Code Generation Tools
        // ============================================
        {
          name: 'create_bar_chart',
          description:
            'Create a bar chart from a natural language command. Example: "create bar chart for sales data with horizontal orientation"',
          inputSchema: {
            type: 'object',
            properties: {
              command: {
                type: 'string',
                description:
                  'Natural language command describing the chart. Examples: "create bar chart for sales data", "horizontal bar chart with browser downloads", "stacked bar chart for quarterly revenue by region"',
              },
              customData: {
                type: 'array',
                description:
                  'Optional custom data array. If not provided, example data will be used based on the command.',
                items: {
                  type: 'object',
                },
              },
              saveToFile: {
                type: 'boolean',
                description: 'If true, saves the generated code to a file in the stories directory',
              },
              fileName: {
                type: 'string',
                description: 'Custom file name (without extension) if saving to file',
              },
            },
            required: ['command'],
          },
        },
        {
          name: 'generate_bar_chart',
          description: 'Generate a bar chart component with explicit configuration options',
          inputSchema: {
            type: 'object',
            properties: {
              data: {
                type: 'array',
                description: 'Array of data objects for the chart',
                items: { type: 'object' },
              },
              dimension: {
                type: 'string',
                description: 'The data field to use for bar categories (x-axis for vertical, y-axis for horizontal)',
              },
              metric: {
                type: 'string',
                description: 'The data field to use for bar values',
              },
              title: {
                type: 'string',
                description: 'Optional chart title',
              },
              color: {
                type: 'string',
                description: 'Color field name or color value (e.g., "series" or "categorical-100")',
              },
              orientation: {
                type: 'string',
                enum: ['vertical', 'horizontal'],
                description: 'Bar orientation',
              },
              type: {
                type: 'string',
                enum: ['stacked', 'dodged'],
                description: 'Bar type for multi-series data',
              },
              showTooltip: {
                type: 'boolean',
                description: 'Show tooltip on hover',
              },
              showLegend: {
                type: 'boolean',
                description: 'Show legend for color series',
              },
              width: {
                type: 'number',
                description: 'Chart width in pixels',
              },
              height: {
                type: 'number',
                description: 'Chart height in pixels',
              },
            },
            required: ['data', 'dimension', 'metric'],
          },
        },
        {
          name: 'list_example_data',
          description: 'List available example data templates for bar charts',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
        // ============================================
        // Documentation Tools (Similar to React Spectrum MCP)
        // ============================================
        {
          name: 'list_rsc_pages',
          description:
            'List available documentation pages for React Spectrum Charts. Returns page names and optionally descriptions.',
          inputSchema: {
            type: 'object',
            properties: {
              includeDescription: {
                type: 'boolean',
                description: 'Include page descriptions in the output',
              },
              category: {
                type: 'string',
                description: 'Filter by category (e.g., "visualizations", "components", "guides", "api")',
              },
            },
          },
        },
        {
          name: 'get_rsc_page_info',
          description: 'Get information about a specific documentation page including its sections.',
          inputSchema: {
            type: 'object',
            properties: {
              page_name: {
                type: 'string',
                description: 'Name of the page (e.g., "Bar", "Chart", "Axis")',
              },
            },
            required: ['page_name'],
          },
        },
        {
          name: 'get_rsc_page',
          description: 'Get the full markdown content of a documentation page, or a specific section.',
          inputSchema: {
            type: 'object',
            properties: {
              page_name: {
                type: 'string',
                description: 'Name of the page (e.g., "Bar", "api/visualizations/Bar")',
              },
              section_name: {
                type: 'string',
                description: 'Optional section name to retrieve (e.g., "Props", "Examples")',
              },
            },
            required: ['page_name'],
          },
        },
        {
          name: 'search_rsc_docs',
          description: 'Search React Spectrum Charts documentation by keyword.',
          inputSchema: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: 'Search term to find in documentation',
              },
            },
            required: ['query'],
          },
        },
        {
          name: 'list_rsc_components',
          description: 'List all React Spectrum Charts components with their documentation.',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
        // ============================================
        // Exploration Tools
        // ============================================
        {
          name: 'list_packages',
          description: 'List all packages in the monorepo with their versions and descriptions',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
        {
          name: 'get_package_info',
          description: 'Get detailed information about a specific package',
          inputSchema: {
            type: 'object',
            properties: {
              packageName: {
                type: 'string',
                description: 'Name of the package (e.g., "@adobe/react-spectrum-charts")',
              },
            },
            required: ['packageName'],
          },
        },
        {
          name: 'search_files',
          description: 'Search for files matching a pattern in the codebase',
          inputSchema: {
            type: 'object',
            properties: {
              pattern: {
                type: 'string',
                description: 'File pattern to search for (e.g., "*.test.ts" or "Axis")',
              },
              directory: {
                type: 'string',
                description: 'Optional directory to search in (relative to workspace root)',
              },
            },
            required: ['pattern'],
          },
        },
        {
          name: 'get_repo_structure',
          description: 'Get an overview of the repository structure',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
      ],
    };
  });

  /**
   * Handle tool calls
   */
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      switch (name) {
        // ============================================
        // Code Generation Tool Handlers
        // ============================================
        case 'create_bar_chart': {
          const command = (args as ToolArguments)?.command;
          const customData = (args as ToolArguments)?.customData;
          const saveToFile = (args as ToolArguments)?.saveToFile;
          const fileName = (args as ToolArguments)?.fileName;

          if (!command) {
            throw new Error('command is required');
          }

          // Parse the command
          const { dataType, config } = parseChartCommand(command);

          // Use custom data or example data
          const data = customData || EXAMPLE_DATA_TEMPLATES[dataType];

          // Infer dimension and metric from data
          const dataKeys = Object.keys(data[0]);
          const stringKeys = dataKeys.filter((k) => typeof data[0][k] === 'string');
          const numberKeys = dataKeys.filter((k) => typeof data[0][k] === 'number');

          const fullConfig: BarChartConfig = {
            dimension: stringKeys[0] || dataKeys[0],
            metric: numberKeys[0] || dataKeys[1],
            showTooltip: true,
            ...config,
          };

          // If there's a color series field, detect it
          if (stringKeys.length > 1 && !config.color) {
            fullConfig.color = stringKeys[1];
            fullConfig.showLegend = true;
          }

          // Generate the code
          const code = generateBarChartCode(data, fullConfig);

          // Optionally save to file (requires local workspace)
          let savedPath = '';
          if (saveToFile) {
            if (!PACKAGES_DIR || !WORKSPACE_ROOT) {
              throw new Error(
                'Saving to file requires --workspace. Use: spectrum-charts-mcp --workspace=/path/to/react-spectrum-charts'
              );
            }
            const storiesDir = join(PACKAGES_DIR, 'react-spectrum-charts', 'src', 'stories', 'generated');
            if (!existsSync(storiesDir)) {
              mkdirSync(storiesDir, { recursive: true });
            }
            const baseName = fileName || `GeneratedBarChart_${Date.now()}`;
            savedPath = join(storiesDir, `${baseName}.tsx`);
            writeFileSync(savedPath, code);
          }

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  {
                    success: true,
                    message: 'Bar chart generated successfully!',
                    dataType,
                    config: fullConfig,
                    code,
                    ...(savedPath && WORKSPACE_ROOT && { savedTo: relative(WORKSPACE_ROOT, savedPath) }),
                  },
                  null,
                  2
                ),
              },
            ],
          };
        }

        case 'generate_bar_chart': {
          const data = (args as ToolArguments)?.data;
          const dimension = (args as ToolArguments)?.dimension;
          const metric = (args as ToolArguments)?.metric;

          if (!data || !dimension || !metric) {
            throw new Error('data, dimension, and metric are required');
          }

          const config: BarChartConfig = {
            dimension,
            metric,
            title: (args as ToolArguments)?.title,
            color: (args as ToolArguments)?.color,
            orientation: (args as ToolArguments)?.orientation,
            type: (args as ToolArguments)?.type,
            showTooltip: (args as ToolArguments)?.showTooltip ?? true,
            showLegend: (args as ToolArguments)?.showLegend ?? false,
            width: (args as ToolArguments)?.width,
            height: (args as ToolArguments)?.height,
          };

          const code = generateBarChartCode(data, config);

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  {
                    success: true,
                    message: 'Bar chart generated successfully!',
                    config,
                    code,
                  },
                  null,
                  2
                ),
              },
            ],
          };
        }

        case 'list_example_data': {
          const examples = Object.entries(EXAMPLE_DATA_TEMPLATES).map(([name, data]) => ({
            name,
            fields: Object.keys(data[0]),
            sampleSize: data.length,
            sample: data.slice(0, 2),
          }));

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  {
                    availableTemplates: examples,
                    usage:
                      'Use these template names in your create_bar_chart command, e.g., "create bar chart for sales data"',
                  },
                  null,
                  2
                ),
              },
            ],
          };
        }

        // ============================================
        // Documentation Tool Handlers (support remote mode)
        // ============================================
        case 'list_rsc_pages': {
          const includeDescription = (args as ToolArguments)?.includeDescription;
          const category = (args as ToolArguments)?.category;

          let pages: PageInfo[];
          try {
            pages = await buildPageIndex(WORKSPACE_ROOT);
          } catch (error) {
            throw new Error(`Failed to build page index: ${error instanceof Error ? error.message : String(error)}`);
          }

          // Filter by category if specified
          if (category) {
            pages = pages.filter((p) => p.category === category || p.key.includes(category));
          }

          const items = pages
            .sort((a, b) => a.key.localeCompare(b.key))
            .map((p) =>
              includeDescription
                ? { name: p.name, key: p.key, category: p.category, description: p.description ?? '' }
                : { name: p.name, key: p.key, category: p.category }
            );

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  {
                    mode: isUsingRemoteMode() ? 'remote (GitHub)' : 'local',
                    count: items.length,
                    pages: items,
                  },
                  null,
                  2
                ),
              },
            ],
          };
        }

        case 'get_rsc_page_info': {
          const pageName = (args as ToolArguments)?.page_name;
          if (!pageName) {
            throw new Error('page_name is required');
          }

          const info = await getPageInfo(WORKSPACE_ROOT, pageName);
          const out = {
            name: info.name,
            key: info.key,
            category: info.category,
            description: info.description ?? '',
            sections: info.sections.map((s) => s.name),
            mode: info.isRemote ? 'remote (GitHub)' : 'local',
          };

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(out, null, 2),
              },
            ],
          };
        }

        case 'get_rsc_page': {
          const pageName = (args as ToolArguments)?.page_name;
          const sectionName = (args as ToolArguments)?.section_name;

          if (!pageName) {
            throw new Error('page_name is required');
          }

          const content = await getPageContent(WORKSPACE_ROOT, pageName, sectionName);

          return {
            content: [
              {
                type: 'text',
                text: content,
              },
            ],
          };
        }

        case 'search_rsc_docs': {
          const query = (args as ToolArguments)?.query;
          if (!query) {
            throw new Error('query is required');
          }

          const results = await searchDocs(WORKSPACE_ROOT, query);
          const items = results.map((p) => ({
            name: p.name,
            key: p.key,
            category: p.category,
            description: p.description ?? '',
          }));

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  {
                    query,
                    resultsCount: items.length,
                    mode: isUsingRemoteMode() ? 'remote (GitHub)' : 'local',
                    results: items,
                  },
                  null,
                  2
                ),
              },
            ],
          };
        }

        case 'list_rsc_components': {
          const components = await getComponentPages(WORKSPACE_ROOT);
          const items = components.map((p) => ({
            name: p.name,
            key: p.key,
            category: p.category,
            description: p.description ?? '',
          }));

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  {
                    mode: isUsingRemoteMode() ? 'remote (GitHub)' : 'local',
                    count: items.length,
                    components: items,
                  },
                  null,
                  2
                ),
              },
            ],
          };
        }

        // ============================================
        // Exploration Tool Handlers
        // ============================================
        case 'list_packages': {
          const packages = getPackages();
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(packages, null, 2),
              },
            ],
          };
        }

        case 'get_package_info': {
          if (!WORKSPACE_ROOT) {
            throw new Error('Local workspace required. Use --workspace=/path/to/react-spectrum-charts');
          }

          const packageName = (args as ToolArguments)?.packageName;
          if (!packageName) {
            throw new Error('packageName is required');
          }

          const packages = getPackages();
          const pkg = packages.find((p) => p.name === packageName);

          if (!pkg) {
            throw new Error(`Package not found: ${packageName}`);
          }

          const packageJsonPath = join(WORKSPACE_ROOT, pkg.path, 'package.json');
          const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(packageJson, null, 2),
              },
            ],
          };
        }

        case 'search_files': {
          if (!WORKSPACE_ROOT) {
            throw new Error('Local workspace required. Use --workspace=/path/to/react-spectrum-charts');
          }

          const pattern = (args as ToolArguments)?.pattern;
          const directory = (args as ToolArguments)?.directory;

          if (!pattern) {
            throw new Error('pattern is required');
          }

          const searchDir = directory ? join(WORKSPACE_ROOT, directory) : WORKSPACE_ROOT;
          const regex = new RegExp(pattern.replace(/\*/g, '.*'));
          const files = findFiles(searchDir, regex);

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(files, null, 2),
              },
            ],
          };
        }

        case 'get_repo_structure': {
          if (!WORKSPACE_ROOT) {
            throw new Error('Local workspace required. Use --workspace=/path/to/react-spectrum-charts');
          }

          const rootPackageJson = JSON.parse(readFileSync(join(WORKSPACE_ROOT, 'package.json'), 'utf-8'));
          const packages = getPackages();

          const structure = {
            name: rootPackageJson.name,
            version: rootPackageJson.version,
            description: rootPackageJson.description,
            workspaces: rootPackageJson.workspaces,
            packages: packages.map((p) => ({
              name: p.name,
              version: p.version,
              path: p.path,
            })),
            scripts: Object.keys(rootPackageJson.scripts || {}),
          };

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(structure, null, 2),
              },
            ],
          };
        }

        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  });

  /**
   * List available prompts
   */
  server.setRequestHandler(ListPromptsRequestSchema, async () => {
    return {
      prompts: [
        {
          name: 'create_bar_chart',
          description: 'Generate a bar chart component from example or custom data',
          arguments: [
            {
              name: 'dataType',
              description: 'Type of example data: sales, browsers, quarterly, products, monthly',
              required: false,
            },
            {
              name: 'orientation',
              description: 'vertical or horizontal',
              required: false,
            },
          ],
        },
      ],
    };
  });

  /**
   * Get prompt content
   */
  server.setRequestHandler(GetPromptRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    if (name === 'create_bar_chart') {
      const dataType = (args as ToolArguments)?.dataType || 'sales';
      const orientation = (args as ToolArguments)?.orientation || 'vertical';

      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Create a ${orientation} bar chart using the ${dataType} example data. Include tooltips and make it visually appealing.`,
            },
          },
        ],
      };
    }

    throw new Error(`Unknown prompt: ${name}`);
  });

  /**
   * List available resources
   */
  server.setRequestHandler(ListResourcesRequestSchema, async () => {
    const packages = getPackages();

    return {
      resources: [
        {
          uri: 'repo://package.json',
          name: 'Root package.json',
          description: 'Root package.json file',
          mimeType: 'application/json',
        },
        ...packages.map((pkg) => ({
          uri: `repo://${pkg.path}/package.json`,
          name: `${pkg.name} package.json`,
          description: `Package configuration for ${pkg.name}`,
          mimeType: 'application/json',
        })),
        // Example data resources
        ...Object.keys(EXAMPLE_DATA_TEMPLATES).map((name) => ({
          uri: `data://${name}`,
          name: `${name} example data`,
          description: `Example ${name} data for bar charts`,
          mimeType: 'application/json',
        })),
      ],
    };
  });

  /**
   * Read resources
   */
  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const uri = request.params.uri;

    // Handle example data resources
    if (uri.startsWith('data://')) {
      const dataName = uri.replace('data://', '');
      const data = EXAMPLE_DATA_TEMPLATES[dataName];

      if (!data) {
        throw new Error(`Unknown data template: ${dataName}`);
      }

      return {
        contents: [
          {
            uri,
            mimeType: 'application/json',
            text: JSON.stringify(data, null, 2),
          },
        ],
      };
    }

    // Handle repo resources
    if (!uri.startsWith('repo://')) {
      throw new Error('Invalid resource URI');
    }

    const filePath = uri.replace('repo://', '');
    const content = readFileSafe(filePath);

    return {
      contents: [
        {
          uri,
          mimeType: 'application/json',
          text: content,
        },
      ],
    };
  });

  // Start the server
  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error(`React Spectrum Charts MCP Server v${VERSION}`);
  if (WORKSPACE_ROOT) {
    console.error(`Mode: Local (workspace: ${WORKSPACE_ROOT})`);
  } else {
    console.error('Mode: Remote (fetching docs from GitHub)');
  }
  console.error('Server running on stdio transport');
  console.error('Tools: create_bar_chart, list_rsc_pages, get_rsc_page, search_rsc_docs, list_packages');
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});