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

import { Chart } from '../../../index.js';
import { chartEngagementData } from '../../../storyShared/data/data.js';
import { bindWithProps } from '../../../test-utils/index.js';
import { ChartLineStory, StoryWithParameters, setControlInclude } from '../chartStoryTemplates.js';

export default {
  title: 'React Spectrum Charts 2/Chart/Features/Action Handlers',
  component: Chart,
};

const OnVegaViewReady = bindWithProps(ChartLineStory);
OnVegaViewReady.args = {
  data: chartEngagementData,
  onVegaViewReady: (view) => action('onVegaViewReady')({ width: view.width(), height: view.height() }),
};
setControlInclude(OnVegaViewReady as StoryWithParameters, []);

export { OnVegaViewReady };
