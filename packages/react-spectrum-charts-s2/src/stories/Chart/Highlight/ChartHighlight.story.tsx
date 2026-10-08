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
import { Chart } from '../../../index.js';
import { chartEngagementData } from '../../../storyShared/data/data.js';
import { bindWithProps } from '../../../test-utils/index.js';
import { ChartBarInspectStory, ChartLineStory, StoryWithParameters, setControlInclude } from '../chartStoryTemplates.js';

export default {
  title: 'React Spectrum Charts 2/Chart/Features/Highlight',
  component: Chart,
  argTypes: {
    hiddenSeries: { control: 'object' },
  },
};

const HiddenSeries = bindWithProps(ChartLineStory);
HiddenSeries.args = { data: chartEngagementData, hiddenSeries: ['Expansion'] };
setControlInclude(HiddenSeries as StoryWithParameters, ['hiddenSeries']);

const HighlightedItem = bindWithProps(ChartBarInspectStory);
HighlightedItem.args = { data: chartEngagementData, highlightedItem: 15 };
setControlInclude(HighlightedItem as StoryWithParameters, ['highlightedItem']);

const HighlightedSeries = bindWithProps(ChartLineStory);
HighlightedSeries.args = { data: chartEngagementData, highlightedSeries: 'Retention' };
setControlInclude(HighlightedSeries as StoryWithParameters, ['highlightedSeries']);

export { HiddenSeries, HighlightedItem, HighlightedSeries };
