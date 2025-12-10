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

const DOCS_INDEX: DocEntry[] = [];

function extractDescription(content: string): string {
  // Remove frontmatter if present
  let body = content.replace(/^---[\s\S]*?---\n*/, '');
  // Remove the title line
  body = body.replace(/^#\s+.+\n*/, '');
  // Remove import statements
  body = body.replace(/^import\s+.+\n*/gm, '');
  // Get first non-empty paragraph (stop at heading or empty line)
  const match = body.match(/^([^\n#].+?)(?:\n\n|\n#|$)/s);
  if (match) {
    return match[1].replace(/\s+/g, ' ').trim();
  }
  return '';
}

function extractSections(content: string): Section[] {
  const sections: Section[] = [];
  const headingRegex = /^(#{2,6})\s+(.+)$/gm;
  let match;

  const headings: { level: number; title: string; start: number }[] = [];
  while ((match = headingRegex.exec(content)) !== null) {
    headings.push({
      level: match[1].length,
      title: match[2].trim(),
      start: match.index,
    });
  }

  for (let i = 0; i < headings.length; i++) {
    const heading = headings[i];
    const nextStart = headings[i + 1]?.start ?? content.length;
    const sectionContent = content.slice(heading.start, nextStart).trim();

    sections.push({
      title: heading.title,
      level: heading.level,
      content: sectionContent,
    });
  }

  return sections;
}

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
        const description = extractDescription(content);
        const sections = extractSections(content);
        DOCS_INDEX.push({ id, relPath, title, description, sections, content });
      }
    }
  }

  await walk(DOCS_ROOT);
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
          '  get_rsc_docs      List all available documentation pages\n' +
          '  get_rsc_doc_info  Get page description and section titles\n' +
          '  get_rsc_doc       Get full page or a specific section\n'
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

    // List all docs tool
    server.registerTool(
      'get_rsc_docs',
      {
        title: 'Get RSC Docs',
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

    // Get doc info tool
    server.registerTool(
      'get_rsc_doc_info',
      {
        title: 'Get RSC Doc Info',
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

    // Get doc content tool
    server.registerTool(
      'get_rsc_doc',
      {
        title: 'Get RSC Doc',
        description: 'Returns full markdown/MDX for a page, or only the specified section.',
        inputSchema: z.object({
          id: z.string().describe('Document ID (e.g., "guides/chart-basics")'),
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
