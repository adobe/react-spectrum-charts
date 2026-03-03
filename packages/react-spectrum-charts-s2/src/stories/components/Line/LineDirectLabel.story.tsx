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
import { Axis, ChartTooltip, Legend, Line, LineDirectLabel } from '../../../components';
import useChartProps from '../../../hooks/useChartProps';
import { workspaceTrendsData } from '../../../stories/data/data';
import { bindWithProps } from '../../../test-utils';
import { ChartProps } from '../../../types';

export default {
  title: 'RSC/Line/LineDirectLabel',
  component: LineDirectLabel,
  argTypes: {
    value: {
      control: { type: 'select' },
      options: ['last', 'average', 'series'],
    },
    position: {
      control: { type: 'select' },
      options: ['start', 'end'],
    },
  },
};

const defaultChartProps: ChartProps = {
  data: workspaceTrendsData,
  minWidth: 400,
  maxWidth: 800,
  height: 400,
  backgroundColor: 'gray-50',
};

const LineDirectLabelStory: StoryFn<typeof LineDirectLabel> = (args): ReactElement => {
  const chartProps = useChartProps(defaultChartProps);
  return (
    <Chart {...chartProps} debug>
      <Axis position="left" grid title="Users" />
      <Axis position="bottom" labelFormat="time" baseline ticks />
      <Line dimension="datetime" metric="users" color="series" scaleType="time">
        <LineDirectLabel {...args} />
      </Line>
      <Legend highlight />
    </Chart>
  );
};

const Default = bindWithProps(LineDirectLabelStory);
Default.args = { value: 'series' };

const ValueLast = bindWithProps(LineDirectLabelStory);
ValueLast.args = { value: 'last' };


const ValueAverage = bindWithProps(LineDirectLabelStory);
ValueAverage.args = { value: 'average' };

const WithTooltipStory: StoryFn<typeof LineDirectLabel> = (args): ReactElement => {
	const chartProps = useChartProps(defaultChartProps);
	return (
		<Chart {...chartProps} debug>
			<Axis position="left" grid title="Users" />
			<Axis position="bottom" labelFormat="time" baseline ticks />
			<Line dimension="datetime" metric="users" color="series" scaleType="time">
				<LineDirectLabel {...args} />
				<ChartTooltip>
					{(datum: Record<string, string>) => <div>{datum.users}</div>}
				</ChartTooltip>
			</Line>
			<Legend highlight />
		</Chart>
	);
};

const WithTooltip = bindWithProps(WithTooltipStory);
WithTooltip.args = { value: 'last' };

const twoSeriesData = workspaceTrendsData
	.filter((d) => d.series === 'Add Freeform table' || d.series === 'Add Fallout')
	.map((d) => (d.series === 'Add Fallout' ? { ...d, users: d.users + 4000 } : d));

const TwoSeriesStory: StoryFn<typeof LineDirectLabel> = (args): ReactElement => {
	const chartProps = useChartProps({ ...defaultChartProps, data: twoSeriesData });
	return (
		<Chart {...chartProps} debug>
			<Axis position="left" grid title="Users" />
			<Axis position="bottom" labelFormat="time" baseline ticks />
			<Line dimension="datetime" metric="users" color="series" scaleType="time">
				<LineDirectLabel {...args} />
			</Line>
			<Legend highlight />
		</Chart>
	);
};

const TwoSeries = bindWithProps(TwoSeriesStory);
TwoSeries.args = { value: 'last' };

const PositionStart = bindWithProps(LineDirectLabelStory);
PositionStart.args = { value: 'series', position: 'start' };

export { Default, PositionStart, TwoSeries, ValueAverage, ValueLast, WithTooltip };
