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
 * Compares two ChartOptions JSON files by building a Vega spec from each and diffing the results.
 *
 * Usage:
 *   node scripts/ai/compare-chart-options.mjs <before.json> <after.json>
 *
 * Arguments:
 *   before.json   ChartOptions file representing the baseline (e.g. without the new prop).
 *   after.json    ChartOptions file representing the change (e.g. with the new prop set).
 *
 * What it does:
 *   1. Runs build-spec.mjs on each file, capturing the sorted Vega spec JSON from stdout.
 *   2. Writes the two specs to tmp/ai/specDiff/before.json and after.json.
 *   3. Runs spec-diff.mjs on those two files to produce the unified diff.
 *
 * Requires the S2 spec builder to be built first:
 *   yarn build:s2
 */
import { writeFileSync, mkdirSync } from 'fs';
import { execFileSync } from 'child_process';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '../..');

const [beforeArg, afterArg] = process.argv.slice(2);

if (!beforeArg || !afterArg) {
  console.error('Usage: node compare-chart-options.mjs <before.json> <after.json>');
  process.exit(1);
}

const buildSpec = resolve(__dirname, 'build-spec.mjs');
const specDiff  = resolve(__dirname, 'spec-diff.mjs');
const outDir    = resolve(root, 'tmp/ai/specDiff');

mkdirSync(outDir, { recursive: true });

const beforeSpecPath = resolve(outDir, 'before.json');
const afterSpecPath  = resolve(outDir, 'after.json');

// Build each spec, capturing sorted JSON from stdout
const beforeJson = execFileSync(process.execPath, [buildSpec, beforeArg], { encoding: 'utf-8' });
const afterJson  = execFileSync(process.execPath, [buildSpec, afterArg],  { encoding: 'utf-8' });

writeFileSync(beforeSpecPath, beforeJson, 'utf-8');
writeFileSync(afterSpecPath,  afterJson,  'utf-8');

// Diff the two built specs
execFileSync(process.execPath, [specDiff, beforeSpecPath, afterSpecPath], { stdio: 'inherit' });
