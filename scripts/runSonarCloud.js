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
const axios = require('axios');

const colors = {
	reset: '\x1b[0m',
	bright: '\x1b[1m',
	dim: '\x1b[2m',
	underscore: '\x1b[4m',
	blink: '\x1b[5m',
	reverse: '\x1b[7m',
	hidden: '\x1b[8m',

	fgBlack: '\x1b[30m',
	fgRed: '\x1b[31m',
	fgGreen: '\x1b[32m',
	fgYellow: '\x1b[33m',
	fgBlue: '\x1b[34m',
	fgMagenta: '\x1b[35m',
	fgCyan: '\x1b[36m',
	fgWhite: '\x1b[37m',
};

async function main() {
	// Read the local.json file
	const config = JSON.parse(fs.readFileSync('./local.json', 'utf8'));

	// Extract tokens from local.json
	const { SONAR_TOKEN, GITHUB_TOKEN } = config;

	// Ensure SONAR_TOKEN exists
	if (!SONAR_TOKEN) {
		console.error(`${colors.fgRed}Error: SONAR_TOKEN is missing from local.json.${colors.reset}`);
		process.exit(1);
	}

	// Ensure GITHUB_TOKEN exists
	if (!GITHUB_TOKEN) {
		console.error(`${colors.fgRed}Error: GITHUB_TOKEN is missing from local.json.${colors.reset}`);
		process.exit(1);
	}

	// Get the current branch name
	const branch = execSync('git rev-parse --abbrev-ref HEAD').toString().trim();

	// Get the PR number from the github API
	const prNumber = await getPrNumber(branch, GITHUB_TOKEN);

	const sonarOptions = {
		'-Dsonar.organization': 'adobeinc',
		'-Dsonar.projectKey': 'adobe_react-spectrum-charts',
		'-Dsonar.sources': '.',
		'-Dsonar.host.url': 'https://sonarcloud.io',
		'-Dsonar.pullrequest.key': prNumber,
		'-Dsonar.pullrequest.branch': branch,
		'-Dsonar.pullrequest.base': 'main',
	};

	console.log(
		`${colors.fgBlue}Running sonar-scanner for PR ${colors.fgMagenta}${prNumber}${colors.fgBlue} on branch ${colors.fgMagenta}${branch}${colors.reset}`
	);

	// Run the sonar-scanner command with SONAR_TOKEN set as an environment variable
	execSync(
		`sonar-scanner ${Object.entries(sonarOptions)
			.map((option) => option[0] + '=' + option[1])
			.join(' ')}`,
		{
			env: { ...process.env, SONAR_TOKEN },
			stdio: 'inherit',
		}
	);

	console.log(`${colors.fgGreen}SonarCloud analysis completed successfully.${colors.reset}`);
}

async function getPrNumber(branch, token) {
	const headers = {
		Accept: 'application/vnd.github+json',
		Authorization: `Bearer ${token}`,
		'X-GitHub-Api-Version': '2022-11-28',
	};
	try {
		const response = await axios.get(` https://api.github.com/repos/adobe/react-spectrum-charts/pulls?state=open`, {
			headers,
		});
		const branchPr = response.data.find((pr) => pr.head.ref === branch);
		if (!branchPr) {
			console.error(`${colors.fgRed}Error: Open PR not found for branch ${branch}.${colors.reset}`);
			process.exit(1);
		}

		console.log(
			`${colors.fgGreen}PR number for branch ${colors.fgYellow}${branch}${colors.fgGreen} is ${colors.fgYellow}${branchPr.number}${colors.reset}`
		);
		return branchPr.number;
	} catch (error) {
		console.error(`${colors.fgRed}Error:`, error.response ? error.response.data : error.message, colors.reset);
	}
}

main();

// /*
//  * Copyright 2024 Adobe. All rights reserved.
//  * This file is licensed to you under the Apache License, Version 2.0 (the "License");
//  * you may not use this file except in compliance with the License. You may obtain a copy
//  * of the License at http://www.apache.org/licenses/LICENSE-2.0
//  *
//  * Unless required by applicable law or agreed to in writing, software distributed under
//  * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
//  * OF ANY KIND, either express or implied. See the License for the specific language
//  * governing permissions and limitations under the License.
//  */

// /* eslint-disable @typescript-eslint/no-var-requires */
// const { execSync } = require('child_process');
// const fs = require('fs');
// const readline = require('readline');

// // Read the local.json file
// const config = JSON.parse(fs.readFileSync('./local.json', 'utf8'));

// // Extract the SONAR_TOKEN
// const { SONAR_TOKEN } = config;

// // Ensure SONAR_TOKEN exists
// if (!SONAR_TOKEN) {
// 	console.error('Error: SONAR_TOKEN is missing from local.json.');
// 	process.exit(1);
// }

// const userInputs = [
// 	{
// 		prompt: 'Enter the PR number: ',
// 		key: '-Dsonar.pullrequest.key',
// 	},
// 	{
// 		prompt: 'Enter the branch name: ',
// 		key: '-Dsonar.pullrequest.branch',
// 	},
// ];

// const rl = readline.createInterface({
// 	input: process.stdin,
// 	output: process.stdout,
// });

// for (const input of userInputs) {
// 	rl.question(input.prompt, (value) => {
// 		if (!value) {
// 			console.error(`Error: ${input.key} is required.`);
// 			rl.close();
// 			process.exit(1);
// 		}
// 		input.value = value;
// 		rl.close();
// 	});
// }

// // Run the sonar-scanner command with PR number and SONAR_TOKEN set as environment variable
// let sonarOptions =
// 	'-Dsonar.organization=adobeinc -Dsonar.projectKey=adobe_react-spectrum-charts -Dsonar.sources=. -Dsonar.host.url=https://sonarcloud.io';
// userInputs.forEach((input) => {
// 	sonarOptions += ` ${input.key}=${input.value}`;
// });
// execSync(`sonar-scanner ${sonarOptions}`, { env: { ...process.env, SONAR_TOKEN }, stdio: 'inherit' });
