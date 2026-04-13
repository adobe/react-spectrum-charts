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
 * Diffs two Vega spec JSON files and prints a unified diff.
 *
 * Usage:
 *   node scripts/ai/spec-diff.mjs <before.json> <after.json>
 *
 * Arguments:
 *   before.json   Vega spec JSON file representing the baseline.
 *   after.json    Vega spec JSON file representing the change.
 *
 * Output:
 *   Unified diff is written to stdout.
 *   A one-line comparison summary is written to stderr.
 *
 * The inputs are expected to be pre-built Vega spec JSON files, such as those
 * produced by build-spec.mjs. Keys are sorted before diffing for stability.
 */
import { readFileSync } from 'fs';
import { resolve } from 'path';

const [beforeArg, afterArg] = process.argv.slice(2);

if (!beforeArg || !afterArg) {
  console.error('Usage: node spec-diff.mjs <before.json> <after.json>');
  process.exit(1);
}

const beforeSpec = JSON.parse(readFileSync(resolve(process.cwd(), beforeArg), 'utf-8'));
const afterSpec  = JSON.parse(readFileSync(resolve(process.cwd(), afterArg),  'utf-8'));

const beforeJson = JSON.stringify(beforeSpec, sortedKeysReplacer, 2);
const afterJson  = JSON.stringify(afterSpec,  sortedKeysReplacer, 2);

console.error(`Before: ${summarize(beforeSpec)}`);
console.error(`After:  ${summarize(afterSpec)}`);

if (beforeJson === afterJson) {
  console.error('\nDiff: no changes.');
} else {
  console.error('\nDiff (before → after):');
  console.log(unifiedDiff(beforeJson, afterJson, beforeArg, afterArg));
}

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

/** LCS-based unified diff (produces minimal targeted hunks for large spec changes). */
function unifiedDiff(a, b, nameA = 'a', nameB = 'b') {
  const aLines = a.split('\n');
  const bLines = b.split('\n');
  const m = aLines.length, n = bLines.length;

  // Build LCS DP table
  const dp = Array.from({ length: m + 1 }, () => new Int32Array(n + 1));
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = aLines[i - 1] === bLines[j - 1]
        ? dp[i - 1][j - 1] + 1
        : Math.max(dp[i - 1][j], dp[i][j - 1]);

  // Backtrack to collect matching line index pairs (0-indexed)
  const matches = [];
  let i = m, j = n;
  while (i > 0 && j > 0) {
    if (aLines[i - 1] === bLines[j - 1]) { matches.unshift([i - 1, j - 1]); i--; j--; }
    else if (dp[i - 1][j] >= dp[i][j - 1]) i--;
    else j--;
  }

  // Emit hunks between matched anchor pairs
  const out = [`--- ${nameA}`, `+++ ${nameB}`];
  let ai = 0, bi = 0;

  function emitHunk(endA, endB) {
    const del = aLines.slice(ai, endA);
    const add = bLines.slice(bi, endB);
    if (del.length || add.length) {
      out.push(`@@ -${ai + 1},${del.length} +${bi + 1},${add.length} @@`);
      del.forEach(l => out.push(`-${l}`));
      add.forEach(l => out.push(`+${l}`));
    }
  }

  for (const [mi, mj] of matches) {
    emitHunk(mi, mj);
    ai = mi + 1;
    bi = mj + 1;
  }
  emitHunk(m, n); // flush any trailing diffs after the last match

  return out.join('\n');
}
