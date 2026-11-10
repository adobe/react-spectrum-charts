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
 *
 * Like SonarCloud, skips files matched by sonar.exclusions and findings on lines marked NOSONAR.
 */
const { execFileSync } = require('child_process');
const { ESLint } = require('eslint');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const LINTABLE = /^packages\/(?!docs\/|docs-s2\/).*\.tsx?$/;

const GLOB_TOKENS = { '**/': '(?:.*/)?', '**': '.*', '*': '[^/]*' };

const toRegExp = (glob) => {
  const source = glob
    .split(/(\*\*\/|\*\*|\*)/)
    .map((part) => GLOB_TOKENS[part] ?? part.replaceAll(/[.+?^${}()|[\]\\]/g, String.raw`\$&`))
    .join('');
  return new RegExp(`^${source}$`);
};

const getSonarExclusions = () => {
  const properties = fs.readFileSync(path.join(ROOT, 'sonar-project.properties'), 'utf8');
  const line = properties.split('\n').find((entry) => entry.startsWith('sonar.exclusions='));
  if (!line) return [];
  return line
    .slice('sonar.exclusions='.length)
    .split(',')
    .map((glob) => toRegExp(glob.trim()));
};

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
const exclusions = getSonarExclusions();
const isExcluded = (file) => exclusions.some((pattern) => pattern.test(path.relative(ROOT, path.resolve(ROOT, file))));

let targets;
if (all) {
  targets = ['packages'];
} else if (files.length) {
  targets = files.filter((file) => !isExcluded(file));
} else {
  targets = getChangedFiles(base).filter((file) => !isExcluded(file));
  if (!targets.length) {
    console.log(`lint:sonar — no changed TypeScript files vs. ${base}.`);
    process.exit(0);
  }
  console.log(`lint:sonar — ${targets.length} changed file(s) vs. ${base}`);
}

const withoutSuppressed = (result) => {
  if (isExcluded(result.filePath)) return null;
  if (!result.messages.length) return result;
  const lines = fs.readFileSync(result.filePath, 'utf8').split('\n');
  const messages = result.messages.filter((message) => !lines[message.line - 1]?.includes('NOSONAR'));
  const count = (severity) => messages.filter((message) => message.severity === severity).length;
  return { ...result, messages, errorCount: count(2), warningCount: count(1) };
};

const main = async () => {
  const eslint = new ESLint({
    cwd: ROOT,
    useEslintrc: false,
    overrideConfigFile: '.eslintrc.sonar.cjs',
    extensions: ['.ts', '.tsx'],
    errorOnUnmatchedPattern: false,
  });
  const results = (await eslint.lintFiles(targets)).map(withoutSuppressed).filter(Boolean);
  const formatter = await eslint.loadFormatter('stylish');
  const output = await formatter.format(results);
  if (output) console.log(output);
  process.exit(results.some((result) => result.errorCount > 0) ? 1 : 0);
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
