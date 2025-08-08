/*
 * Copyright 2025 Adobe. All rights reserved.
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
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function getGitUser() {
  try {
    const email = execSync('git config user.email', { encoding: 'utf8' }).trim();
    const emailPrefix = email.split('@')[0];

    // Handle GitHub noreply email format: "12345678+username"
    if (emailPrefix.includes('+')) {
      return emailPrefix.split('+')[1];
    }

    return emailPrefix;
  } catch (error) {
    return null;
  }
}

function getRootPackageJson() {
  try {
    const rootPackagePath = path.resolve(__dirname, 'package.json');
    const rootPackage = JSON.parse(fs.readFileSync(rootPackagePath, 'utf8'));
    return rootPackage;
  } catch (error) {
    return {};
  }
}

module.exports = function generate(plop) {
  plop.setGenerator('package', {
    description: 'Create a new package in the monorepo',
    prompts: [
      {
        type: 'input',
        name: 'name',
        message: 'What is the name of the package? (without @spectrum-charts/ prefix)',
        validate: (input) => {
          if (!input) return 'Package name is required';
          if (input.includes(' ')) return 'Package name cannot contain spaces';
          if (!/^[a-z0-9-]+$/.test(input)) return 'Package name must be lowercase letters, numbers, and hyphens only';
          return true;
        },
      },
      {
        type: 'input',
        name: 'description',
        message: 'Package description:',
        default: (answers) => `Package for ${answers.name}`,
      },
      {
        type: 'confirm',
        name: 'useGitUser',
        message: () => `Use git user "${getGitUser()}" as author?`,
        default: true,
        when: () => getGitUser() !== null,
      },
      {
        type: 'input',
        name: 'author',
        message: 'Author name:',
        default: () => getGitUser() || undefined,
        validate: (input) => (input ? true : 'Author name is required'),
        when: (answers) => getGitUser() === null || !answers.useGitUser,
      },
      {
        type: 'confirm',
        name: 'isReactPackage',
        message: 'Is this a React package?',
        default: false,
      },
      {
        type: 'confirm',
        name: 'includeInternalDeps',
        message: 'Include common @spectrum-charts dependencies?',
        default: false,
      },
    ],
    actions: (data) => {
      if (data.useGitUser) {
        data.author = getGitUser();
      }

      // Add root package info for templates
      const rootPackage = getRootPackageJson();
      data.rootVersion = rootPackage.version || '1.18.2';
      data.devDependencies = rootPackage.devDependencies || {};
      data.reactVersion = rootPackage.devDependencies?.react || '>= 17.0.2';

      const actions = [
        {
          type: 'add',
          path: 'packages/{{name}}/package.json',
          templateFile: data.isReactPackage
            ? 'templates/package/package-react.json.hbs'
            : 'templates/package/package.json.hbs',
        },
        {
          type: 'add',
          path: 'packages/{{name}}/webpack.config.js',
          templateFile: data.isReactPackage
            ? 'templates/package/webpack-react.config.js.hbs'
            : 'templates/package/webpack.config.js.hbs',
        },
        {
          type: 'add',
          path: 'packages/{{name}}/tsconfig.json',
          templateFile: 'templates/package/tsconfig.json.hbs',
        },
        {
          type: 'add',
          path: 'packages/{{name}}/LICENSE',
          templateFile: 'templates/package/LICENSE.hbs',
        },
        {
          type: 'add',
          path: 'packages/{{name}}/README.md',
          templateFile: 'templates/package/README.md.hbs',
        },
        {
          type: 'add',
          path: 'packages/{{name}}/index.ts',
          templateFile: 'templates/package/index.ts.hbs',
        },
        {
          type: 'add',
          path: 'packages/{{name}}/src/index.ts',
          templateFile: 'templates/package/src-index.ts.hbs',
        },
      ];

      return actions;
    },
  });
};
