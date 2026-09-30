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
import { AreaProps } from '../../../types';

export default {
  title: 'React Spectrum Charts 2/Pre-Alpha/Area/Regressions/Data Gaps',
  component: Area,
};

const weatherDataWithGaps = [
  { datetime: 1667890800000, maxTemperature: 73, minTemperature: 47, series: 'Temperature band' },
  { datetime: 1667977200000, maxTemperature: 70, minTemperature: 48, series: 'Temperature band' },
  { datetime: 1668063600000, maxTemperature: undefined, minTemperature: undefined, series: 'Temperature band' },
  { datetime: 1668150000000, maxTemperature: 56, minTemperature: 31, series: 'Temperature band' },
  { datetime: 1668236400000, maxTemperature: 41, minTemperature: 18, series: 'Temperature band' },
  { datetime: 1668322800000, maxTemperature: 60, minTemperature: 45, series: 'Temperature band' },
  { datetime: 1668409200000, maxTemperature: 64, minTemperature: 43, series: 'Temperature band' },
];

// the stack transform back-fills a 0 baseline for undefined metrics, so a floating area is used to render the gap
const WithGapsInDataStory: StoryFn<AreaProps> = (args): ReactElement => {
  const chartProps = useChartProps({ data: weatherDataWithGaps, minWidth: 400, maxWidth: 800, height: 400 });
  return (
    <Chart {...chartProps}>
      <Axis position="bottom" labelFormat="time" baseline />
      <Axis position="left" title="Temperature (F)" grid />
      <Area {...args} />
      <Legend title="Temperature" />
    </Chart>
  );
};

const WithGapsInData = bindWithProps(WithGapsInDataStory);
WithGapsInData.args = { metricStart: 'minTemperature', metricEnd: 'maxTemperature', opacity: 0.6 };

export { WithGapsInData };
