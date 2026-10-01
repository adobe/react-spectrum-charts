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
import { action } from 'storybook/actions';

import { ChartActionBar } from '../../../../components';
import { bindWithProps } from '../../../../test-utils';
import {
  ActionBarLineStory,
  StoryWithParameters,
  actionBarContent,
  setControlInclude,
} from '../ChartActionBarStoryUtils';

export default {
  title: 'React Spectrum Charts 2/Chart Action Bar/Features/Action Handlers',
  component: ChartActionBar,
};

// Fires when the bar closes and the point selection is cleared.
const OnClearSelection = bindWithProps(ActionBarLineStory);
OnClearSelection.args = { children: actionBarContent, onClearSelection: action('onClearSelection') };
setControlInclude(OnClearSelection as StoryWithParameters, []);

export { OnClearSelection };
