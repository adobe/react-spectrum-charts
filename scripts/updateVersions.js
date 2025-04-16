/*
 * Copyright 2025 Adobe. All rights reserved.
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
const { globSync } = require('glob');

const TARGET_DEPENDENCIES = ['@adobe/react-spectrum-charts'];
const TARGET_PREFIX = '@spectrum-charts/';

// Get the new version from command line arguments
const newVersion = process.argv[2];
if (!newVersion) {
	console.error('Error: Please provide the new version as a command line argument.');
	process.exit(1);
}

console.log(`Updating versions to: ${newVersion}`);

// Find all package.json files in root and packages/*
const rootDir = path.resolve(__dirname, '..');
const packageJsonPaths = globSync('{package.json,packages/*/package.json}', {
	cwd: rootDir, // Search from the root directory
	absolute: true, // Get absolute paths
});

packageJsonPaths.forEach((filePath) => {
	try {
		console.log(`Processing: ${path.relative(rootDir, filePath)}`);
		const packageJsonContent = fs.readFileSync(filePath, 'utf8');
		const packageJson = JSON.parse(packageJsonContent);

		// Update the main version
		if (packageJson.version) {
			packageJson.version = newVersion;
		}

		// Update relevant dependencies
		['dependencies', 'devDependencies', 'peerDependencies'].forEach((depType) => {
			if (packageJson[depType]) {
				Object.keys(packageJson[depType]).forEach((depName) => {
					if (TARGET_DEPENDENCIES.includes(depName) || depName.startsWith(TARGET_PREFIX)) {
						// Update version, keeping any existing prefix like '^' or '~'
						const currentVersionString = packageJson[depType][depName];
						const versionPrefix = currentVersionString.match(/^[\^~]/)?.[0] || '';
						packageJson[depType][depName] = `${versionPrefix}${newVersion}`;
					}
				});
			}
		});

		// Write the updated package.json back to the file
		// Keep the same indentation (tab) and trailing newline as the original
		fs.writeFileSync(filePath, JSON.stringify(packageJson, null, '\t') + '\n', 'utf8');
	} catch (error) {
		console.error(`Error processing file ${filePath}:`, error);
	}
});

console.log('Version update completed.');
