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

module.exports = {
	collectCoverage: true,
	coverageReporters: ['cobertura', 'html', 'text', 'lcov'],
	moduleNameMapper: {
		'\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$':
			'<rootDir>/__mocks__/fileMock.ts',
		'\\.(css)$': 'identity-obj-proxy',
		'^.+\\.(css|less|scss)$': 'babel-jest',
		'^d3-format$': '<rootDir>/../../node_modules/d3-format/dist/d3-format.js',
	},
	setupFilesAfterEnv: ['@testing-library/jest-dom', 'jest-canvas-mock'],
	testEnvironment: '../../jest.environment.js',
	testMatch: ['<rootDir>/src/**/*.test.{js,jsx,ts,tsx}', '<rootDir>/src/**/*.spec.{js,jsx,ts,tsx}'],
	testResultsProcessor: 'jest-sonar-reporter',
	transform: {
		'^.+\\.(j|t)sx?$': 'babel-jest',
	},
};
