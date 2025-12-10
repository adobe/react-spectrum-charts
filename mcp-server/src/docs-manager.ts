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
 * Supports both local file system and GitHub remote fetch
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'fs';
import { basename, dirname, join, relative } from 'path';


// GitHub raw content URL for react-spectrum-charts docs
const GITHUB_RAW_BASE = 'https://raw.githubusercontent.com/adobe/react-spectrum-charts/main/packages/docs/docs';
const GITHUB_API_BASE = 'https://api.github.com/repos/adobe/react-spectrum-charts/contents/packages/docs/docs';

export interface SectionInfo {
  name: string;
  startLine: number;
  endLine: number;
}

export interface PageInfo {
  key: string; // e.g., "api/visualizations/Bar"
  name: string; // e.g., "Bar"
  description?: string; // First paragraph
  filePath: string; // Full path to markdown file (local) or GitHub URL
  category: string; // e.g., "visualizations", "components", "guides"
  sections: SectionInfo[];
  isRemote: boolean; // Whether this is fetched from GitHub
}

// Cache of parsed pages
const pageCache = new Map<string, PageInfo>();
const contentCache = new Map<string, string>();
let docsIndexBuilt = false;
let isRemoteMode = false;

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
 * Find all markdown files in a directory recursively (local mode)
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
 * Fetch directory listing from GitHub API
 */
