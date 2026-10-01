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
const { spawnSync } = require('child_process');

const rootDir = path.resolve(__dirname, '..');
const base = process.argv[2] || 'origin/main';

const status = spawnSync('yarn', ['-s', 'changeset', 'status', `--since=${base}`], {
  cwd: rootDir,
  encoding: 'utf8',
});
process.stdout.write(status.stdout);
process.stderr.write(status.stderr);

if (status.status === 0 || !`${status.stdout}${status.stderr}`.includes('no changesets were found')) {
  process.exit(status.status ?? 1);
}

const diff = spawnSync('git', ['diff', '--name-only', `${base}...HEAD`], { cwd: rootDir, encoding: 'utf8' });
const changedPackages = new Set();

for (const file of diff.stdout.split('\n')) {
  const [workspaceDir, packageDir] = file.split('/');
  const manifestPath = path.join(rootDir, workspaceDir, packageDir ?? '', 'package.json');
  if (workspaceDir === 'packages' && packageDir && fs.existsSync(manifestPath)) {
    changedPackages.add(JSON.parse(fs.readFileSync(manifestPath, 'utf8')).name);
  }
}

const packageList = [...changedPackages].sort((first, second) => first.localeCompare(second));
const message = [
  'Missing changeset.',
  packageList.length > 0 ? `Changed packages: ${packageList.join(', ')}` : undefined,
  'Release-worthy change: run `yarn changeset` and commit the generated .changeset/*.md file.',
  'No release needed (docs, tests, CI, internal refactor): run `yarn changeset:empty` and commit it.',
]
  .filter(Boolean)
  .join('\n');

console.error(`\n${message}`);
if (process.env.GITHUB_ACTIONS) {
  console.log(`::error title=Missing changeset::${message.replace(/\n/g, '%0A')}`);
}
process.exit(status.status ?? 1);
