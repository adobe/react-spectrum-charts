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

import { Chart } from '../../../Chart.js';
import { Axis, Legend, Line, LineDirectLabel } from '../../../components/index.js';
import useChartProps from '../../../hooks/useChartProps.js';
import { workspaceTrendsData } from '../../../storyShared/data/data.js';
import { bindWithProps } from '../../../test-utils/index.js';
import { ChartProps } from '../../../types/index.js';

export default {
  title: 'React Spectrum Charts 2/Line/Coverage/Direct Label Cascade',
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
  },
};

const defaultChartProps: ChartProps = {
  data: workspaceTrendsData,
  minWidth: 400,
  maxWidth: 800,
  height: 400,
  backgroundColor: 'gray-50',
};

// Three series that diverge near the end to expose label overlap behavior.
const threeSeriesDivergingData = [
  { datetime: 1667890800000, users: 1000, series: 'Enterprise' },
  { datetime: 1667977200000, users: 1400, series: 'Enterprise' },
  { datetime: 1668063600000, users: 1900, series: 'Enterprise' },
  { datetime: 1668150000000, users: 2500, series: 'Enterprise' },
  { datetime: 1668236400000, users: 3200, series: 'Enterprise' },
  { datetime: 1668322800000, users: 4000, series: 'Enterprise' },
  { datetime: 1668409200000, users: 5000, series: 'Enterprise' },

  { datetime: 1667890800000, users: 2500, series: 'Team' },
  { datetime: 1667977200000, users: 2600, series: 'Team' },
  { datetime: 1668063600000, users: 2500, series: 'Team' },
  { datetime: 1668150000000, users: 2600, series: 'Team' },
  { datetime: 1668236400000, users: 2500, series: 'Team' },
  { datetime: 1668322800000, users: 2600, series: 'Team' },
  { datetime: 1668409200000, users: 2500, series: 'Team' },

  { datetime: 1667890800000, users: 5000, series: 'Individual' },
  { datetime: 1667977200000, users: 4200, series: 'Individual' },
  { datetime: 1668063600000, users: 3500, series: 'Individual' },
  { datetime: 1668150000000, users: 2900, series: 'Individual' },
  { datetime: 1668236400000, users: 1800, series: 'Individual' },
  { datetime: 1668322800000, users: 1000, series: 'Individual' },
  { datetime: 1668409200000, users: 400, series: 'Individual' },
];

const LineDirectLabelThreeSeriesDivergeStory: StoryFn<typeof LineDirectLabel> = (args): ReactElement => {
  const chartProps = useChartProps({ ...defaultChartProps, data: threeSeriesDivergingData });
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

const ThreeSeriesDiverge = bindWithProps(LineDirectLabelThreeSeriesDivergeStory);
ThreeSeriesDiverge.args = { value: 'series' };

export { ThreeSeriesDiverge };
