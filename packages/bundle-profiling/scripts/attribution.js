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

// Checks whether vega-lite or vega-embed leaked into a fixture's emitted .js file. Greps
// the bundle text directly for each package's name (both export a `.version` string
// constant, so the name survives minification) rather than parsing bundler stats output -
// this stays correct across bundlers, including the upcoming Rollup migration.
//
// TODO(Ticket 09): add per-mark spec-builder checks once ESM output (Tickets 03/04) gives
// each mark its own file. Today vega-spec-builder-s2's dist is one opaque UMD module with
// no per-mark marker to check for, by any method - not something this script can fix.

const SUSPECTS = ['vega-lite', 'vega-embed'];

function attribute(distDir) {
  const results = {};
  for (const file of fs.readdirSync(distDir).filter((f) => f.endsWith('.js'))) {
    const text = fs.readFileSync(path.join(distDir, file), 'utf8');
    results[file.replace(/\.js$/, '')] = SUSPECTS.filter((name) => text.includes(name));
  }
  return results;
}

module.exports = { attribute, SUSPECTS };

if (require.main === module) {
  const distArg = process.argv[2] || 'dist';
  const result = attribute(path.resolve(__dirname, '..', distArg));
  for (const [fixture, present] of Object.entries(result)) {
    console.log(`${fixture}: ${present.length ? present.join(', ') : '(none present)'}`);
  }
}
