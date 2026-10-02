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
// Packs each built package and validates its exports and types with publint and arethetypeswrong.
// Usage: node scripts/checkPackageExports.mjs (run after yarn build:s2)
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');

// ESM-only packages skip the CommonJS resolution modes they intentionally don't support.
const PACKAGES = {
  constants: [],
  locales: [],
  schemas: [],
  themes: [],
  utils: [],
  'vega-spec-builder-s2': ['--profile', 'esm-only'],
  'react-spectrum-charts-s2': ['--profile', 'esm-only'],
};

const bin = (name) => path.join(root, 'node_modules', '.bin', name);
const run = (command, args, options = {}) => execFileSync(command, args, { stdio: 'inherit', ...options });

const packDir = fs.mkdtempSync(path.join(os.tmpdir(), 'rsc-pack-'));
const failures = [];
try {
  for (const [name, attwArgs] of Object.entries(PACKAGES)) {
    console.log(`\n=== @spectrum-charts/${name}`);
    const output = execFileSync('npm', ['pack', '--silent', '--pack-destination', packDir], {
      cwd: path.join(root, 'packages', name),
      encoding: 'utf8',
    });
    const tarball = path.join(packDir, output.trim().split('\n').pop());
    for (const [tool, args] of [
      ['publint', [tarball, '--strict', '--level', 'warning']],
      ['attw', [tarball, ...attwArgs, '--format', 'table-flipped']],
    ]) {
      try {
        run(bin(tool), args);
      } catch {
        failures.push(`${name}: ${tool}`);
      }
    }
  }
} finally {
  fs.rmSync(packDir, { recursive: true, force: true });
}

if (failures.length) {
  console.error(`\nPackage export checks failed:\n  ${failures.join('\n  ')}`);
  process.exit(1);
}
console.log('\nAll package export checks passed.');
