/*
 * Copyright 2023 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
import React, { ReactElement } from 'react';

import { StoryFn } from '@storybook/react';

import { Chart } from '../../../Chart';
import { Axis, Bar, Legend, Line } from '../../../components';
import useChartProps from '../../../hooks/useChartProps';
import { LegendProps } from '../../../types';
import { browserData as data } from '../../data/data';

// Jun 1–7 2026 daily data, 3 series mirroring a CJA multi-metric line chart
export const legendColumnsData = [
  { datetime: 1780293600000, value: 5173, series: 'CJA Users' },
  { datetime: 1780380000000, value: 5382, series: 'CJA Users' },
  { datetime: 1780466400000, value: 5359, series: 'CJA Users' },
  { datetime: 1780552800000, value: 5117, series: 'CJA Users' },
  { datetime: 1780639200000, value: 2987, series: 'CJA Users' },
  { datetime: 1780725600000, value: 102, series: 'CJA Users' },
  { datetime: 1780812000000, value: 98, series: 'CJA Users' },
  { datetime: 1780293600000, value: 5771, series: 'Accounts' },
  { datetime: 1780380000000, value: 5766, series: 'Accounts' },
  { datetime: 1780466400000, value: 5833, series: 'Accounts' },
  { datetime: 1780552800000, value: 5717, series: 'Accounts' },
  { datetime: 1780639200000, value: 5277, series: 'Accounts' },
  { datetime: 1780725600000, value: 210, series: 'Accounts' },
  { datetime: 1780812000000, value: 185, series: 'Accounts' },
  { datetime: 1780293600000, value: 12077019, series: 'Events' },
  { datetime: 1780380000000, value: 12336199, series: 'Events' },
  { datetime: 1780466400000, value: 12587046, series: 'Events' },
  { datetime: 1780552800000, value: 11499035, series: 'Events' },
  { datetime: 1780639200000, value: 5737435, series: 'Events' },
  { datetime: 1780725600000, value: 42104, series: 'Events' },
  { datetime: 1780812000000, value: 38291, series: 'Events' },
];

export const LegendBarStory: StoryFn<typeof Legend> = (args): ReactElement => {
  const chartProps = useChartProps({ data, width: 700 });
  return (
    <Chart {...chartProps}>
      <Bar color="series" />
      <Legend {...args} />
      <Axis position="bottom" baseline />
      <Axis position="left" grid />
    </Chart>
  );
};

export const LegendBarHighlightedSeriesStory: StoryFn<typeof Legend> = (args): ReactElement => {
  const chartProps = useChartProps({ data, width: 700, highlightedSeries: 'Mac' });
  return (
    <Chart {...chartProps}>
      <Bar color="series" />
      <Legend {...args} />
      <Axis position="bottom" baseline />
      <Axis position="left" grid />
    </Chart>
  );
};

export const LegendBarHiddenSeriesStory: StoryFn<typeof Legend> = (args): ReactElement => {
  const chartProps = useChartProps({ data, width: 700, hiddenSeries: ['Mac'] });
  return (
    <Chart {...chartProps}>
      <Bar color="series" />
      <Legend {...args} />
      <Axis position="bottom" baseline />
      <Axis position="left" grid />
    </Chart>
  );
};

export const LegendDisconnectedStory: StoryFn<typeof Legend> = (args): ReactElement => {
  const chartProps = useChartProps({ data, width: 700, height: 50 });
  return (
    <Chart {...chartProps}>
      <Legend {...args} />
    </Chart>
  );
};

export const defaultProps: LegendProps = {
  onClick: undefined,
};

export const LegendLineStory: StoryFn<typeof Legend> = (args): ReactElement => {
  const chartProps = useChartProps({ data: legendColumnsData, width: 700, height: 300 });
  return (
    <Chart {...chartProps}>
      <Axis position="left" grid />
      <Axis position="bottom" labelFormat="time" baseline ticks />
      <Line color="series" dimension="datetime" metric="value" scaleType="time" />
      <Legend {...args} />
    </Chart>
  );
};
