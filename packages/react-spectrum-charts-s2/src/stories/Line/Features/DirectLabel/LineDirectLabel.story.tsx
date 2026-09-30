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
import { Axis, Legend, Line, LineDirectLabel } from '../../../../components';
import useChartProps from '../../../../hooks/useChartProps';
import { workspaceTrendsData } from '../../../../stories/data/data';
import { bindWithProps } from '../../../../test-utils';
import { ChartProps } from '../../../../types';

export default {
  title: 'React Spectrum Charts 2/Line/Features/Direct Label',
  component: LineDirectLabel,
  parameters: { controls: { include: ['value', 'position', 'fontSize', 'excludeSeries'] } },
  argTypes: {
    value: {
      control: { type: 'select' },
      options: ['last', 'average', 'series'],
    },
    position: {
      control: { type: 'select' },
      options: ['start', 'end'],
    },
    fontSize: { control: { type: 'number' } },
  },
};

const defaultChartProps: ChartProps = { data: workspaceTrendsData, minWidth: 100, maxWidth: 1000, height: 400, backgroundColor: 'gray-50' };

// TEMPLATES

const LineDirectLabelStory: StoryFn<typeof LineDirectLabel> = (args): ReactElement => {
  const chartProps = useChartProps(defaultChartProps);
  return (
    <Chart {...chartProps}>
      <Axis position="left" grid title="Users" />
      <Axis position="bottom" labelFormat="time" baseline ticks />
      <Line dimension="datetime" metric="users" color="series" scaleType="time">
        <LineDirectLabel {...args} />
      </Line>
      <Legend highlight />
    </Chart>
  );
};

const DirectLabelDefault = bindWithProps(LineDirectLabelStory);
DirectLabelDefault.args = { value: 'series' };

export { DirectLabelDefault };
