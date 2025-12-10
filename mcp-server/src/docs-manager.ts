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
 * Documentation Manager for React Spectrum Charts MCP Server
 * Similar to React Spectrum's page-manager.ts pattern
 */

import { readFileSync, readdirSync, statSync, existsSync } from 'fs';
import { join, relative, basename, dirname } from 'path';

export interface SectionInfo {
  name: string;
  startLine: number;
  endLine: number;
}

export interface PageInfo {
  key: string;           // e.g., "api/visualizations/Bar"
  name: string;          // e.g., "Bar"
  description?: string;  // First paragraph
  filePath: string;      // Full path to markdown file
  category: string;      // e.g., "visualizations", "components", "guides"
  sections: SectionInfo[];
}

// Cache of parsed pages
const pageCache = new Map<string, PageInfo>();
let docsIndexBuilt = false;

/**
 * Extract name and description from markdown content
 */
function extractNameAndDescription(lines: string[]): { name?: string; description?: string } {
  let name: string | undefined;
  let description: string | undefined;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Skip empty lines at start
    if (!line) continue;

    // Find first heading
    if (line.startsWith('#') && !name) {
      name = line.replace(/^#+\s*/, '').trim();
      continue;
    }

    // First non-empty, non-heading line after name is description
    if (name && !line.startsWith('#') && !line.startsWith('```') && !line.startsWith('!')) {
      description = line;
      break;
    }
  }

  return { name, description };
}

/**
 * Parse sections from markdown
 */
function parseSections(lines: string[]): SectionInfo[] {
  const sections: SectionInfo[] = [];
  let currentSection: SectionInfo | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const match = line.match(/^(#{1,3})\s+(.+)$/);

    if (match) {
      // Close previous section
      if (currentSection) {
        currentSection.endLine = i;
        sections.push(currentSection);
      }

      currentSection = {
        name: match[2].trim(),
        startLine: i,
        endLine: lines.length,
      };
    }
  }

  // Close last section
  if (currentSection) {
    currentSection.endLine = lines.length;
    sections.push(currentSection);
  }

  return sections;
}

/**
 * Find all markdown files in a directory recursively
 */
function findMarkdownFiles(dir: string, baseDir: string): string[] {
  const files: string[] = [];

  if (!existsSync(dir)) return files;

  const entries = readdirSync(dir);
  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      files.push(...findMarkdownFiles(fullPath, baseDir));
    } else if (entry.endsWith('.md') || entry.endsWith('.mdx')) {
      files.push(fullPath);
    }
  }

  return files;
}

/**
 * Build page index from the docs directory
 */
export function buildPageIndex(workspacePath: string): PageInfo[] {
  if (docsIndexBuilt && pageCache.size > 0) {
    return Array.from(pageCache.values());
  }

  const docsPath = join(workspacePath, 'packages', 'docs', 'docs');
  const files = findMarkdownFiles(docsPath, docsPath);

  for (const filePath of files) {
    try {
      const content = readFileSync(filePath, 'utf-8');
      const lines = content.split(/\r?\n/);
      const { name, description } = extractNameAndDescription(lines);

      const relativePath = relative(docsPath, filePath);
      const key = relativePath.replace(/\.(md|mdx)$/, '').replace(/\\/g, '/');
      const category = dirname(relativePath).split('/')[0] || 'root';

      const pageInfo: PageInfo = {
        key,
        name: name || basename(filePath, '.md'),
        description,
        filePath,
        category,
        sections: [],
      };

      pageCache.set(key, pageInfo);
    } catch (error) {
      // Skip files that can't be read
      continue;
    }
  }

  docsIndexBuilt = true;
  return Array.from(pageCache.values());
}

/**
 * Get page info with sections (lazy parsed)
 */
export function getPageInfo(workspacePath: string, pageName: string): PageInfo {
  buildPageIndex(workspacePath);

  // Try exact match first
  let info = pageCache.get(pageName);

  // Try without path prefix
  if (!info) {
    for (const [key, page] of pageCache.entries()) {
      if (key.endsWith(`/${pageName}`) || page.name.toLowerCase() === pageName.toLowerCase()) {
        info = page;
        break;
      }
    }
  }

  if (!info) {
    const available = Array.from(pageCache.keys()).join(', ');
    throw new Error(`Page '${pageName}' not found. Available: ${available}`);
  }

  // Parse sections if not already done
  if (info.sections.length === 0) {
    const content = readFileSync(info.filePath, 'utf-8');
    const lines = content.split(/\r?\n/);
    info.sections = parseSections(lines);
    pageCache.set(info.key, info);
  }

  return info;
}

/**
 * Get page content, optionally a specific section
 */
export function getPageContent(workspacePath: string, pageName: string, sectionName?: string): string {
  const info = getPageInfo(workspacePath, pageName);
  const content = readFileSync(info.filePath, 'utf-8');

  if (!sectionName) {
    return content;
  }

  const lines = content.split(/\r?\n/);
  let section = info.sections.find(s => s.name === sectionName);

  // Case-insensitive fallback
  if (!section) {
    section = info.sections.find(s => s.name.toLowerCase() === sectionName.toLowerCase());
  }

  if (!section) {
    const available = info.sections.map(s => s.name).join(', ');
    throw new Error(`Section '${sectionName}' not found in ${pageName}. Available: ${available}`);
  }

  return lines.slice(section.startLine, section.endLine).join('\n');
}

/**
 * Search docs by term
 */
export function searchDocs(workspacePath: string, searchTerm: string): PageInfo[] {
  const pages = buildPageIndex(workspacePath);
  const term = searchTerm.toLowerCase();

  return pages.filter(page => {
    const nameMatch = page.name.toLowerCase().includes(term);
    const descMatch = page.description?.toLowerCase().includes(term);
    const keyMatch = page.key.toLowerCase().includes(term);
    return nameMatch || descMatch || keyMatch;
  });
}

/**
 * Get all component pages
 */
export function getComponentPages(workspacePath: string): PageInfo[] {
  const pages = buildPageIndex(workspacePath);
  return pages.filter(p =>
    p.category === 'api' ||
    p.key.includes('visualizations') ||
    p.key.includes('components') ||
    p.key.includes('interactivity') ||
    p.key.includes('analysis')
  );
}

/**
 * Clear page cache (useful for development)
 */
export function clearCache(): void {
  pageCache.clear();
  docsIndexBuilt = false;
}

