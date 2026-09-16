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
const base = require('./webpack.profile.config.js');
const { pack, outDir } = require('./scripts/pack.js');

// Variant of webpack.profile.config.js that resolves @spectrum-charts/react-spectrum-charts-s2
// against a real `npm pack` artifact instead of the live workspace source/symlink. Aliases are
// built directly from the packed package.json's own `exports` map, so a subpath missing from
// `files` (and therefore missing from the extracted tarball) fails here as a real resolution
// error — the workspace-symlink resolution used by the other configs can't catch that class of
// bug, since it always sees the full monorepo source regardless of what `files` allows.
pack();

const pkg = JSON.parse(fs.readFileSync(path.join(outDir, 'package.json'), 'utf8'));
const aliases = {};
for (const [subpath, condition] of Object.entries(pkg.exports)) {
  const target = typeof condition === 'string' ? condition : condition.import || condition.default;
  const specifier = subpath === '.' ? pkg.name : `${pkg.name}/${subpath.replace(/^\.\//, '')}`;
  aliases[`${specifier}$`] = path.join(outDir, target);
}

module.exports = {
  ...base,
  output: {
    ...base.output,
    path: path.resolve(__dirname, 'dist-packed'),
  },
  resolve: {
    ...base.resolve,
    alias: aliases,
  },
};
