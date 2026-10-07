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
module.exports = {
  extends: [
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react/jsx-runtime',
    'plugin:react-hooks/recommended',
  ],
  parser: '@typescript-eslint/parser',
  plugins: ['prettier', '@typescript-eslint', 'jest', 'jsdoc', 'react', 'header'],
  ignorePatterns: ['node_modules/', 'dist/', 'build/', 'coverage/', '**/intl/compiled/'],
  rules: {
    'react/jsx-uses-vars': 'error',
    'react/jsx-uses-react': 'error',
    '@typescript-eslint/no-non-null-assertion': 'error',
    'jest/no-focused-tests': 'error',
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': [
      'error',
      {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_',
      },
    ],
    'no-restricted-imports': [
      'error',
      {
        name: 'types',
        message: 'Please use relative path import for types instead (ex. ../types).',
      },
      {
        name: 'types/locales',
        message: 'Please use relative path import for types instead (ex. ../types/locales).',
      },
    ],
    'no-duplicate-imports': 'error',
    'header/header': [
      2,
      'block',
      [
        '',
        {
          pattern: ' \\* Copyright \\d{4} Adobe. All rights reserved.',
          template: ` * Copyright ${new Date().getFullYear()} Adobe. All rights reserved.`,
        },
        ' * This file is licensed to you under the Apache License, Version 2.0 (the "License");',
        ' * you may not use this file except in compliance with the License. You may obtain a copy',
        ' * of the License at http://www.apache.org/licenses/LICENSE-2.0',
        ' *',
        ' * Unless required by applicable law or agreed to in writing, software distributed under',
        ' * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS',
        ' * OF ANY KIND, either express or implied. See the License for the specific language',
        ' * governing permissions and limitations under the License.',
        ' ',
      ],
    ],
  },
  overrides: [
    {
      // ESM packages: Node requires fully specified relative imports. Fix with scripts/addRelativeImportExtensions.mjs.
      files: ['packages/{core-s2,schemas,react-spectrum-charts-s2,vega-spec-builder-s2}/**/*.{ts,tsx}'],
      rules: {
        'no-restricted-syntax': [
          'error',
          {
            selector:
              ':matches(ImportDeclaration, ExportNamedDeclaration, ExportAllDeclaration, ImportExpression) > Literal.source[value=/^\\.\\.?($|\\x2F)/]:not([value=/\\.(js|json|css)$/])',
            message: 'Relative imports in ESM packages must be fully specified (e.g. ./foo.js or ./dir/index.js).',
          },
        ],
        'no-restricted-imports': [
          'error',
          {
            paths: [
              { name: 'types', message: 'Please use relative path import for types instead (ex. ../types).' },
              {
                name: 'types/locales',
                message: 'Please use relative path import for types instead (ex. ../types/locales).',
              },
            ],
            patterns: [
              {
                group: [
                  '@spectrum-charts/constants',
                  '@spectrum-charts/constants/*',
                  '@spectrum-charts/themes',
                  '@spectrum-charts/themes/*',
                  '@spectrum-charts/utils',
                  '@spectrum-charts/utils/*',
                  '@spectrum-charts/locales',
                  '@spectrum-charts/locales/*',
                  '@spectrum-charts/vega-spec-builder',
                  '@spectrum-charts/vega-spec-builder/*',
                  '@adobe/react-spectrum-charts',
                  '@adobe/react-spectrum-charts/*',
                ],
                message:
                  'S2 packages must not import S1 packages. Use @spectrum-charts/core-s2/{constants,tokens,utils,locales} instead.',
              },
            ],
          },
        ],
      },
    },
    {
      // S2 publish closure: circular imports are not allowed. Type-definition folders hold recursive types.
      files: [
        'packages/{core-s2,schemas,react-spectrum-charts-s2,vega-spec-builder-s2}/**/*.{ts,tsx}',
      ],
      excludedFiles: ['**/src/types/**'],
      plugins: ['import'],
      settings: {
        'import/parsers': { '@typescript-eslint/parser': ['.ts', '.tsx'] },
        'import/resolver': { typescript: { alwaysTryTypes: true } },
      },
      rules: {
        'import/no-cycle': ['error', { ignoreExternal: true }],
      },
    },
  ],
};
