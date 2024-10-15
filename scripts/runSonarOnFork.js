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
const readline = require('readline');
const chalk = require('chalk');
const { execSync } = require('child_process');
const { getBranchName, runSonarForFork, askQuestion } = require('./sonarCloudUtils');

const prNumber = parseInt(process.argv[2]);

if (!prNumber || isNaN(prNumber)) {
	console.error(chalk.red('Please provide a PR number.\nUsage: yarn sonar-fork-pr <pr-number>'));
	process.exit(1);
}

async function main() {
	// Create an interface to capture user input
	const rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout,
	});

	// Ask the user if they want to continue
	const answer = await askQuestion(
		'This action will stash all your changes, checkout and pull main. Do you wish to continue? (y): ',
		rl
	);

	if (['n', 'no'].includes(answer.toLowerCase())) {
		console.log('Exiting...');
		process.exit(0);
	}
	// Close the readline interface
	rl.close();

	// get the branch name so we can use it later
	const currentBranch = getBranchName();

	console.log('Stashing changes...');
	execSync('git stash');

	console.log('Checking out main...');
	execSync('git checkout main && git pull');

	console.log('Checking out PR branch...');
	execSync(`git fetch origin pull/${prNumber}/head:pr/${prNumber} && git checkout pr/${prNumber}`);

	console.log('Installing dependencies...');
	execSync('yarn install');

	console.log('Running tests...');
	execSync('yarn test');

	console.log('Running SonarCloud analysis...');
	await runSonarForFork();

	console.log('Cleaning up...');
	execSync(`git checkout main && git branch -D pr/${prNumber} && git checkout ${currentBranch}`);

	try {
		execSync('git stash pop');
	} catch (e) {
		console.log('No changes to pop.');
	}

	execSync(`yarn install`);
}

main();
