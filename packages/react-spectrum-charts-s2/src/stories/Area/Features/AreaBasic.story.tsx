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
import { Axis, Legend } from '../../../components';
import useChartProps from '../../../hooks/useChartProps';
import { Area } from '../../../pre-alpha';
import { bindWithProps } from '../../../test-utils';
import { AreaProps, ChartProps } from '../../../types';
import { workspaceTrendsData } from '../../data/data';

export default {
  title: 'React Spectrum Charts 2/Pre-Alpha/Area/Features',
  component: Area,
};

// weather data is single-series, used by the basic and floating examples
const weatherData = [
  { datetime: 1667890800000, maxTemperature: 73, minTemperature: 47, series: 'Add Fallout' },
  { datetime: 1667977200000, maxTemperature: 70, minTemperature: 48, series: 'Add Fallout' },
  { datetime: 1668063600000, maxTemperature: 73, minTemperature: 48, series: 'Add Fallout' },
  { datetime: 1668150000000, maxTemperature: 56, minTemperature: 31, series: 'Add Fallout' },
  { datetime: 1668236400000, maxTemperature: 41, minTemperature: 18, series: 'Add Fallout' },
  { datetime: 1668322800000, maxTemperature: 60, minTemperature: 45, series: 'Add Fallout' },
  { datetime: 1668409200000, maxTemperature: 64, minTemperature: 43, series: 'Add Fallout' },
];

const weatherDataWithGaps = [
  { datetime: 1667890800000, maxTemperature: 73, minTemperature: 47, series: 'Add Fallout' },
  { datetime: 1667977200000, maxTemperature: 70, minTemperature: 48, series: 'Add Fallout' },
  { datetime: 1668063600000, maxTemperature: undefined, minTemperature: undefined, series: 'Add Fallout' },
  { datetime: 1668150000000, maxTemperature: 56, minTemperature: 31, series: 'Add Fallout' },
  { datetime: 1668236400000, maxTemperature: 41, minTemperature: 18, series: 'Add Fallout' },
  { datetime: 1668322800000, maxTemperature: 60, minTemperature: 45, series: 'Add Fallout' },
  { datetime: 1668409200000, maxTemperature: 64, minTemperature: 43, series: 'Add Fallout' },
];

// browser/OS data is categorical, used to demonstrate stacking on a point scale rather than time
const browserData = [
  { browser: 'Chrome', value: 5, operatingSystem: 'Windows' },
  { browser: 'Chrome', value: 3, operatingSystem: 'Mac' },
  { browser: 'Chrome', value: 2, operatingSystem: 'Other' },
  { browser: 'Firefox', value: 3, operatingSystem: 'Windows' },
  { browser: 'Firefox', value: 3, operatingSystem: 'Mac' },
  { browser: 'Firefox', value: 1, operatingSystem: 'Other' },
  { browser: 'Safari', value: 3, operatingSystem: 'Windows' },
  { browser: 'Safari', value: 0, operatingSystem: 'Mac' },
  { browser: 'Safari', value: 1, operatingSystem: 'Other' },
];

const defaultChartProps: ChartProps = { data: weatherData, minWidth: 400, maxWidth: 800, height: 400 };

const AreaStory: StoryFn<AreaProps> = (args): ReactElement => {
  const chartProps = useChartProps(defaultChartProps);
  return (
    <Chart {...chartProps}>
      <Axis position="bottom" labelFormat="time" baseline />
      <Axis position="left" title="Temperature (F)" grid />
      <Area {...args} />
    </Chart>
  );
};

const StackedStory: StoryFn<AreaProps> = (args): ReactElement => {
  const chartProps = useChartProps({ ...defaultChartProps, data: workspaceTrendsData });
  return (
    <Chart {...chartProps}>
      <Axis position="bottom" labelFormat="time" baseline />
      <Axis position="left" grid />
      <Area {...args} />
      <Legend lineWidth={{ value: 0 }} />
    </Chart>
  );
};

const CategoricalStory: StoryFn<AreaProps> = (args): ReactElement => {
  const chartProps = useChartProps({ ...defaultChartProps, data: browserData });
  return (
    <Chart {...chartProps}>
      <Axis position="bottom" baseline />
      <Axis position="left" grid />
      <Area {...args} />
      <Legend />
    </Chart>
  );
};

// the stack transform back-fills a 0 baseline even when the metric is undefined, masking the gap — floating (start/end) area is used here instead so the gap renders
const WithGapsInDataStory: StoryFn<AreaProps> = (args): ReactElement => {
  const chartProps = useChartProps({ ...defaultChartProps, data: weatherDataWithGaps });
  return (
    <Chart {...chartProps}>
      <Axis position="bottom" labelFormat="time" baseline />
      <Axis position="left" title="Temperature (F)" grid />
      <Area {...args} />
    </Chart>
  );
};

const Basic = bindWithProps(AreaStory);
Basic.args = { metric: 'maxTemperature' };

// relies on Area's own defaults (dimension: 'datetime', metric: 'value', color: 'series', scaleType: 'time')
const Stacked = bindWithProps(StackedStory);
Stacked.args = {};

const Categorical = bindWithProps(CategoricalStory);
Categorical.args = { dimension: 'browser', color: 'operatingSystem', scaleType: 'point' };

const Floating = bindWithProps(AreaStory);
Floating.args = { metricStart: 'minTemperature', metricEnd: 'maxTemperature' };

const WithGapsInData = bindWithProps(WithGapsInDataStory);
WithGapsInData.args = { metricStart: 'minTemperature', metricEnd: 'maxTemperature', opacity: 0.6 };

export { Basic, Stacked, Categorical, Floating, WithGapsInData };
