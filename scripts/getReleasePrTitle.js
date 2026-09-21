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
const changesetDir = path.join(rootDir, '.changeset');
const defaultTitle = 'chore: version packages';

const changesets = fs
  .readdirSync(changesetDir)
  .filter((fileName) => fileName.endsWith('.md') && fileName.toLowerCase() !== 'readme.md');

if (changesets.length === 0) {
  console.log(defaultTitle);
  process.exit(0);
}

const outputPath = `.changeset-release-plan-${process.pid}.json`;
const status = spawnSync('yarn', ['changeset', 'status', '--output', outputPath], {
  cwd: rootDir,
  encoding: 'utf8',
});

if (status.status !== 0) {
  throw new Error(status.stderr || status.stdout || 'Unable to determine the Changesets release plan.');
}

const absoluteOutputPath = path.join(rootDir, outputPath);
const { releases } = JSON.parse(fs.readFileSync(absoluteOutputPath, 'utf8'));
fs.unlinkSync(absoluteOutputPath);

const pending = new Map(releases.map(({ name, newVersion }) => [name, newVersion]));
const titleParts = [];

function addFixedPair(label, firstPackage, secondPackage) {
  const firstVersion = pending.get(firstPackage);
  const secondVersion = pending.get(secondPackage);

  if (firstVersion && firstVersion === secondVersion) {
    titleParts.push(`${label} ${firstVersion}`);
    pending.delete(firstPackage);
    pending.delete(secondPackage);
  }
}

addFixedPair('S1 React/Vega', '@adobe/react-spectrum-charts', '@spectrum-charts/vega-spec-builder');
addFixedPair('S2 React/Vega', '@spectrum-charts/react-spectrum-charts-s2', '@spectrum-charts/vega-spec-builder-s2');

for (const [name, version] of [...pending].sort(([first], [second]) => first.localeCompare(second))) {
  titleParts.push(`${name.replace(/^@(?:adobe|spectrum-charts)\//, '')} ${version}`);
}

console.log(titleParts.length > 0 ? `chore: release ${titleParts.join(', ')}` : defaultTitle);
