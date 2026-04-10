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
/**
 * Fetches a Figma node as PNG and SVG and runs the structure extractor on the SVG.
 *
 * Usage:
 *   node scripts/ai/fetch-figma.mjs <figma-url> [--out-dir <dir>]
 *
 * Arguments:
 *   figma-url   Full Figma URL, e.g.:
 *               https://www.figma.com/design/ABC123/My-File?node-id=1234-5678
 *               The file key and node ID are parsed from the URL automatically.
 *   --out-dir   Where to write output files. Defaults to scripts/ai/tmp/imgCompare
 *
 * Requires FIGMA_TOKEN env var (your Figma personal access token):
 *   export FIGMA_TOKEN=your_token_here
 *
 * Outputs:
 *   <out-dir>/figma.png  — rasterized PNG at 1× scale (native — avoids resampling artifacts in diffs)
 *   <out-dir>/figma.svg  — vector export
 */
import { execFileSync } from 'child_process';
import { mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// --- Parse args ---

const args = process.argv.slice(2);
const urlArg = args.find(a => !a.startsWith('--'));
const outDirIdx = args.indexOf('--out-dir');
const outDir = outDirIdx !== -1 && args[outDirIdx + 1]
  ? resolve(process.cwd(), args[outDirIdx + 1])
  : resolve(process.cwd(), 'tmp/ai');

if (!urlArg) {
  console.error('Usage: node fetch-figma.mjs <figma-url> [--out-dir <dir>]');
  console.error('');
  console.error('Example:');
  console.error('  node fetch-figma.mjs "https://www.figma.com/design/ABC123/My-File?node-id=1234-5678"');
  process.exit(1);
}

// --- Parse file key and node ID from URL ---

function parseFigmaUrl(url) {
  // File key: segment after /design/ or /file/
  const fileKeyMatch = url.match(/\/(?:design|file)\/([^/?#]+)/);
  if (!fileKeyMatch) return null;
  const fileKey = fileKeyMatch[1];

  // Node ID: node-id query param, either 1234-5678 or 1234%3A5678 format
  const nodeIdMatch = url.match(/[?&]node-id=([^&]+)/);
  if (!nodeIdMatch) return null;
  // Normalize URL-encoded colon and dash-separated formats to colon-separated (Figma API format)
  const nodeId = decodeURIComponent(nodeIdMatch[1]).replace('-', ':');

  return { fileKey, nodeId };
}

const parsed = parseFigmaUrl(urlArg);
if (!parsed) {
  console.error(`Could not parse file key and node ID from URL: ${urlArg}`);
  console.error('Expected format: https://www.figma.com/design/<fileKey>/...?node-id=<nodeId>');
  process.exit(1);
}

const { fileKey, nodeId } = parsed;

// --- Check token ---

const token = process.env.FIGMA_TOKEN;
if (!token) {
  console.error('FIGMA_TOKEN env var not set. Export your Figma personal access token:');
  console.error('  export FIGMA_TOKEN=your_token_here');
  process.exit(1);
}

// --- Fetch ---

async function fetchImageUrl(format) {
  const url = `https://api.figma.com/v1/images/${fileKey}?ids=${nodeId}&format=${format}&scale=1`;
  const res = await fetch(url, { headers: { 'X-Figma-Token': token } });
  const json = await res.json();
  if (json.err) throw new Error(`Figma API error: ${json.err}`);
  return json.images[nodeId] ?? Object.values(json.images)[0];
}

console.error(`Fetching node ${nodeId} from file ${fileKey}...`);

mkdirSync(outDir, { recursive: true });

const [pngUrl, svgUrl] = await Promise.all([
  fetchImageUrl('png'),
  fetchImageUrl('svg'),
]);

const pngPath = resolve(outDir, 'figma.png');
const svgPath = resolve(outDir, 'figma.svg');

execFileSync('curl', ['-s', '--max-time', '30', pngUrl, '-o', pngPath]);
execFileSync('curl', ['-s', '--max-time', '30', svgUrl, '-o', svgPath]);

console.error(`Saved: ${pngPath}`);
console.error(`Saved: ${svgPath}`);
