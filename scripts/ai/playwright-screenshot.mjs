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
 * Starts a temporary Storybook instance, screenshots the chart area of a story, then shuts it down.
 *
 * Usage:
 *   node scripts/ai/playwright-screenshot.mjs <story-id> [output-path] [width] [height]
 *
 * Arguments:
 *   story-id     Storybook story ID. Derived from title + export name, e.g.:
 *                  title:  'React Spectrum Charts 2/Line/Examples' → react-spectrum-charts-2-line-examples
 *                  export: UserRetentionByCohort                   → user-retention-by-cohort
 *                  id:     react-spectrum-charts-2-line-examples--user-retention-by-cohort
 *   output-path  Where to write the PNG. Defaults to scripts/ai/tmp/imgCompare/result.png
 *   width        Viewport width in px. Defaults to 800.
 *   height       Viewport height in px. Defaults to 700.
 *
 * Storybook is started on port 6008 using the S2 config (.storybook-s2) and shut down automatically.
 *
 * Outputs:
 *   <output-path>               — PNG screenshot clipped to the Vega chart SVG
 *   <output-dir>/plot-bounds.json — { x, y, width, height } of the inner plot area
 *                                   relative to the chart SVG, used for cropping comparisons
 */
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

const PORT = 6008;
const STORYBOOK_CONFIG_DIR = '.storybook-s2';
const STORYBOOK_READY_POLL_MS = 500;
const STORYBOOK_READY_TIMEOUT_MS = 120_000;

const VEGA_SELECTOR = 'svg.marks';
const PLOT_BG_SELECTOR = 'path.background, rect.background';
const RENDER_SETTLE_MS = 300;
const NAVIGATION_TIMEOUT_MS = 15000;
const RENDER_TIMEOUT_MS = 10000;

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '../..');

const [, , storyId, outputArg, widthArg, heightArg] = process.argv;

if (!storyId) {
  console.error('Usage: node playwright-screenshot.mjs <story-id> [output-path] [width] [height]');
  console.error('');
  console.error('story-id example: react-spectrum-charts-2-line-examples--user-retention-by-cohort');
  process.exit(1);
}

const chartWidth = widthArg ? parseInt(widthArg, 10) : 800;
const chartHeight = heightArg ? parseInt(heightArg, 10) : 700;
// Add breathing room so the chart is never clipped by the viewport edge
const viewportWidth = chartWidth + 200;
const viewportHeight = chartHeight + 200;

const defaultOutputPath = resolve(process.cwd(), 'tmp/ai/result.png');
const outputPath = outputArg ? resolve(process.cwd(), outputArg) : defaultOutputPath;
const outputDir = dirname(outputPath);
const plotBoundsPath = resolve(outputDir, 'plot-bounds.json');

mkdirSync(outputDir, { recursive: true });

// --- Start Storybook ---

/**
 * Polls http://localhost:PORT until the server responds or the timeout elapses.
 */
async function waitForStorybook() {
  const start = Date.now();
  while (Date.now() - start < STORYBOOK_READY_TIMEOUT_MS) {
    try {
      await fetch(`http://localhost:${PORT}`);
      return; // server is up
    } catch {
      await new Promise((r) => setTimeout(r, STORYBOOK_READY_POLL_MS));
    }
  }
  throw new Error(`Storybook did not become ready on port ${PORT} within ${STORYBOOK_READY_TIMEOUT_MS / 1000}s`);
}

console.error(`Starting Storybook on port ${PORT}...`);

const storybookProcess = spawn(
  'yarn',
  ['storybook', 'dev', '-p', String(PORT), '--config-dir', STORYBOOK_CONFIG_DIR, '--ci'],
  {
    cwd: repoRoot,
    env: { ...process.env, NODE_OPTIONS: '--openssl-legacy-provider' },
    stdio: ['ignore', 'ignore', 'pipe'], // suppress stdout/stdin; pipe stderr so errors surface if needed
  }
);

