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
import { Axis, Line } from '../../../components';
import useChartProps from '../../../hooks/useChartProps';
import { workspaceTrendsData } from '../../../stories/data/data';
import { bindWithProps } from '../../../test-utils';
import { ChartProps } from '../../../types';

export default {
  title: 'React Spectrum Charts 2/Line/Features',
  component: Line,
};

const defaultChartProps: ChartProps = { data: workspaceTrendsData, minWidth: 400, maxWidth: 800, height: 400 };

const InterpolateLineStory: StoryFn<typeof Line> = (args): ReactElement => {
  const chartProps = useChartProps({
    ...defaultChartProps,
    data: workspaceTrendsData.filter((d) => d.series === 'Add Freeform table'),
  });
  return (
    <Chart {...chartProps}>
      <Axis position="left" grid title="Users" />
      <Axis position="bottom" labelFormat="time" baseline ticks />
      <Line {...args} />
    </Chart>
  );
};

const WithInterpolate = bindWithProps(InterpolateLineStory);
WithInterpolate.args = {
  name: 'line0',
  dimension: 'datetime',
  metric: 'value',
  scaleType: 'time',
  color: { value: 'categorical-100' },
  interpolate: 'step-after',
};

export { WithInterpolate };
