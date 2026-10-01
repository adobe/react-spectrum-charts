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
import { ReactElement } from 'react';

import { StoryFn } from '@storybook/react';

import useChartProps from '../../../hooks/useChartProps';
import { Axis, Bar, Chart, Legend } from '../../../index';
import { chartEngagementData } from '../../../storyShared/data/data';
import { bindWithProps } from '../../../test-utils';
import { ChartBarStory, ChartLineStory, StoryWithParameters, setControlInclude } from '../chartStoryTemplates';

export default {
  title: 'React Spectrum Charts 2/Chart/Features/Size',
  component: Chart,
};

const ChartPanelStory: StoryFn<typeof Chart> = (args): ReactElement => {
  const props = useChartProps(args);
  return (
    <div style={{ height: 480 }}>
      <Chart {...props}>
        <Axis position="bottom" baseline title="Month" />
        <Axis position="left" grid title="Accounts" />
        <Bar dimension="x" metric="y" color="series" />
        <Legend highlight />
      </Chart>
    </div>
  );
};

// Height is a percentage of the 480px dashboard panel, clamped by minHeight / maxHeight.
const Height = bindWithProps(ChartPanelStory);
Height.args = { data: chartEngagementData, height: '75%', minHeight: 300, maxHeight: 600 };
setControlInclude(Height as StoryWithParameters, ['height', 'maxHeight', 'minHeight']);

const Padding = bindWithProps(ChartLineStory);
Padding.args = { data: chartEngagementData, backgroundColor: 'gray-100', padding: 40 };
setControlInclude(Padding as StoryWithParameters, ['padding']);

const Width = bindWithProps(ChartBarStory);
Width.args = { data: chartEngagementData, width: '50%', minWidth: 400, maxWidth: 800 };
setControlInclude(Width as StoryWithParameters, ['maxWidth', 'minWidth', 'width']);

export { Height, Padding, Width };
