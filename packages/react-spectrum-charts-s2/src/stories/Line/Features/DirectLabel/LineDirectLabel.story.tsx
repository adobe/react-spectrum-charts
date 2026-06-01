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
import { Axis, ChartInspect, Legend, Line, LineDirectLabel } from '../../../../components';
import useChartProps from '../../../../hooks/useChartProps';
import { workspaceTrendsData } from '../../../../stories/data/data';
import { bindWithProps } from '../../../../test-utils';
import { ChartProps } from '../../../../types';

export default {
  title: 'React Spectrum Charts 2/Line/Features/Direct Label',
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

const defaultChartProps: ChartProps = { data: workspaceTrendsData, minWidth: 400, maxWidth: 800, height: 400, backgroundColor: 'gray-50' };

const twoSeriesData = workspaceTrendsData
  .filter((d) => d.series === 'Add Freeform table' || d.series === 'Add Fallout')
  .map((d) => (d.series === 'Add Fallout' ? { ...d, users: d.users + 4000 } : d));

// Three series that converge near the same value at the end to expose label overlap behavior
const threeSeriesConvergingData = [
  { datetime: 1667890800000, users: 5200, series: 'Series A' },
  { datetime: 1667977200000, users: 4600, series: 'Series A' },
  { datetime: 1668063600000, users: 4000, series: 'Series A' },
  { datetime: 1668150000000, users: 3200, series: 'Series A' },
  { datetime: 1668236400000, users: 2600, series: 'Series A' },
  { datetime: 1668322800000, users: 2200, series: 'Series A' },
  { datetime: 1668409200000, users: 2050, series: 'Series A' },

  { datetime: 1667890800000, users: 400, series: 'Series B' },
  { datetime: 1667977200000, users: 800, series: 'Series B' },
  { datetime: 1668063600000, users: 1200, series: 'Series B' },
  { datetime: 1668150000000, users: 1600, series: 'Series B' },
  { datetime: 1668236400000, users: 1800, series: 'Series B' },
  { datetime: 1668322800000, users: 1950, series: 'Series B' },
  { datetime: 1668409200000, users: 1900, series: 'Series B' },

  { datetime: 1667890800000, users: 2400, series: 'Series C' },
  { datetime: 1667977200000, users: 2300, series: 'Series C' },
  { datetime: 1668063600000, users: 2200, series: 'Series C' },
  { datetime: 1668150000000, users: 2100, series: 'Series C' },
  { datetime: 1668236400000, users: 2050, series: 'Series C' },
  { datetime: 1668322800000, users: 2000, series: 'Series C' },
  { datetime: 1668409200000, users: 2000, series: 'Series C' },
];

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

const LineDirectLabelWithInspectStory: StoryFn<typeof LineDirectLabel> = (args): ReactElement => {
  const chartProps = useChartProps(defaultChartProps);
  return (
    <Chart {...chartProps} debug>
      <Axis position="left" grid title="Users" />
      <Axis position="bottom" labelFormat="time" baseline ticks />
      <Line dimension="datetime" metric="users" color="series" scaleType="time">
        <LineDirectLabel {...args} />
        <ChartInspect>{(datum: Record<string, string>) => <div>{datum.users}</div>}</ChartInspect>
      </Line>
      <Legend highlight />
    </Chart>
  );
};

const LineDirectLabelTwoSeriesStory: StoryFn<typeof LineDirectLabel> = (args): ReactElement => {
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

const DirectLabelDefault = bindWithProps(LineDirectLabelStory);
DirectLabelDefault.args = { value: 'series' };

const DirectLabelValueLast = bindWithProps(LineDirectLabelStory);
DirectLabelValueLast.args = { value: 'last' };

const DirectLabelValueAverage = bindWithProps(LineDirectLabelStory);
DirectLabelValueAverage.args = { value: 'average' };

const DirectLabelWithInspect = bindWithProps(LineDirectLabelWithInspectStory);
DirectLabelWithInspect.args = { value: 'last' };

const DirectLabelTwoSeries = bindWithProps(LineDirectLabelTwoSeriesStory);
DirectLabelTwoSeries.args = { value: 'last' };

const LineDirectLabelThreeSeriesStory: StoryFn<typeof LineDirectLabel> = (args): ReactElement => {
  const chartProps = useChartProps({ ...defaultChartProps, data: threeSeriesConvergingData });
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

const DirectLabelThreePlusSeries = bindWithProps(LineDirectLabelThreeSeriesStory);
DirectLabelThreePlusSeries.args = { value: 'last' };

// Six series: A/B/C cluster near ~3000 at the end, D/E cluster near ~1400, F isolated at ~300
const sixSeriesData = [
  { datetime: 1667890800000, users: 7000, series: 'Series A' },
  { datetime: 1667977200000, users: 6200, series: 'Series A' },
  { datetime: 1668063600000, users: 5400, series: 'Series A' },
  { datetime: 1668150000000, users: 4400, series: 'Series A' },
  { datetime: 1668236400000, users: 3600, series: 'Series A' },
  { datetime: 1668322800000, users: 3100, series: 'Series A' },
  { datetime: 1668409200000, users: 3050, series: 'Series A' },

  { datetime: 1667890800000, users: 500, series: 'Series B' },
  { datetime: 1667977200000, users: 1000, series: 'Series B' },
  { datetime: 1668063600000, users: 1600, series: 'Series B' },
  { datetime: 1668150000000, users: 2200, series: 'Series B' },
  { datetime: 1668236400000, users: 2600, series: 'Series B' },
  { datetime: 1668322800000, users: 2900, series: 'Series B' },
  { datetime: 1668409200000, users: 2900, series: 'Series B' },

  { datetime: 1667890800000, users: 3500, series: 'Series C' },
  { datetime: 1667977200000, users: 3400, series: 'Series C' },
  { datetime: 1668063600000, users: 3300, series: 'Series C' },
  { datetime: 1668150000000, users: 3200, series: 'Series C' },
  { datetime: 1668236400000, users: 3100, series: 'Series C' },
  { datetime: 1668322800000, users: 3000, series: 'Series C' },
  { datetime: 1668409200000, users: 2800, series: 'Series C' },

  { datetime: 1667890800000, users: 2000, series: 'Series D' },
  { datetime: 1667977200000, users: 2100, series: 'Series D' },
  { datetime: 1668063600000, users: 1900, series: 'Series D' },
  { datetime: 1668150000000, users: 1700, series: 'Series D' },
  { datetime: 1668236400000, users: 1600, series: 'Series D' },
  { datetime: 1668322800000, users: 1450, series: 'Series D' },
  { datetime: 1668409200000, users: 1450, series: 'Series D' },

  { datetime: 1667890800000, users: 800, series: 'Series E' },
  { datetime: 1667977200000, users: 900, series: 'Series E' },
  { datetime: 1668063600000, users: 1100, series: 'Series E' },
  { datetime: 1668150000000, users: 1200, series: 'Series E' },
  { datetime: 1668236400000, users: 1300, series: 'Series E' },
  { datetime: 1668322800000, users: 1350, series: 'Series E' },
  { datetime: 1668409200000, users: 1350, series: 'Series E' },

  { datetime: 1667890800000, users: 600, series: 'Series F' },
  { datetime: 1667977200000, users: 500, series: 'Series F' },
  { datetime: 1668063600000, users: 450, series: 'Series F' },
  { datetime: 1668150000000, users: 380, series: 'Series F' },
  { datetime: 1668236400000, users: 350, series: 'Series F' },
  { datetime: 1668322800000, users: 320, series: 'Series F' },
  { datetime: 1668409200000, users: 300, series: 'Series F' },
];

const LineDirectLabelSixSeriesStory: StoryFn<typeof LineDirectLabel> = (args): ReactElement => {
  const chartProps = useChartProps({ ...defaultChartProps, data: sixSeriesData });
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

const DirectLabelSixSeries = bindWithProps(LineDirectLabelSixSeriesStory);
DirectLabelSixSeries.args = { value: 'last' };

const DirectLabelPositionStart = bindWithProps(LineDirectLabelStory);
DirectLabelPositionStart.args = { value: 'series', position: 'start' };

export { DirectLabelDefault, DirectLabelValueLast, DirectLabelValueAverage, DirectLabelWithInspect, DirectLabelTwoSeries, DirectLabelThreePlusSeries, DirectLabelSixSeries, DirectLabelPositionStart };
