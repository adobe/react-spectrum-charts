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

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

const VERSION = '0.1.0';

// --- Types ---

type Section = {
  title: string;
  level: number;
  content: string;
};

type DocEntry = {
  id: string;
  relPath: string;
  title: string;
  description: string;
  sections: Section[];
  content: string;
};

// --- Load bundled docs data ---

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function loadDocsData(): DocEntry[] {
  // In dist/, docs-data.json is copied alongside index.js
  const dataPath = path.resolve(__dirname, 'docs-data.json');
  if (!fs.existsSync(dataPath)) {
    throw new Error(`Bundled docs data not found at ${dataPath}. Run 'yarn build' first.`);
  }
  const raw = fs.readFileSync(dataPath, 'utf8');
  return JSON.parse(raw) as DocEntry[];
}

const DOCS_INDEX: DocEntry[] = loadDocsData();

// --- Utilities ---

function errorToString(err: unknown): string {
  if (err instanceof Error) {
    return err.message;
  }
  return String(err);
}

function getDocById(id: string): DocEntry {
  const doc = DOCS_INDEX.find((d) => d.id === id);
  if (!doc) {
    throw new Error(`Doc not found for id=${id}`);
  }
  return doc;
}

// --- CLI / MCP server bootstrap ---

(async () => {
  try {
    const arg = (process.argv[2] || '').trim();
    if (arg === '--help' || arg === '-h' || arg === 'help') {
      console.log(
        `React Spectrum Charts MCP Server v${VERSION}\n\n` +
          'Usage: npx @adobe/react-spectrum-charts-mcp@latest\n\n' +
          'Starts the MCP server for React Spectrum Charts documentation.\n\n' +
          'Tools:\n' +
          '  list_rsc_docs     List all available documentation pages\n' +
          '  describe_rsc_doc  Get page description and section titles\n' +
          '  read_rsc_doc      Get full page or a specific section\n'
      );
      process.exit(0);
    }

    if (arg === '--version' || arg === '-v') {
      console.log(VERSION);
      process.exit(0);
    }

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
        description: 'Lists all available React Spectrum Charts documentation pages with their IDs.',
        inputSchema: z.object({
          includeDescription: z.boolean().optional().describe('Include page descriptions (default: false)'),
        }),
      },
      async ({ includeDescription }: { includeDescription?: boolean }) => {
        const results = DOCS_INDEX.map((doc) => {
          const entry: { id: string; title: string; description?: string } = {
            id: doc.id,
            title: doc.title,
          };
          if (includeDescription) {
            entry.description = doc.description;
          }
          return entry;
        });

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

    // Describe doc tool
    server.registerTool(
      'describe_rsc_doc',
      {
        title: 'Describe RSC Doc',
        description: "Returns a page's description and list of section titles.",
        inputSchema: z.object({
          id: z.string().describe('Document ID (e.g., "guides/chart-basics")'),
        }),
      },
      async ({ id }: { id: string }) => {
        const doc = getDocById(id);
        const result = {
          id: doc.id,
          title: doc.title,
          description: doc.description,
          sections: doc.sections.map((s) => ({ title: s.title, level: s.level })),
        };

        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify(result, null, 2),
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
        description: 'Returns full markdown/MDX for a React Spectrum Charts docs page by ID.',
        inputSchema: z.object({
          id: z.string().describe('Document ID from list_rsc_docs (e.g., "guides/chart-basics")'),
          section: z.string().optional().describe('Section title to retrieve (returns full page if omitted)'),
        }),
      },
      async ({ id, section }: { id: string; section?: string }) => {
        const doc = getDocById(id);

        if (section) {
          const found = doc.sections.find((s) => s.title.toLowerCase() === section.toLowerCase());
          if (!found) {
            const available = doc.sections.map((s) => s.title).join(', ');
            throw new Error(`Section "${section}" not found. Available sections: ${available}`);
          }
          return {
            content: [
              {
                type: 'text' as const,
                text: found.content,
              },
            ],
          };
        }

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

    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error('Server running on stdio transport');
  } catch (err) {
    console.error(errorToString(err));
    process.exit(1);
  }
})();
