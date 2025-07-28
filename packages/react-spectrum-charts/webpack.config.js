/*
 * Copyright 2023 Adobe. All rights reserved.
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

module.exports = {
  entry: {
    alpha: './src/alpha/index.ts',
    beta: './src/beta/index.ts',
    rc: './src/rc/index.ts',
    index: './src/index.ts',
  },
  mode: 'production',

  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist'),
    library: 'reactSpectrumCharts',
    libraryTarget: 'umd',
    globalObject: 'this',
    clean: true,
  },

  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/,
        exclude: /node_modules/,
        resolve: {
          extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
        },
        use: 'ts-loader',
      },
      {
        test: /\.(sa|sc|c)ss$/,
        use: ['style-loader', 'css-loader'],
        sideEffects: true,
      },
    ],
  },

  externals: [
    {
      '@spectrum-charts/constants': '@spectrum-charts/constants',
      '@spectrum-charts/locales': '@spectrum-charts/locales',
      '@spectrum-charts/utils': '@spectrum-charts/utils',
      '@spectrum-charts/themes': '@spectrum-charts/themes',
      '@spectrum-charts/vega-spec-builder': '@spectrum-charts/vega-spec-builder',
      '@adobe/react-spectrum': '@adobe/react-spectrum',
      react: 'react',
      'react-dom': 'react-dom',
      vega: 'vega',
      'vega-lite': 'vega-lite',
    },
    nodeExternals(),
  ],

  optimization: {
    minimize: process.env.NODE_ENV === 'development' ? false : true,
  },

  plugins: [new webpack.BannerPlugin(banner)],

  resolve: {
    extensions: ['.tsx', '.ts', '.js', '.jsx', '.svg', '.css', '.json'],
  },

  devServer: {
    client: {
      overlay: false,
    },
  },
};
