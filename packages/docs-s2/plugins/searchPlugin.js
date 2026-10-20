/*
 * Copyright 2026 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const GithubSlugger = require('github-slugger');

const STAGES = require('../src/stages.json');

const DOCS_DIR = path.join(__dirname, '..', 'docs');

/**
 * Strips inline markdown so heading text matches the rendered heading.
 * @param text
 * @returns plain text
 */
const toPlainText = (text) =>
  text
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[`*_]/g, '')
    .trim();

/**
 * Reads a doc's title, description, stage, and H2/H3 headings with their anchor ids.
 * @param file
 * @returns search entry for the page
 */
const readDoc = (file) => {
  const { data, content } = matter(fs.readFileSync(path.join(DOCS_DIR, file), 'utf8'));
  const slugger = new GithubSlugger();
  const headings = [];
  let title = data.title;
  let inFence = false;
  for (const line of content.split('\n')) {
    if (line.trimStart().startsWith('```')) inFence = !inFence;
    if (inFence) continue;
    const match = /^(#{1,4})\s+(.*?)\s*$/.exec(line);
    if (!match) continue;
    const [, hashes, raw] = match;
    const explicitId = /\s*\{#([^}]+)\}$/.exec(raw);
    const text = toPlainText(explicitId ? raw.slice(0, explicitId.index) : raw);
    if (hashes.length === 1) {
      title ??= text;
      continue;
    }
    const id = explicitId ? explicitId[1] : slugger.slug(text);
    if (hashes.length <= 3) headings.push({ text, id, level: hashes.length });
  }
  if (data.stage !== undefined && !(data.stage in STAGES)) {
    throw new Error(`${file}: unknown stage "${data.stage}". Use one of: ${Object.keys(STAGES).join(', ')}.`);
  }
  return {
    id: data.id ?? file.replace(/\.mdx?$/, ''),
    title: title ?? file,
    description: data.description ?? '',
    stage: data.stage,
    headings,
  };
};

/**
 * Indexes doc titles and headings for the chart search dialog.
 * @returns docusaurus plugin
 */
module.exports = function searchPlugin() {
  return {
    name: 'docs-s2-search',
    getPathsToWatch: () => [path.join(DOCS_DIR, '**/*.{md,mdx}')],
    loadContent: () =>
      fs
        .readdirSync(DOCS_DIR)
        .filter((file) => /\.mdx?$/.test(file))
        .map(readDoc),
    contentLoaded: ({ content, actions }) => {
      actions.setGlobalData({ pages: content });
    },
  };
};
