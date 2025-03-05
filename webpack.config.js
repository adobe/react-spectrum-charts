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
	entry: path.resolve(__dirname, `packages/${packageName}/src/index.tsx`),
	mode: 'development',

	output: {
		filename: '[name].js',
		path: path.resolve(__dirname, 'dist'),
		library: 'reactSpectrumCharts',
		libraryTarget: 'umd',
		globalObject: 'this',
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

	externals: [nodeExternals()],

	optimization: {
		minimize: process.env.NODE_ENV === 'development' ? false : true,
	},

	plugins: [new webpack.BannerPlugin(banner)],

	resolve: {
		alias: {
			'@constants': path.resolve(__dirname, 'packages/react-spectrum-charts/src/constants.ts'),
			'@components': path.resolve(__dirname, 'packages/react-spectrum-charts/src/components/'),
			'@hooks': path.resolve(__dirname, 'packages/react-spectrum-charts/src/hooks/'),
			'@locales': path.resolve(__dirname, 'packages/react-spectrum-charts/src/locales/'),
			'@matchMediaMock': path.resolve(
				__dirname,
				'packages/react-spectrum-charts/src/test-utils/__mocks__/matchMedia.mock.js'
			),
			'@rsc': path.resolve(__dirname, 'packages/react-spectrum-charts/src/'),
			'@rsc/alpha': path.resolve(__dirname, 'packages/react-spectrum-charts/src/alpha/'),
			'@rsc/beta': path.resolve(__dirname, 'packages/react-spectrum-charts/src/beta/'),
			'@rsc/rc': path.resolve(__dirname, 'packages/react-spectrum-charts/src/rc/'),
			'@specBuilder': path.resolve(__dirname, 'packages/react-spectrum-charts/src/specBuilder/'),
			'@stories': path.resolve(__dirname, 'packages/react-spectrum-charts/src/stories/'),
			'@svgPaths': path.resolve(__dirname, 'packages/react-spectrum-charts/src/svgPaths.ts'),
			'@test-utils': path.resolve(__dirname, 'packages/react-spectrum-charts/src/test-utils/'),
			'@themes': path.resolve(__dirname, 'packages/react-spectrum-charts/src/themes/'),
			'@utils': path.resolve(__dirname, 'packages/react-spectrum-charts/src/utils/'),
		},
		extensions: ['.tsx', '.ts', '.js', '.jsx', '.svg', '.css', '.json'],
	},

	devServer: {
		client: {
			overlay: false,
		},
	},
};
