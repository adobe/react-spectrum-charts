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

/**
 * Local approximation of the SonarCloud "Sonar way" TypeScript profile, limited to rules that have
 * fired on this repo. Each rule is tagged with its SonarCloud key. Run via `yarn lint:sonar`.
 */
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
    ecmaFeatures: { jsx: true },
  },
  // react-hooks and jest are loaded only so existing eslint-disable comments resolve.
  plugins: ['sonarjs', '@typescript-eslint', 'unicorn', 'react', 'react-hooks', 'jsx-a11y', 'jest'],
  settings: { react: { version: 'detect' } },
  // Mirrors sonar.exclusions in sonar-project.properties.
  ignorePatterns: [
    'node_modules/',
    'dist/',
    'build/',
    'coverage/',
    'packages/docs/**',
    'packages/docs-s2/**',
    '**/test-utils/**',
    '*.js',
    '*.cjs',
  ],
  rules: {
    'sonarjs/no-nested-conditional': 'error', // S3358
    'sonarjs/cognitive-complexity': ['error', 15], // S3776
    'sonarjs/no-redundant-optional': 'error', // S4782
    'sonarjs/todo-tag': 'error', // S1135
    'sonarjs/no-nested-template-literals': 'error', // S4624
    'sonarjs/reduce-initial-value': 'error', // S6959
    'sonarjs/regex-complexity': 'error', // S5843
    'sonarjs/slow-regex': 'error', // S5852
    'sonarjs/no-globals-shadowing': 'error', // S2137
    'sonarjs/deprecation': 'error', // S1874
    'sonarjs/no-ignored-exceptions': 'error', // S2486
    'sonarjs/no-identical-functions': 'error', // S4144
    'max-params': ['error', 7], // S107

    '@typescript-eslint/no-base-to-string': 'error', // S6551
    '@typescript-eslint/no-floating-promises': 'error', // S9383
    '@typescript-eslint/no-redundant-type-constituents': 'error', // S6571
    '@typescript-eslint/require-await': 'error', // S7503
    '@typescript-eslint/prefer-optional-chain': 'error', // S6582
    '@typescript-eslint/no-empty-function': ['error', { allow: ['arrowFunctions'] }], // S1186

    'unicorn/prefer-at': 'error', // S7755
    'unicorn/prefer-native-coercion-functions': 'error', // S7770
    'unicorn/prefer-array-some': 'error', // S7754
    'unicorn/prefer-number-properties': 'error', // S7773
    'unicorn/no-useless-fallback-in-spread': 'error', // S7744
    'unicorn/no-abusive-eslint-disable': 'error', // S7724

    'react/no-unused-prop-types': 'error', // S6767
    'jsx-a11y/prefer-tag-over-role': 'error', // S6819
  },
};
