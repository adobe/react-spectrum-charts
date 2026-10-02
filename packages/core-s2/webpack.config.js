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
const webpack = require('webpack');
const nodeExternals = require('webpack-node-externals');

const { name, version } = require('./package.json');

const banner = `${name}@v${version}`;
const srcDir = path.resolve(__dirname, 'src');
const subpaths = ['constants', 'locales', 'tokens', 'utils'];

/** Externalizes imports of a sibling subpath (e.g. tokens -> ../constants) so each subpath is bundled once. */
const externalizeSiblingSubpaths = ({ context, request }, callback) => {
  if (!request.startsWith('.')) return callback();
  const target = path.relative(srcDir, path.resolve(context, request));
  const source = path.relative(srcDir, context).split(path.sep)[0];
  if (subpaths.includes(target) && target !== source) {
    return callback(null, `${name}/${target}`);
  }
  callback();
};

module.exports = {
  entry: Object.fromEntries(subpaths.map((subpath) => [subpath, `./src/${subpath}/index.ts`])),
  mode: 'production',

  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist'),
    library: ['spectrumChartsCoreS2', '[name]'],
    libraryTarget: 'umd',
    globalObject: 'this',
    clean: true,
  },

  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/,
        exclude: /node_modules/,
        use: 'ts-loader',
      },
    ],
  },

  externals: [nodeExternals(), externalizeSiblingSubpaths],

  optimization: {
    minimize: process.env.NODE_ENV === 'development' ? false : true,
  },

  plugins: [new webpack.BannerPlugin(banner)],

  resolve: {
    extensions: ['.tsx', '.ts', '.js', '.jsx', '.json'],
  },

  devtool: 'source-map',
};
