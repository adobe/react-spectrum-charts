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
const packagesDir = path.join(rootDir, 'packages');
const dryRun = process.argv.includes('--dry-run');

function getWorkspacePackages() {
  return fs
    .readdirSync(packagesDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => {
      const directory = path.join(packagesDir, entry.name);
      const manifestPath = path.join(directory, 'package.json');
      if (!fs.existsSync(manifestPath)) {
        return null;
      }

      return {
        directory,
        manifest: JSON.parse(fs.readFileSync(manifestPath, 'utf8')),
      };
    })
    .filter(Boolean);
}

function isPublished({ manifest }) {
  const result = spawnSync(
    'npm',
    ['view', `${manifest.name}@${manifest.version}`, 'version', '--json', '--registry', 'https://registry.npmjs.org'],
    {
      cwd: rootDir,
      encoding: 'utf8',
    }
  );

  if (result.status === 0) {
    return true;
  }

  if (`${result.stdout}\n${result.stderr}`.includes('E404')) {
    return false;
  }

  throw new Error(`Unable to check ${manifest.name}@${manifest.version} on npm:\n${result.stderr || result.stdout}`);
}

function getLocalDependencies(workspace, workspacesByName) {
  const dependencyNames = Object.keys(workspace.manifest.dependencies ?? {});
  return dependencyNames.filter((name) => workspacesByName.has(name));
}

function addWithDependencies(packageName, workspacesByName, selected) {
  if (selected.has(packageName)) {
    return;
  }

  const workspace = workspacesByName.get(packageName);
  if (!workspace) {
    return;
  }

  for (const dependencyName of getLocalDependencies(workspace, workspacesByName)) {
    addWithDependencies(dependencyName, workspacesByName, selected);
  }

  selected.add(packageName);
}

function getBuildOrder(packageNames, workspacesByName) {
  const pending = new Set(packageNames);
  const complete = new Set();
  const order = [];

  while (pending.size > 0) {
    const ready = [...pending].filter((name) =>
      getLocalDependencies(workspacesByName.get(name), workspacesByName).every(
        (dependencyName) => !pending.has(dependencyName) || complete.has(dependencyName)
      )
    );

    if (ready.length === 0) {
      throw new Error(`Circular workspace dependency detected among: ${[...pending].join(', ')}`);
    }

    for (const name of ready.sort()) {
      pending.delete(name);
      complete.add(name);
      order.push(name);
    }
  }

  return order;
}

function buildPackage(workspace) {
  const script = workspace.manifest.scripts?.['build:s2'] ? 'build:s2' : 'build';
  if (!workspace.manifest.scripts?.[script]) {
    throw new Error(`${workspace.manifest.name} does not define a ${script} script`);
  }

  console.log(`Building ${workspace.manifest.name} with ${script}`);
  if (dryRun) {
    return;
  }

  const result = spawnSync('yarn', ['workspace', workspace.manifest.name, script], {
    cwd: rootDir,
    stdio: 'inherit',
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

const workspaces = getWorkspacePackages();
const workspacesByName = new Map(workspaces.map((workspace) => [workspace.manifest.name, workspace]));
const unpublished = workspaces.filter(({ manifest }) => !manifest.private && !isPublished({ manifest }));

if (unpublished.length === 0) {
  console.log('No unpublished package versions require a build.');
  process.exit(0);
}

console.log(
  `Unpublished packages:\n${unpublished.map(({ manifest }) => `- ${manifest.name}@${manifest.version}`).join('\n')}`
);

const selected = new Set();
for (const { manifest } of unpublished) {
  addWithDependencies(manifest.name, workspacesByName, selected);
}

for (const packageName of getBuildOrder(selected, workspacesByName)) {
  buildPackage(workspacesByName.get(packageName));
}
