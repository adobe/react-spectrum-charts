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

import { Chart } from '../../../../Chart';
import { Axis, Legend, Line } from '../../../../components';
import { workspaceTrendsData } from '../../../../stories/data/data';
import { bindWithProps } from '../../../../test-utils';
import { ChartProps } from '../../../../types';

type StoryWithParameters = { parameters?: { controls: { include: string[] } } };

const setControlInclude = (story: StoryWithParameters, include: string[]) => {
  story.parameters = { controls: { include } };
};

export default {
  title: 'React Spectrum Charts 2/Chart/Features/ChartSize',
  component: Chart,
  parameters: { controls: { include: ['height', 'maxWidth', 'minWidth', 'width'] } },
};

const defaultArgs: ChartProps = { data: workspaceTrendsData, width: 600, height: 300, minWidth: 300, maxWidth: 1000 };

const ResponsiveSizeStory: StoryFn<typeof Chart> = (args): ReactElement => (
  <Chart {...args}>
    <Axis position="bottom" baseline ticks labelFormat="time" />
    <Axis position="left" grid title="Events" />
    <Line dimension="datetime" metric="value" color="series" scaleType="time" />
    <Legend highlight />
  </Chart>
);

const ResponsiveSize = bindWithProps(ResponsiveSizeStory);
ResponsiveSize.args = defaultArgs;
setControlInclude(ResponsiveSize as StoryWithParameters, ['height', 'maxWidth', 'minWidth', 'width']);

export { ResponsiveSize };
