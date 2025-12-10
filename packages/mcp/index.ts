#!/usr/bin/env node
/* eslint-disable header/header */
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

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

const VERSION = '4.0.0';

// Resolve docs path relative to this file's location in the monorepo
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DOCS_ROOT = path.resolve(__dirname, '../../docs/docs');

// --- Utilities ---

function errorToString(err: unknown): string {
  if (err instanceof Error) {
    return err.message;
  }
  return String(err);
}

// --- Simple in-memory index ---

type DocEntry = {
  id: string;
  relPath: string;
  title: string;
  content: string;
};

const DOCS_INDEX: DocEntry[] = [];

async function buildIndex(): Promise<void> {
  async function walk(current: string) {
    let entries;
    try {
      entries = await fs.readdir(current, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) {
        await walk(full);
      } else if (/\.(md|mdx)$/.test(entry.name)) {
        const relPath = path.relative(DOCS_ROOT, full);
        const id = relPath.replace(/\\/g, '/').replace(/\.(md|mdx)$/, '');
        const content = await fs.readFile(full, 'utf8');
        const titleMatch = content.match(/^#\s+(.+)$/m);
        const title = titleMatch ? titleMatch[1].trim() : path.basename(relPath, path.extname(relPath));
        DOCS_INDEX.push({ id, relPath, title, content });
      }
    }
  }

  await walk(DOCS_ROOT);
}

function searchDocs(terms: string[], limit: number) {
  const lowerTerms = terms.map((t) => t.toLowerCase());
  const results: {
    id: string;
    title: string;
    relPath: string;
    snippet: string;
    idMatch: boolean;
  }[] = [];

  for (const doc of DOCS_INDEX) {
    const lower = doc.content.toLowerCase();
    const lowerId = doc.id.toLowerCase();
    let bestIdx = -1;

    // Check if any term matches the doc ID
    const idMatch = lowerTerms.some((term) => lowerId.includes(term));

    for (const term of lowerTerms) {
      const idx = lower.indexOf(term);
      if (idx !== -1 && (bestIdx === -1 || idx < bestIdx)) {
        bestIdx = idx;
      }
    }

    if (bestIdx === -1) continue;

    const start = Math.max(0, bestIdx - 120);
    const end = Math.min(doc.content.length, bestIdx + 120);
    const snippet = doc.content.slice(start, end).replace(/\s+/g, ' ').trim();

    results.push({
      id: doc.id,
      title: doc.title,
      relPath: doc.relPath,
      snippet,
      idMatch,
    });
  }

  // Sort: ID matches first, then by original order
  results.sort((a, b) => (a.idMatch === b.idMatch ? 0 : a.idMatch ? -1 : 1));

  // Apply limit and remove internal idMatch field from output
  return results.slice(0, limit).map(({ idMatch: _idMatch, ...rest }) => rest);
}

function getDocById(id: string): string {
  const doc = DOCS_INDEX.find((d) => d.id === id);
  if (!doc) {
    throw new Error(`Doc not found for id=${id}`);
  }
  return doc.content;
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
          '  search_rsc_docs  Search documentation by terms\n' +
          '  get_rsc_doc      Get full documentation page by ID\n'
      );
      process.exit(0);
    }

    if (arg === '--version' || arg === '-v') {
      console.log(VERSION);
      process.exit(0);
    }

    await buildIndex();
    console.error(`React Spectrum Charts MCP Server v${VERSION}`);
    console.error(`Indexed ${DOCS_INDEX.length} documentation pages from ${DOCS_ROOT}`);

    const server = new McpServer({
      name: 'react-spectrum-charts-docs',
      version: VERSION,
    });

    // Search tool
    server.registerTool(
      'search_rsc_docs',
      {
        title: 'Search RSC Docs',
        description: 'Searches React Spectrum Charts docs by terms; returns matching pages with snippets.',
        inputSchema: z.object({
          terms: z.union([z.string(), z.array(z.string())]).describe('Search term(s) to find in documentation'),
          limit: z.number().optional().describe('Maximum number of results to return (default: 5)'),
        }),
      },
      async ({ terms, limit }: { terms: string | string[]; limit?: number }) => {
        const rawTerms = Array.isArray(terms) ? terms : [terms];
        const normalized = Array.from(
          new Set(rawTerms.map((t) => String(t ?? '').trim().toLowerCase()).filter(Boolean))
        );
        if (normalized.length === 0) {
          throw new Error('Provide at least one non-empty search term.');
        }

        const results = searchDocs(normalized, limit ?? 5);

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

    // Get doc by ID tool
    server.registerTool(
      'get_rsc_doc',
      {
        title: 'Get RSC Doc',
        description: 'Returns full markdown/MDX for a React Spectrum Charts docs page by ID.',
        inputSchema: z.object({
          id: z.string().describe('Document ID from search_rsc_docs results (e.g., "guides/chart-basics")'),
        }),
      },
      async ({ id }: { id: string }) => {
        const content = getDocById(id);
        return {
          content: [
            {
              type: 'text' as const,
              text: content,
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