storybookProcess.stderr.on('data', (chunk) => {
  // Only forward lines that look like errors, not the normal startup noise
  const line = chunk.toString();
  if (line.toLowerCase().includes('error')) {
    process.stderr.write(`[storybook] ${line}`);
  }
});

// Ensure storybook is killed when this process exits, even on error
function shutdown() {
  if (!storybookProcess.killed) {
    storybookProcess.kill('SIGTERM');
  }
}
process.on('exit', shutdown);
process.on('SIGINT', () => { shutdown(); process.exit(130); });
process.on('SIGTERM', () => { shutdown(); process.exit(143); });

try {
  await waitForStorybook();
} catch (e) {
  console.error(e.message);
  shutdown();
  process.exit(1);
}

console.error(`Storybook ready at http://localhost:${PORT}`);

// --- Launch browser ---

let browser;
try {
  browser = await chromium.launch();
} catch (e) {
  console.error('Failed to launch Chromium. Run: yarn playwright install chromium');
  console.error(e.message);
  shutdown();
  process.exit(1);
}

const page = await browser.newPage();
await page.setViewportSize({ width: viewportWidth, height: viewportHeight });

// --- Navigate to story ---

const url = `http://localhost:${PORT}/iframe.html?id=${storyId}&viewMode=story`;
console.error(`Loading: ${url}`);

try {
  await page.goto(url, { waitUntil: 'load', timeout: NAVIGATION_TIMEOUT_MS });
} catch (e) {
  console.error(`Failed to load story: ${e.message}`);
  await browser.close();
  shutdown();
  process.exit(1);
}

// --- Wait for chart to render ---

try {
  await page.waitForSelector(VEGA_SELECTOR, { timeout: RENDER_TIMEOUT_MS });
} catch (e) {
  console.error(`Vega chart (${VEGA_SELECTOR}) did not appear within ${RENDER_TIMEOUT_MS}ms.`);
  console.error('Check that the story ID is correct.');
  await browser.close();
  shutdown();
  process.exit(1);
}

// Let animations and transitions finish
await page.waitForTimeout(RENDER_SETTLE_MS);

// --- Screenshot the chart SVG ---

const chartEl = await page.$(VEGA_SELECTOR);
const svgBox = chartEl ? await chartEl.boundingBox() : null;

if (!svgBox) {
  console.error(`Warning: could not locate ${VEGA_SELECTOR} bounding box — screenshotting full viewport`);
}

await page.screenshot({ path: outputPath, clip: svgBox ?? undefined });
console.error(`Screenshot: ${outputPath}`);

// --- Extract inner plot bounds ---
// Vega renders a background element inside the mark group at the plot area origin.
// Its position relative to the SVG gives the offset of the actual plot (inside axes/title/legend).

const plotBounds = await page.evaluate(
  ({ svgSelector, bgSelector }) => {
    const svg = document.querySelector(svgSelector);
    if (!svg) return null;
    const bg = svg.querySelector(bgSelector);
    if (!bg) return null;
    const svgRect = svg.getBoundingClientRect();
    const bgRect = bg.getBoundingClientRect();
    return {
      x: Math.round(bgRect.left - svgRect.left),
      y: Math.round(bgRect.top - svgRect.top),
      width: Math.round(bgRect.width),
      height: Math.round(bgRect.height),
    };
  },
  { svgSelector: VEGA_SELECTOR, bgSelector: PLOT_BG_SELECTOR }
);

if (plotBounds) {
  writeFileSync(plotBoundsPath, JSON.stringify(plotBounds, null, 2));
  console.error(`Plot bounds: x=${plotBounds.x} y=${plotBounds.y} w=${plotBounds.width} h=${plotBounds.height}`);
  console.error(`Plot bounds: ${plotBoundsPath}`);
} else {
  console.error('Warning: could not find plot background element — plot-bounds.json not written');
}

// --- Cleanup ---

await browser.close();
shutdown();
