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

/* eslint-disable @typescript-eslint/no-var-requires */
const fs = require('fs');
const path = require('path');

const S2_PACKAGES = [
  'packages/react-spectrum-charts-s2/package.json',
  'packages/vega-spec-builder-s2/package.json'
];

const newVersion = process.argv[2];
if (!newVersion) {
  console.error('Error: Please provide the new version (e.g., 0.2.0)');
  console.error('Usage: node ./scripts/updateS2Versions.js 0.2.0');
  process.exit(1);
}

// Validate alpha version format (0.x.x or 0.x.x-alpha.x)
if (!newVersion.match(/^0\.\d+\.\d+(-[a-z]+\.\d+)?$/)) {
  console.error('Error: S2 versions must be in alpha format (0.x.x or 0.x.x-alpha.x)');
  console.error(`Provided version: ${newVersion}`);
  process.exit(1);
}

console.log(`Updating S2 packages to: ${newVersion}`);

// Function to detect indentation from file content
function detectIndentation(content) {
  const lines = content.split('\n');
  for (const line of lines) {
    if (line.trim() && line.startsWith(' ')) {
      const match = line.match(/^(\s+)/);
      if (match) {
        return match[1];
      }
    }
  }
  return '  '; // Default to 2 spaces
}

const rootDir = path.resolve(__dirname, '..');

S2_PACKAGES.forEach((pkgPath) => {
  const filePath = path.join(rootDir, pkgPath);
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const pkg = JSON.parse(content);
    
    // Detect original indentation
    const originalIndentation = detectIndentation(content);
    const indentSize = originalIndentation.length;
    const indent = ' '.repeat(indentSize);
    
    const oldVersion = pkg.version;
    pkg.version = newVersion;
    
    // Update S2-to-S2 dependencies
    ['dependencies', 'devDependencies'].forEach((depType) => {
      if (pkg[depType]) {
        Object.keys(pkg[depType]).forEach((depName) => {
          if (depName.includes('-s2')) {
            const currentVersionString = pkg[depType][depName];
            const versionPrefix = currentVersionString.match(/^[\^~]/)?.[0] || '';
            pkg[depType][depName] = `${versionPrefix}${newVersion}`;
          }
        });
      }
    });
    
    fs.writeFileSync(filePath, JSON.stringify(pkg, null, indent) + '\n', 'utf8');
    console.log(`✓ Updated ${path.relative(rootDir, filePath)}: ${oldVersion} → ${newVersion}`);
  } catch (error) {
    console.error(`Error processing ${pkgPath}:`, error.message);
    process.exit(1);
  }
});

console.log('\n✅ S2 version update completed successfully.');

