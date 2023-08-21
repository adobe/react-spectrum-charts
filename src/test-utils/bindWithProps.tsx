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

import { ArgsStoryFn } from '@storybook/csf';
import { ReactFramework, Story } from '@storybook/react';

type StoryArgsTypes<T> = T extends ArgsStoryFn<ReactFramework, infer Return> ? Return : T;

type RequiredProps<T> = Story<T> & { args: T };

/**
 * Will make the props in a story required (by default Storybook makes all props optional).
 * Useful for testing a component with props.
 *
 * Usage: `const CustomStory = bindWithProps(TemplateStory);`
 * @param template: Story to bind.
 */
function bindWithProps<T>(template: Story<T>) {
	return template.bind({}) as RequiredProps<StoryArgsTypes<typeof template>>;
}

export { bindWithProps };
