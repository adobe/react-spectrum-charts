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

/* eslint-disable react/prop-types -- story args are typed via StoryFn generics */
import { ComponentProps, ReactElement } from 'react';

import { StoryFn } from '@storybook/react';

import { Chart } from '../../../../Chart.js';
import { Axis, Legend, Line } from '../../../../components/index.js';
import useChartProps from '../../../../hooks/useChartProps.js';
import { bindWithProps } from '../../../../test-utils/index.js';
import { ChartProps } from '../../../../types/index.js';
import { paidSearchVisitsData, visitsByChannelData } from '../../lineData.js';
import { visitsProps } from '../lineStoryTemplates.js';

type DrawInArgs = ComponentProps<typeof Line> & { data: ChartProps['data'] };

export default {
  title: 'React Spectrum Charts 2/Line/Features/Draw In Animation',
  component: Line,
  argTypes: {
    data: { control: false },
  },
};

const DrawInStory: StoryFn<DrawInArgs> = ({ data, ...args }): ReactElement => {
  const chartProps = useChartProps({ data, width: 640, height: 400 });
  return (
    <Chart {...chartProps}>
      <Axis position="left" grid title="Visits" />
      <Axis position="bottom" labelFormat="time" baseline ticks />
      <Line {...args} />
      {args.color ? <Legend highlight /> : null}
    </Chart>
  );
};

const SingleSeries = bindWithProps(DrawInStory);
SingleSeries.args = { data: paidSearchVisitsData, dimension: 'datetime', metric: 'visits' };

const MultiSeries = bindWithProps(DrawInStory);
MultiSeries.args = { data: visitsByChannelData, ...visitsProps };

// Static points appear as the sweep reaches them.
const StaticPoints = bindWithProps(DrawInStory);
StaticPoints.args = { data: visitsByChannelData, ...visitsProps, staticPoint: 'hasEvent' };

export { SingleSeries, MultiSeries, StaticPoints };
