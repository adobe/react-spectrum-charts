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

// Runs a script in every workspace that defines it, dependencies first; `yarn workspaces run` ignores dependency order.
// Usage: node scripts/runWorkspacesInOrder.js <script> [--dry-run]

const { execFileSync, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');

/**
 * Orders workspaces so each one comes after the workspaces it depends on.
 * @param {Record<string, { workspaceDependencies: string[] }>} workspaces output of `yarn workspaces info`
 * @returns {string[]}
 */
function getBuildOrder(workspaces) {
  const order = [];
  const state = new Map();
  const visit = (name, trail) => {
    if (state.get(name) === 'done') return;
    if (state.get(name) === 'visiting') {
      throw new Error(`Workspace dependency cycle: ${[...trail, name].join(' -> ')}`);
    }
    state.set(name, 'visiting');
    for (const dependency of workspaces[name].workspaceDependencies) {
      visit(dependency, [...trail, name]);
    }
    state.set(name, 'done');
    order.push(name);
  };
  for (const name of Object.keys(workspaces)) visit(name, []);
  return order;
}

function main() {
  const [script] = process.argv.slice(2).filter((arg) => !arg.startsWith('--'));
  const dryRun = process.argv.includes('--dry-run');
  if (!script) {
    console.error('Usage: node scripts/runWorkspacesInOrder.js <script> [--dry-run]');
    process.exit(1);
  }

  const workspaces = JSON.parse(execFileSync('yarn', ['--silent', 'workspaces', 'info'], { cwd: rootDir, encoding: 'utf8' }));
  for (const name of getBuildOrder(workspaces)) {
    const manifest = JSON.parse(fs.readFileSync(path.join(rootDir, workspaces[name].location, 'package.json'), 'utf8'));
    if (!manifest.scripts?.[script]) continue;
    console.log(`\n> ${name} ${script}`);
    if (dryRun) continue;
    const { status } = spawnSync('yarn', ['workspace', name, 'run', script], { cwd: rootDir, stdio: 'inherit' });
    if (status !== 0) process.exit(status ?? 1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { getBuildOrder };
