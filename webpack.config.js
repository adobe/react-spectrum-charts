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

import path from 'path';
import webpack from 'webpack';
import { cwd } from 'process';
import { merge } from 'webpack-merge';
import singleSpaDefaults from 'webpack-config-single-spa-react';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import TsconfigPathsPlugin from 'tsconfig-paths-webpack-plugin';

// get name and version from the package.json
import { readFileSync } from 'fs';
const { name, version } = JSON.parse(readFileSync(new URL('./package.json', import.meta.url)));
const banner = `${name}@v${version}`;

export default (env, argv) => {
	/**
	 * provides some basic configuration for a react app that can be loaded by single-spa
	 * any react app can be loaded by single-spa as long as the resulting module supports
	 * SystemJS interop, which this config does. so, you do not have to use this config,
	 * but if you do not, make sure that module can be loaded by SystemJS.
	 * https://github.com/systemjs/systemjs
	 * https://github.com/joeldenning/systemjs-webpack-interop
	 */

	const defaultConfig = singleSpaDefaults({
		orgName: 'aaui',
		projectName: 'prism',
		webpackConfigEnv: env,
		argv,
	});

	if (env?.target === 'cjs') {
		// if cjs, filter out the systemjsModuleName plugin
		defaultConfig.plugins = defaultConfig.plugins.filter((plugin) => !Boolean(plugin.options?.systemjsModuleName));
	}

	/** @type {import('webpack').Configuration} */
	const baseConfig = merge(defaultConfig, {
		// modify the webpack config however you'd like to by adding to this object
		entry: './src/index.ts',
		output: {
			// don't change this. currently the import map relies on this being the output filename
			path: path.join(cwd(), 'dist', getTargetPath(env?.target)),
			filename: 'app.module.js',
			libraryTarget: getLibraryTarget(env?.target),
			chunkLoadingGlobal: 'analyticsuiPrism',
		},
		// https://webpack.js.org/configuration/externals/
		// by default we set the prefix @aaui/ to be external.
		// this is so we can import any utility library from @aaui (like @aaui/core) at runtime
		// by default react and react-dom are externalized,
		// if you want to bundle your own version of react remove them from this list
		// to see the current version of react refer to the import map in root-config near this line:
		// https://git.corp.adobe.com/AnalyticsUI/root-config/blob/master/public/root-config-loader.js#L107
		externals: ['react', 'react-dom'],
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
			],
		},
		plugins: [new webpack.BannerPlugin(banner)],
		resolve: {
			plugins: [new TsconfigPathsPlugin({})],
			extensions: ['.tsx', '.ts', '.js', '.jsx', '.svg', '.css', '.json'],
		},
		devServer: {
			client: {
				overlay: false,
			},
		},
	});

	if (env?.prod) {
		// production customizations
		return merge(baseConfig, {
			plugins: [
				new HtmlWebpackPlugin({
					template: './src/index.html',
					inject: false,
				}),
			],
		});
	} else {
		// dev customizations
		return merge(baseConfig, {});
	}
};

function getTargetPath(target = 'mfe') {
	if (target === 'mfe') return '';
	else return target;
}

function getLibraryTarget(target = 'mfe') {
	switch (target) {
		default:
		case 'mfe':
			return 'system';
		case 'cjs':
			return 'commonjs';
	}
}
