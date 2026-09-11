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

const fixturesDir = path.resolve(__dirname, 'fixtures');
const entry = fs
  .readdirSync(fixturesDir)
  .filter((file) => file.endsWith('.tsx'))
  .reduce((entries, file) => {
    entries[file.replace(/\.tsx$/, '')] = path.join(fixturesDir, file);
    return entries;
  }, {});

module.exports = {
  entry,
  mode: 'production',

  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist'),
    clean: true,
  },

  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/,
        exclude: /node_modules/,
        use: { loader: 'ts-loader', options: { transpileOnly: true } },
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },

  resolve: {
    extensions: ['.tsx', '.ts', '.js', '.jsx'],
  },

  // Deliberately no `externals` here. Every other build in this repo externalizes
  // peer dependencies (react, vega, vega-lite, @react-spectrum/s2) because that's
  // correct for a published library. This config exists to answer a different
  // question: what does a brand-new consumer's bundle actually grow by when they
  // add this package, assuming they have none of those peers for any other reason.
  // Each fixture is a standalone entry, so its output size is that fixture's full
  // transitive cost in isolation, not shared with the other fixtures.
  devtool: false,
};
