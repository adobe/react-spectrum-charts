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

import { Chart } from '../../../../../Chart';
import { Axis, ChartInspect, Legend, Line, LineDirectLabel } from '../../../../../components';
import useChartProps from '../../../../../hooks/useChartProps';
import { workspaceTrendsData } from '../../../../../stories/data/data';
import { bindWithProps } from '../../../../../test-utils';
import { ChartProps } from '../../../../../types';

export default {
  title: 'React Spectrum Charts 2/Line/Features/Direct Label/Cascade',
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

// DATA 

const twoSeriesData = workspaceTrendsData
  .filter((d) => d.series === 'Add Freeform table' || d.series === 'Add Fallout')
  .map((d) => (d.series === 'Add Fallout' ? { ...d, users: d.users + 4000 } : d));

// Three series that diverge near  the end to expose label overlap behavior
const threeSeriesDivergingData = [
  { datetime: 1667890800000, users: 1000, series: 'Series A' },
  { datetime: 1667977200000, users: 1400, series: 'Series A' },
  { datetime: 1668063600000, users: 1900, series: 'Series A' },
  { datetime: 1668150000000, users: 2500, series: 'Series A' },
  { datetime: 1668236400000, users: 3200, series: 'Series A' },
  { datetime: 1668322800000, users: 4000, series: 'Series A' },
  { datetime: 1668409200000, users: 5000, series: 'Series A' },

  { datetime: 1667890800000, users: 2500, series: 'Series B' },
  { datetime: 1667977200000, users: 2600, series: 'Series B' },
  { datetime: 1668063600000, users: 2500, series: 'Series B' },
  { datetime: 1668150000000, users: 2600, series: 'Series B' },
  { datetime: 1668236400000, users: 2500, series: 'Series B' },
  { datetime: 1668322800000, users: 2600, series: 'Series B' },
  { datetime: 1668409200000, users: 2500, series: 'Series B' },

  { datetime: 1667890800000, users: 5000, series: 'Series C' },
  { datetime: 1667977200000, users: 4200, series: 'Series C' },
  { datetime: 1668063600000, users: 3500, series: 'Series C' },
  { datetime: 1668150000000, users: 2900, series: 'Series C' },
  { datetime: 1668236400000, users: 1800, series: 'Series C' },
  { datetime: 1668322800000, users: 1000, series: 'Series C' },
  { datetime: 1668409200000, users: 400, series: 'Series C' },
];

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

// 20 series data to demonstrate what happens when labels cannot all fit on screen
const manySeriesData = (
    [
        ['Series A',  9800, 9500],
        ['Series B',  9000, 8700],
        ['Series C',  8200, 7900],
        ['Series D',  7500, 7200],
        ['Series E',  6800, 6500],
        ['Series F',  6100, 5800],
        ['Series G',  5400, 5200],
        ['Series H',  4800, 4600],
        ['Series I',  4200, 4000],
        ['Series J',  3600, 3400],
        ['Series K',  3100, 2900],
        ['Series L',  2600, 2400],
        ['Series M',  2100, 1900],
        ['Series N',  1700, 1500],
        ['Series O',  1300, 1100],
        ['Series P',  1000,  800],
        ['Series Q',   700,  550],
        ['Series R',   450,  350],
        ['Series S',   250,  180],
        ['Series T',   120,   60],
    ] as [string, number, number][]
).flatMap(([series, start, end]) =>
    Array.from({ length: 7 }, (_, i) => ({
        datetime: 1667890800000 + i * 86400000,
        users: Math.round(start + (end - start) * (i / 6)),
        series,
    }))
);

// TEMPLATES

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

const LineDirectLabelThreeSeriesDivergeStory: StoryFn<typeof LineDirectLabel> = (args): ReactElement => {
  const chartProps = useChartProps({ ...defaultChartProps, data: threeSeriesDivergingData });
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

const LineDirectLabelManySeriesStory: StoryFn<typeof LineDirectLabel> = (args): ReactElement => {
  const chartProps = useChartProps({ ...defaultChartProps, data: manySeriesData });
  return (
    <Chart {...chartProps} debug>
      <Axis position="left" grid title="Users" />
      <Axis position="bottom" labelFormat="time" baseline ticks />
      <Line dimension="datetime" metric="users" color="series" scaleType="time">
        <LineDirectLabel {...args} />
        <ChartInspect>{(datum: Record<string, string>) => <div>{datum.users}</div>}</ChartInspect>
      </Line>
    </Chart>
  );
};

const LineDirectLabelManySeriesLegendStory: StoryFn<typeof LineDirectLabel> = (args): ReactElement => {
  const chartProps = useChartProps({ ...defaultChartProps, data: manySeriesData });
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

// BINDINGS

const DirectLabelTwoSeries = bindWithProps(LineDirectLabelTwoSeriesStory);
DirectLabelTwoSeries.args = { value: 'series' };

const DirectLabelThreeSeriesDiverge = bindWithProps(LineDirectLabelThreeSeriesDivergeStory);
DirectLabelThreeSeriesDiverge.args = { value: 'series' };

const DirectLabelSixSeries = bindWithProps(LineDirectLabelSixSeriesStory);
DirectLabelSixSeries.args = { value: 'series' };

const DirectLabelManySeries = bindWithProps(LineDirectLabelManySeriesStory);
DirectLabelManySeries.args = { value: 'series' };

const DirectLabelManySeriesLegend = bindWithProps(LineDirectLabelManySeriesLegendStory);
DirectLabelManySeriesLegend.args = { value: 'series' };

export {
  DirectLabelTwoSeries,
  DirectLabelThreeSeriesDiverge,
  DirectLabelSixSeries,
  DirectLabelManySeries,
  DirectLabelManySeriesLegend,
};
