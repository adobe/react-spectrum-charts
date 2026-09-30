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

import { s2Categorical12 } from '@spectrum-charts/themes';
import { Datum } from '@spectrum-charts/vega-spec-builder-s2';

import { Chart } from '../../../Chart';
import { Axis, Bar, Legend, Line } from '../../../components';
import { ChartInspect } from '../../../components/ChartInspect';
import useChartProps from '../../../hooks/useChartProps';
import { browserData } from '../../../stories/data/data';
import { formatTimestamp } from '../../../stories/storyUtils';
import { bindWithProps } from '../../../test-utils';

type StoryWithParameters = { parameters?: { controls: { include: string[] } } };

const setControlInclude = (story: StoryWithParameters, include: string[]) => {
  story.parameters = { controls: { include } };
};

export default {
  title: 'React Spectrum Charts 2/Chart Inspect/Features',
  component: ChartInspect,
  parameters: { controls: { include: ['excludeDataKeys', 'highlightBy'] } },
  argTypes: {
    children: {
      description: '`(datum) => React.ReactElement`',
      control: {
        type: null,
      },
    },
  },
};

const barData = browserData.map((datum) =>
  datum.category === 'Chrome' ? { ...datum, excludeFromInspect: true } : datum
);

const StackedBarInspectStory: StoryFn<typeof ChartInspect> = (args): ReactElement => {
  const chartProps = useChartProps({ data: barData, width: 600 });
  return (
    <Chart {...chartProps}>
      <Axis position="bottom" baseline title="Browser" />
      <Axis position="left" grid title="Users" />
      <Bar color="series" type="stacked">
        <ChartInspect {...args} />
      </Bar>
      <Legend highlight />
    </Chart>
  );
};

const DodgedBarInspectStory: StoryFn<typeof ChartInspect> = (args): ReactElement => {
  const chartProps = useChartProps({ data: barData, width: 600 });
  return (
    <Chart {...chartProps}>
      <Axis position="bottom" baseline title="Browser" />
      <Axis position="left" grid title="Users" />
      <Bar type="dodged" color="series">
        <ChartInspect {...args} />
      </Bar>
      <Legend highlight />
    </Chart>
  );
};

const lineData = [
  { datetime: 1667890800000, point: 1, value: 738, users: 477, series: 'Add Fallout' },
  { datetime: 1667977200000, point: 2, value: 704, users: 481, series: 'Add Fallout' },
  { datetime: 1668063600000, point: 3, value: 730, users: 483, series: 'Add Fallout' },
  { datetime: 1668150000000, point: 4, value: 465, users: 310, series: 'Add Fallout' },
  { datetime: 1668236400000, point: 5, value: 31, users: 18, series: 'Add Fallout' },
  { datetime: 1668322800000, point: 8, value: 108, users: 70, series: 'Add Fallout' },
  { datetime: 1668409200000, point: 12, value: 648, users: 438, series: 'Add Fallout' },
  { datetime: 1667890800000, point: 4, value: 12208, users: 5253, series: 'Add Freeform table' },
  { datetime: 1667977200000, point: 5, value: 11309, users: 5103, series: 'Add Freeform table' },
  { datetime: 1668063600000, point: 17, value: 11099, users: 5047, series: 'Add Freeform table' },
  { datetime: 1668150000000, point: 20, value: 7243, users: 3386, series: 'Add Freeform table' },
  { datetime: 1668236400000, point: 21, value: 395, users: 205, series: 'Add Freeform table' },
  { datetime: 1668322800000, point: 22, value: 1606, users: 790, series: 'Add Freeform table' },
  { datetime: 1668409200000, point: 25, value: 10932, users: 4913, series: 'Add Freeform table' },
];

const disabledLineData = lineData.map((datum) =>
  datum.series === 'Add Fallout' ? { ...datum, excludeFromInspect: true } : datum
);

const LineInspectStory: StoryFn<typeof ChartInspect> = (args): ReactElement => {
  const chartProps = useChartProps({ data: lineData, width: 600 });
  return (
    <Chart {...chartProps}>
      <Axis position="bottom" baseline ticks labelFormat="time" />
      <Axis position="left" grid title="Events" />
      <Line color="series">
        <ChartInspect {...args} />
      </Line>
      <Legend highlight />
    </Chart>
  );
};

const DisabledSeriesLineInspectStory: StoryFn<typeof ChartInspect> = (args): ReactElement => {
  const chartProps = useChartProps({ data: disabledLineData, width: 600, colors: ['gray-300', ...s2Categorical12] });
  return (
    <Chart {...chartProps}>
      <Axis position="bottom" baseline ticks labelFormat="time" />
      <Axis position="left" grid title="Events" />
      <Line color="series">
        <ChartInspect {...args} />
      </Line>
      <Legend highlight />
    </Chart>
  );
};

interface LineData extends Datum {
  datetime?: number;
  point?: number;
  value?: number;
  users?: number;
  series?: string;
  category?: string;
}

const StackedBarChart = bindWithProps(StackedBarInspectStory);
setControlInclude(StackedBarChart as StoryWithParameters, ['highlightBy']);
StackedBarChart.args = {
  children: (datum: LineData) => (
    <div className="bar-inspect">
      <div>Operating system: {datum.series}</div>
      <div>Browser: {datum.category}</div>
      <div>Users: {datum.value}</div>
    </div>
  ),
};

const DodgedBarChart = bindWithProps(DodgedBarInspectStory);
setControlInclude(DodgedBarChart as StoryWithParameters, ['highlightBy']);
DodgedBarChart.args = {
  children: (datum: LineData) => (
    <div className="bar-inspect">
      <div>Operating system: {datum.series}</div>
      <div>Browser: {datum.category}</div>
      <div>Users: {datum.value}</div>
    </div>
  ),
};

const LineChart = bindWithProps(LineInspectStory);
setControlInclude(LineChart as StoryWithParameters, ['highlightBy']);
LineChart.args = {
  children: (datum: LineData) => (
    <div className="bar-inspect">
      <div>{formatTimestamp(datum.datetime as number)}</div>
      <div>Event: {datum.series}</div>
      <div>Count: {Number(datum.value).toLocaleString()}</div>
      <div>Users: {Number(datum.users).toLocaleString()}</div>
    </div>
  ),
};

const DisabledSeriesLineChart = bindWithProps(DisabledSeriesLineInspectStory);
setControlInclude(DisabledSeriesLineChart as StoryWithParameters, ['excludeDataKeys']);
DisabledSeriesLineChart.args = {
  children: (datum: LineData) => (
    <div className="bar-inspect">
      <div>{formatTimestamp(datum.datetime as number)}</div>
      <div>Event: {datum.series}</div>
      <div>Count: {Number(datum.value).toLocaleString()}</div>
      <div>Users: {Number(datum.users).toLocaleString()}</div>
    </div>
  ),
  excludeDataKeys: ['excludeFromInspect'],
};

export { DisabledSeriesLineChart, DodgedBarChart, LineChart, StackedBarChart };
