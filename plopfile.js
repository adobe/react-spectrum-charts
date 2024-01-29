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

module.exports = function generate(plop) {
	plop.setGenerator('component', {
		description: 'Create a new React component',
		prompts: [
			{
				type: 'input',
				name: 'name',
				message: 'What is the name of the component?',
			},
		],
		actions: [
			{
				type: 'add',
				path: 'src/components/{{name}}/index.ts',
				templateFile: 'templates/index.hbs',
			},
			{
				type: 'add',
				path: 'src/components/{{name}}/{{name}}.tsx',
				templateFile: 'templates/component.hbs',
			},
			{
				type: 'add',
				path: 'src/stories/components/{{name}}/{{name}}.test.tsx',
				templateFile: 'templates/test.hbs',
			},
			{
				type: 'add',
				path: 'src/stories/components/{{name}}/{{name}}.story.tsx',
				templateFile: 'templates/story.hbs',
			},
			{
				type: 'append',
				path: 'src/index.ts',
				template: "export * from './components/{{name}}';",
			},
		],
	});
};
