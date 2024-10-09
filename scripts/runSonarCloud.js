/*
 * Copyright 2024 Adobe. All rights reserved.
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
const { execSync } = require('child_process');
const fs = require('fs');

// Read the local.json file
const config = JSON.parse(fs.readFileSync('./local.json', 'utf8'));

// Extract the SONAR_TOKEN
const { SONAR_TOKEN } = config;

// Ensure SONAR_TOKEN exists
if (!SONAR_TOKEN) {
	console.error('Error: SONAR_TOKEN is missing from local.json.');
	process.exit(1);
}

// Run the sonar-scanner command with SONAR_TOKEN set as an environment variable
execSync(
	`sonar-scanner -Dsonar.organization=adobeinc -Dsonar.projectKey=adobe_react-spectrum-charts -Dsonar.sources=. -Dsonar.host.url=https://sonarcloud.io`,
	{ env: { ...process.env, SONAR_TOKEN }, stdio: 'inherit' }
);
