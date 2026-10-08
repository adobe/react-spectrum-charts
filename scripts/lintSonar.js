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
 * Runs the local SonarCloud approximation (.eslintrc.sonar.cjs).
 *
 * Usage:
 *   yarn lint:sonar                 lint files changed vs. origin/main (committed, staged, unstaged, untracked)
 *   yarn lint:sonar --base <ref>    lint files changed vs. <ref>
 *   yarn lint:sonar --all           lint every package
 *   yarn lint:sonar <files...>      lint specific files
 */
const { execFileSync, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const LINTABLE = /^packages\/(?!docs\/|docs-s2\/).*\.tsx?$/;

const git = (...args) => execFileSync('git', args, { cwd: ROOT, encoding: 'utf8' }).trim();

const getChangedFiles = (base) => {
  const mergeBase = git('merge-base', 'HEAD', base);
  const changed = git('diff', '--name-only', '--diff-filter=ACMR', mergeBase).split('\n');
  const untracked = git('ls-files', '--others', '--exclude-standard').split('\n');
  return [...new Set([...changed, ...untracked])].filter(
    (file) => LINTABLE.test(file) && fs.existsSync(path.join(ROOT, file))
  );
};

const parseArgs = (argv) => {
  const baseIndex = argv.indexOf('--base');
  const base = baseIndex === -1 ? 'origin/main' : argv[baseIndex + 1];
  const all = argv.includes('--all');
  const files = argv.filter((arg, i) => !arg.startsWith('--') && argv[i - 1] !== '--base');
  return { base, all, files };
};

const { base, all, files } = parseArgs(process.argv.slice(2));

let targets;
if (all) {
  targets = ['packages'];
} else if (files.length) {
  targets = files;
} else {
  targets = getChangedFiles(base);
  if (!targets.length) {
    console.log(`lint:sonar — no changed TypeScript files vs. ${base}.`);
    process.exit(0);
  }
  console.log(`lint:sonar — ${targets.length} changed file(s) vs. ${base}`);
}

const eslint = path.join(ROOT, 'node_modules', '.bin', 'eslint');
const result = spawnSync(
  eslint,
  ['--no-eslintrc', '-c', '.eslintrc.sonar.cjs', '--ext', '.ts,.tsx', '--no-error-on-unmatched-pattern', ...targets],
  { cwd: ROOT, stdio: 'inherit' }
);
process.exit(result.status ?? 1);