async function fetchGitHubDirectory(path: string = ''): Promise<Array<{ name: string; path: string; type: string }>> {
  const url = path ? `${GITHUB_API_BASE}/${path}` : GITHUB_API_BASE;
  
  const response = await fetch(url, {
    headers: {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'react-spectrum-charts-mcp'
    }
  });

  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

/**
 * Recursively get all markdown files from GitHub
 */
async function fetchGitHubMarkdownFiles(path: string = ''): Promise<string[]> {
  const files: string[] = [];
  
  try {
    const entries = await fetchGitHubDirectory(path);
    
    for (const entry of entries) {
      if (entry.type === 'dir') {
        const subFiles = await fetchGitHubMarkdownFiles(entry.path.replace('packages/docs/docs/', ''));
        files.push(...subFiles);
      } else if (entry.name.endsWith('.md') || entry.name.endsWith('.mdx')) {
        files.push(entry.path.replace('packages/docs/docs/', ''));
      }
    }
  } catch (error) {
    console.error(`Error fetching GitHub directory ${path}:`, error instanceof Error ? error.message : error);
  }

  return files;
}

/**
 * Fetch markdown content from GitHub
 */
async function fetchGitHubContent(filePath: string): Promise<string> {
  // Check cache first
  const cached = contentCache.get(filePath);
  if (cached) {
    return cached;
  }

  const url = `${GITHUB_RAW_BASE}/${filePath}`;

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'react-spectrum-charts-mcp',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${filePath}: ${response.status} ${response.statusText}`);
  }

  const content = await response.text();
  contentCache.set(filePath, content);
  return content;
}

/**
 * Build page index from local docs directory
 */
function buildLocalPageIndex(workspacePath: string): PageInfo[] {
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
        isRemote: false,
      };

      pageCache.set(key, pageInfo);
    } catch (error) {
      continue;
    }
  }

  return Array.from(pageCache.values());
}

/**
 * Build page index from GitHub (remote mode)
 */
async function buildRemotePageIndex(): Promise<PageInfo[]> {
  console.error('Fetching documentation index from GitHub...');

  const files = await fetchGitHubMarkdownFiles();

  for (const filePath of files) {
    try {
      const content = await fetchGitHubContent(filePath);
      const lines = content.split(/\r?\n/);
      const { name, description } = extractNameAndDescription(lines);

      const key = filePath.replace(/\.(md|mdx)$/, '').replace(/\\/g, '/');
      const category = dirname(filePath).split('/')[0] || 'root';

      const pageInfo: PageInfo = {
        key,
        name: name || basename(filePath, '.md'),
        description,
        filePath: `${GITHUB_RAW_BASE}/${filePath}`,
        category,
        sections: [],
        isRemote: true,
      };

      pageCache.set(key, pageInfo);
    } catch (error) {
      console.error(`Error processing ${filePath}:`, error instanceof Error ? error.message : error);
      continue;
    }
  }

  console.error(`Indexed ${pageCache.size} documentation pages from GitHub`);
  return Array.from(pageCache.values());
}

/**
 * Build page index - auto-detects local vs remote mode
 */
export async function buildPageIndex(workspacePath?: string): Promise<PageInfo[]> {
  if (docsIndexBuilt && pageCache.size > 0) {
    return Array.from(pageCache.values());
  }

  // Try local first if workspace is provided
  if (workspacePath) {
    const docsPath = join(workspacePath, 'packages', 'docs', 'docs');
    if (existsSync(docsPath)) {
      isRemoteMode = false;
      const pages = buildLocalPageIndex(workspacePath);
      docsIndexBuilt = true;
      return pages;
    }
  }

  // Fall back to remote (GitHub)
  isRemoteMode = true;
  const pages = await buildRemotePageIndex();
  docsIndexBuilt = true;
  return pages;
}

/**
 * Get page info with sections (lazy parsed)
 */
export async function getPageInfo(workspacePath: string | undefined, pageName: string): Promise<PageInfo> {
  await buildPageIndex(workspacePath);

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
    let content: string;
    if (info.isRemote) {
      const relativePath = info.filePath.replace(`${GITHUB_RAW_BASE}/`, '');
      content = await fetchGitHubContent(relativePath);
    } else {
      content = readFileSync(info.filePath, 'utf-8');
    }
    const lines = content.split(/\r?\n/);
    info.sections = parseSections(lines);
    pageCache.set(info.key, info);
  }

  return info;
}

/**
 * Get page content, optionally a specific section
 */
export async function getPageContent(
  workspacePath: string | undefined,
  pageName: string,
  sectionName?: string
): Promise<string> {
  const info = await getPageInfo(workspacePath, pageName);

  let content: string;
  if (info.isRemote) {
    const relativePath = info.filePath.replace(`${GITHUB_RAW_BASE}/`, '');
    content = await fetchGitHubContent(relativePath);
  } else {
    content = readFileSync(info.filePath, 'utf-8');
  }

  if (!sectionName) {
    return content;
  }

  const lines = content.split(/\r?\n/);
  let section = info.sections.find((s) => s.name === sectionName);

  // Case-insensitive fallback
  if (!section) {
    section = info.sections.find((s) => s.name.toLowerCase() === sectionName.toLowerCase());
  }

  if (!section) {
    const available = info.sections.map((s) => s.name).join(', ');
    throw new Error(`Section '${sectionName}' not found in ${pageName}. Available: ${available}`);
  }

  return lines.slice(section.startLine, section.endLine).join('\n');
}

/**
 * Search docs by term
 */
export async function searchDocs(workspacePath: string | undefined, searchTerm: string): Promise<PageInfo[]> {
  const pages = await buildPageIndex(workspacePath);
  const term = searchTerm.toLowerCase();

  return pages.filter((page) => {
    const nameMatch = page.name.toLowerCase().includes(term);
    const descMatch = page.description?.toLowerCase().includes(term);
    const keyMatch = page.key.toLowerCase().includes(term);
    return nameMatch || descMatch || keyMatch;
  });
}

/**
 * Get all component pages
 */
export async function getComponentPages(workspacePath: string | undefined): Promise<PageInfo[]> {
  const pages = await buildPageIndex(workspacePath);
  return pages.filter(
    (p) =>
      p.category === 'api' ||
      p.key.includes('visualizations') ||
      p.key.includes('components') ||
      p.key.includes('interactivity') ||
      p.key.includes('analysis')
  );
}

/**
 * Check if running in remote mode
 */
export function isUsingRemoteMode(): boolean {
  return isRemoteMode;
}

/**
 * Clear page cache (useful for development)
 */
export function clearCache(): void {
  pageCache.clear();
  contentCache.clear();
  docsIndexBuilt = false;
  isRemoteMode = false;
}