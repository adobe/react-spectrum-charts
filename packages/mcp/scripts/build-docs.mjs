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

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DOCS_ROOT = path.resolve(__dirname, '../../docs/docs');
const OUT_FILE = path.resolve(__dirname, '../dist/docs-data.json');

function extractDescription(content) {
  const body = content.replace(/^#\s+.+\n*/, '');
  const match = body.match(/^([^\n#].+?)(?:\n\n|\n#|$)/s);
  if (match) {
    return match[1].replace(/\s+/g, ' ').trim();
  }
  return '';
}

function extractSections(content) {
  const sections = [];
  const headingRegex = /^(#{2,6})\s+(.+)$/gm;
  let match;

  const headings = [];
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

function walkDir(dir) {
  const results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkDir(full));
    } else if (/\.(md|mdx)$/.test(entry.name)) {
      results.push(full);
    }
  }

  return results;
}

function buildDocsData() {
  if (!fs.existsSync(DOCS_ROOT)) {
    throw new Error(`Docs directory not found: ${DOCS_ROOT}`);
  }

  const files = walkDir(DOCS_ROOT);
  const docs = [];

  for (const file of files) {
    const relPath = path.relative(DOCS_ROOT, file);
    const id = relPath.replace(/\\/g, '/').replace(/\.(md|mdx)$/, '');
    const content = fs.readFileSync(file, 'utf8');
    const titleMatch = content.match(/^#\s+(.+)$/m);
    const title = titleMatch ? titleMatch[1].trim() : path.basename(relPath, path.extname(relPath));
    const description = extractDescription(content);
    const sections = extractSections(content);

    docs.push({ id, relPath, title, description, sections, content });
  }

  docs.sort((a, b) => a.id.localeCompare(b.id));
  return docs;
}

function main() {
  console.log(`Reading docs from: ${DOCS_ROOT}`);
  const docs = buildDocsData();

  fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
  fs.writeFileSync(OUT_FILE, JSON.stringify(docs, null, 2) + '\n', 'utf8');

  console.log(`Wrote ${docs.length} docs to: ${path.relative(process.cwd(), OUT_FILE)}`);
}

main();

