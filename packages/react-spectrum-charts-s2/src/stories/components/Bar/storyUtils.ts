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
import type { ArgTypes, StoryFn } from '@storybook/react';

import { bindWithProps } from '../../../test-utils/index.js';

type StoryConfig = { parameters?: { controls: { include: string[] } }; argTypes?: Partial<ArgTypes> };

/**
 * Binds a story template like `bindWithProps`, but also allows `parameters` and `argTypes` to be set.
 * @param template
 * @returns bound story
 */
export const bindStory = <T,>(template: StoryFn<T>) =>
  bindWithProps(template) as ReturnType<typeof bindWithProps<T>> & StoryConfig;
