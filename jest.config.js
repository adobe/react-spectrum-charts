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
const { pathsToModuleNameMapper } = require('ts-jest');
const { compilerOptions } = require('./tsconfig.json');

module.exports = {
	testResultsProcessor: 'jest-sonar-reporter',
	collectCoverage: true,
	coverageReporters: ['cobertura', 'html', 'text', 'lcov'],
	testEnvironment: './jest.environment.js',
	transform: {
		'^.+\\.(j|t)sx?$': 'babel-jest',
	},
	moduleDirectories: ['packages', 'node_modules'],
	moduleNameMapper: {
		'\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$':
			'<rootDir>/__mocks__/fileMock.ts',
		'\\.(css)$': 'identity-obj-proxy',
		'single-spa-react/parcel': 'single-spa-react/lib/cjs/parcel.cjs',
		'^.+\\.(css|less|scss)$': 'babel-jest',
		'^d3-format$': '<rootDir>/node_modules/d3-format/dist/d3-format.js',
		...pathsToModuleNameMapper(compilerOptions.paths),
	},
	setupFilesAfterEnv: ['@testing-library/jest-dom', 'jest-canvas-mock'],
	testMatch: [
		'<rootDir>/packages/*/src/**/*.test.{js,jsx,ts,tsx}',
		'<rootDir>/packages/*/src/**/*.spec.{js,jsx,ts,tsx}',
	],
	testPathIgnorePatterns: ['/node_modules/', '/dist/', '/build/', '/coverage/'],
	transformIgnorePatterns: [
		'/node_modules/(?!(@adobe/react-spectrum|@react-spectrum|@spectrum-icons|@internationalized|@react-types|@react-stately|@react-aria|@babel/runtime)/)',
	],
};
