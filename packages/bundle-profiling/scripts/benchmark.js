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
const path = require('path');
const { execFileSync } = require('child_process');
const { measure } = require('./report');

// Runs both profiling scenarios and prints one compact block — four lines total,
// nothing else — meant to be pasted directly into BENCHMARK_LOG.md. Webpack's own
// output is suppressed unless a build actually fails.
function build(configFile) {
  try {
    execFileSync('npx', ['webpack', '--config', configFile], {
      cwd: path.resolve(__dirname, '..'),
      stdio: 'pipe',
    });
  } catch (err) {
    process.stderr.write(err.stdout || '');
    process.stderr.write(err.stderr || '');
    throw new Error(`build failed: ${configFile}`);
  }
}

build('webpack.profile.config.js');
build('webpack.profile-shared-react.config.js');

const cold = measure(path.resolve(__dirname, '..', 'dist'));
const shared = measure(path.resolve(__dirname, '..', 'dist-shared-react'));
const min = (rows) => rows[rows.length - 1];
const max = (rows) => rows[0];

console.log(`cold   min ${min(cold).fixture}=${min(cold).gzipKB}KB  max ${max(cold).fixture}=${max(cold).gzipKB}KB`);
console.log(
  `shared min ${min(shared).fixture}=${min(shared).gzipKB}KB  max ${max(shared).fixture}=${max(shared).gzipKB}KB`
);
