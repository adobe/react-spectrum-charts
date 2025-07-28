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
  ignorePatterns: ['node_modules/', 'dist/', 'build/', 'coverage/'],
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
};
