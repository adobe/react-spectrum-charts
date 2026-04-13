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
 * Builds a sorted Vega spec from a ChartOptions JSON file.
 *
 * Usage:
 *   node scripts/ai/build-spec.mjs <chartOptions.json>
 *
 * Output:
 *   Sorted Vega spec JSON is written to stdout.
 *   A one-line summary (signal/mark/data/scale/axis counts) is written to stderr.
 *
 * The file must contain:
 *   { data, chartWidth?, chartHeight?, axes?, legends?, marks?, ... }
 *
 * Requires the S2 spec builder to be built first:
 *   yarn build:s2
 */
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '../..');

const [arg] = process.argv.slice(2);

if (!arg) {
  console.error('Usage: node build-spec.mjs <chartOptions.json>');
  process.exit(1);
}

const { default: s2Module } = await import(resolve(root, 'packages/vega-spec-builder-s2/dist/index.js'));
const { buildSpec } = s2Module;

const options = JSON.parse(readFileSync(resolve(process.cwd(), arg), 'utf-8'));
const { data, chartWidth = 800, chartHeight = 400, ...specOptions } = options;
const spec = buildSpec({ data, chartWidth, chartHeight, ...specOptions });

console.error(summarize(spec));
console.log(JSON.stringify(spec, sortedKeysReplacer, 2));

// ── helpers ───────────────────────────────────────────────────────────────────

/** Sort object keys for stable diffs. Array order is preserved (Vega ordering matters). */
function sortedKeysReplacer(key, value) {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)));
  }
  return value;
}

function summarize(spec) {
  const signals = spec.signals?.length ?? 0;
  const marks   = countMarks(spec);
  const data    = spec.data?.length ?? 0;
  const scales  = spec.scales?.length ?? 0;
  const axes    = spec.axes?.length ?? 0;
  return `signals:${signals} marks:${marks} data:${data} scales:${scales} axes:${axes}`;
}

function countMarks(spec, depth = 0) {
  if (depth > 5) return 0;
  let n = 0;
  for (const mark of spec.marks ?? []) {
    n++;
    if (mark.marks) n += countMarks(mark, depth + 1);
  }
  return n;
}
