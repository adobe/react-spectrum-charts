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
const chalk = require('chalk');

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

function getTokens() {
	// Read the local.json file
	const config = JSON.parse(fs.readFileSync('./local.json', 'utf8'));

	// Extract tokens from local.json
	const { SONAR_TOKEN, GITHUB_TOKEN } = config;

	// Ensure tokens exists
	if (!SONAR_TOKEN) {
		console.error(chalk.red('Error: SONAR_TOKEN is missing from local.json.'));
		process.exit(1);
	}
	if (!GITHUB_TOKEN) {
		console.error(chalk.red('Error: GITHUB_TOKEN is missing from local.json'));
		process.exit(1);
	}

	return { SONAR_TOKEN, GITHUB_TOKEN };
}

function runSonarCloud(prNumber, branch) {
	const { SONAR_TOKEN } = getTokens();

	const sonarOptions = {
		'-Dsonar.organization': 'adobeinc',
		'-Dsonar.projectKey': 'adobe_react-spectrum-charts',
		'-Dsonar.sources': '.',
		'-Dsonar.host.url': 'https://sonarcloud.io',
		'-Dsonar.pullrequest.key': prNumber,
		'-Dsonar.pullrequest.branch': branch,
		'-Dsonar.pullrequest.base': 'main',
	};

	console.log(`Running sonar-scanner for PR #${prNumber} on branch ${branch}...`);

	// Run sonar-scanner
	execSync(
		`sonar-scanner ${Object.entries(sonarOptions)
			.map((option) => option[0] + '=' + option[1])
			.join(' ')}`,
		{
			env: { ...process.env, SONAR_TOKEN },
			stdio: 'inherit',
		}
	);

	console.log(chalk.green('SonarCloud analysis completed successfully'));
}

async function getPrBranchName(prNumber) {
	const prs = await getOpenPrs();
	const pr = prs.find((pr) => pr.number === prNumber);
	if (!pr) {
		console.error(
			`${colors.fgRed}Error: PR #${prNumber} not found. It's possible the PR is already closed.${colors.reset}`
		);
		process.exit(1);
	}

	return pr.head.ref;
}

async function getPrNumber(branchName) {
	const prs = await getOpenPrs();
	const branchPr = prs.find((pr) => pr.head.ref === branchName);
	if (!branchPr) {
		console.error(chalk.red(`Error: Open PR not found for branch ${branchName}.`));
		process.exit(1);
	}

	console.log(`PR number for branch ${branchName} is ${branchPr.number}`);
	return branchPr.number;
}

async function getOpenPrs() {
	const { GITHUB_TOKEN } = getTokens();
	const headers = {
		Accept: 'application/vnd.github+json',
		Authorization: `Bearer ${GITHUB_TOKEN}`,
		'X-GitHub-Api-Version': '2022-11-28',
	};
	try {
		const response = await axios.get(` https://api.github.com/repos/adobe/react-spectrum-charts/pulls?state=open`, {
			headers,
		});
		return response.data;
	} catch (error) {
		console.error('Error:', error.response ? error.response.data : error.message);
	}
}

function getBranchName() {
	return execSync('git rev-parse --abbrev-ref HEAD').toString().trim();
}

async function runSonarForBranch() {
	const branchName = getBranchName();

	const prNumber = await getPrNumber(branchName);

	runSonarCloud(prNumber, branch);
}

async function runSonarForFork() {
	// Get the current branch name
	let localBranchName = getBranchName();

	// Check if the local branch name is formatted as pr/[0-9]+
	if (!/^pr\/\d+$/.test(localBranchName)) {
		console.error(chalk.red('Error: Current branch name does not match the required format of "pr/${number}".'));
		process.exit(1);
	}

	prNumber = parseInt(localBranchName.split('/')[1]);

	// Get the PR number from the github API
	const branch = await getPrBranchName(prNumber);

	runSonarCloud(prNumber, branch);
}

// Function to ask a question and return a promise
function askQuestion(question, rl) {
	return new Promise((resolve) => {
		rl.question(chalk.blue(question), (answer) => {
			resolve(answer);
		});
	});
}

exports.runSonarForBranch = runSonarForBranch;
exports.runSonarForFork = runSonarForFork;
exports.getBranchName = getBranchName;
exports.askQuestion = askQuestion;
