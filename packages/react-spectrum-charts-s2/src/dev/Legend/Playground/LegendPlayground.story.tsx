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

import { Chart } from '../../../Chart';
import { Axis, Legend, Line } from '../../../components';
import useChartProps from '../../../hooks/useChartProps';
import { bindWithProps } from '../../../test-utils';
import { LegendProps } from '../../../types';
import { workspaceTrendsData } from '../../../stories/data/data';

export default { title: 'React Spectrum Charts 2/Legend/Playground', component: Legend };

const LegendPlaygroundStory: StoryFn<typeof Legend> = (args): ReactElement => {
  const chartProps = useChartProps({ data: workspaceTrendsData, height: 360, maxWidth: 720 });
  return (
    <Chart {...chartProps}>
      <Axis position="bottom" labelFormat="time" />
      <Axis position="left" grid />
      <Line dimension="datetime" metric="value" color="series" />
      <Legend {...args} />
    </Chart>
  );
};

export const Playground = bindWithProps(LegendPlaygroundStory);
Playground.args = { color: 'series', title: 'Event', highlight: true } satisfies LegendProps;
