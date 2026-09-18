#!/usr/bin/env node
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
/// <reference types="node" />
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';

import { DESIGN_TOKEN_CATEGORIES, getDesignTokenCategory } from './src/designTokens.js';
import { CHART_FEATURE_CATALOG, getChartFeatureById } from './src/featureCatalog.js';
import { DocEntry, errorToString, getDocById } from './src/utils.js';

const VERSION = '0.1.0';

// --- Load bundled docs data ---

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function loadDocsData(): DocEntry[] {
  const dataPath = path.resolve(__dirname, 'docs-data.json');
  if (!fs.existsSync(dataPath)) {
    throw new Error(`Bundled docs data not found at ${dataPath}. Run 'yarn build' first.`);
  }
  const raw = fs.readFileSync(dataPath, 'utf8');
  return JSON.parse(raw) as DocEntry[];
}

const DOCS_INDEX: DocEntry[] = loadDocsData();

// --- CLI / MCP server bootstrap ---

const arg = (process.argv[2] || '').trim();

if (arg === '--help' || arg === '-h' || arg === 'help') {
  console.log(
    `React Spectrum Charts MCP Server v${VERSION}\n\n` +
      'Usage: npx @spectrum-charts/mcp@latest\n\n' +
      'Starts the MCP server for React Spectrum Charts documentation.\n\n' +
      'Tools:\n' +
      '  list_rsc_docs         List all documentation pages\n' +
      '  read_rsc_doc          Get full page content by ID\n' +
      '  list_design_tokens    List Spectrum 2 design token categories\n' +
      '  read_design_tokens    Get all tokens for a design token category\n' +
      '  list_chart_features   List engine-agnostic RSC chart features\n' +
      '  read_chart_feature    Get full detail for a chart feature by id\n'
  );
  process.exit(0);
}

if (arg === '--version' || arg === '-v') {
  console.log(VERSION);
  process.exit(0);
}

try {
  console.error(`React Spectrum Charts MCP Server v${VERSION}`);
  console.error(`Loaded ${DOCS_INDEX.length} documentation pages`);

  const server = new McpServer({
    name: 'react-spectrum-charts-docs',
    version: VERSION,
  });

  // List all docs tool
  server.registerTool(
    'list_rsc_docs',
    {
      title: 'List RSC Docs',
      description: 'Lists all React Spectrum Charts documentation pages with their IDs and titles.',
      inputSchema: z.object({}),
    },
    async () => {
      const results = DOCS_INDEX.map((doc) => ({
        id: doc.id,
        title: doc.title,
      }));

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(results, null, 2),
          },
        ],
      };
    }
  );

  // Read doc content tool
  server.registerTool(
    'read_rsc_doc',
    {
      title: 'Read RSC Doc',
      description: 'Returns the full markdown content for a React Spectrum Charts documentation page.',
      inputSchema: z.object({
        id: z.string().describe('Document ID from list_rsc_docs (e.g., "api/Chart", "guides/chart-basics")'),
      }),
    },
    async ({ id }: { id: string }) => {
      const doc = getDocById(DOCS_INDEX, id);
      return {
        content: [
          {
            type: 'text' as const,
            text: doc.content,
          },
        ],
      };
    }
  );

  // List design token categories tool
  server.registerTool(
    'list_design_tokens',
    {
      title: 'List Design Tokens',
      description:
        'Lists Spectrum 2 design token categories (colors, typography, spacing) available via read_design_tokens.',
      inputSchema: z.object({}),
    },
    async () => {
      const results = DESIGN_TOKEN_CATEGORIES.map((category) => ({
        id: category.id,
        title: category.title,
        description: category.description,
      }));

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(results, null, 2),
          },
        ],
      };
    }
  );

  // Read design token category tool
  server.registerTool(
    'read_design_tokens',
    {
      title: 'Read Design Tokens',
      description:
        'Returns the full set of Spectrum 2 design tokens (values, not just names) for a given category.',
      inputSchema: z.object({
        id: z.string().describe('Category ID from list_design_tokens (e.g., "colors", "typography", "spacing")'),
      }),
    },
    async ({ id }: { id: string }) => {
      const category = getDesignTokenCategory(id);
      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(category.tokens, null, 2),
          },
        ],
      };
    }
  );

  // List chart features tool
  server.registerTool(
    'list_chart_features',
    {
      title: 'List Chart Features',
      description:
        'Lists every engine-agnostic chart feature RSC implements (marks, decorations, and chart-level ' +
        'features), with id, name, category, and which other features it applies to.',
      inputSchema: z.object({}),
    },
    async () => {
      const results = CHART_FEATURE_CATALOG.map((feature) => ({
        id: feature.id,
        name: feature.name,
        category: feature.category,
        appliesTo: feature.appliesTo,
      }));

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(results, null, 2),
          },
        ],
      };
    }
  );

  // Read chart feature detail tool
  server.registerTool(
    'read_chart_feature',
    {
      title: 'Read Chart Feature',
      description:
        'Returns full detail for a chart feature: description, related design tokens, RSC (S1/S2) support ' +
        'status, and a pointer to its canonical options type/builder file.',
      inputSchema: z.object({
        id: z.string().describe('Feature ID from list_chart_features (e.g., "line", "trendline", "legend")'),
      }),
    },
    async ({ id }: { id: string }) => {
      const feature = getChartFeatureById(id);
      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(feature, null, 2),
          },
        ],
      };
    }
  );

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Server running on stdio transport');
} catch (err) {
  console.error(errorToString(err));
  process.exit(1);
}
