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
const { runSonarForBranch, askQuestion } = require('./sonarCloudUtils');
const readline = require('readline');

async function main() {
	// Create an interface to capture user input
	const rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout,
	});

	const answer = await askQuestion(
		`Make sure that your main is up to date before executing or the results won't be accurate. Is your main branch up to date? (y): `,
		rl
	);

	if (['n', 'no'].includes(answer.toLowerCase())) {
		console.log('Exiting...');
		process.exit(0);
	}

	// Close the readline interface
	rl.close();

	await runSonarForBranch();
}

main();
