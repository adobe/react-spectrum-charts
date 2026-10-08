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

import { Chart } from '../../../../Chart.js';
import { Axis, Legend, Line, LineForecast } from '../../../../components/index.js';
import useChartProps from '../../../../hooks/useChartProps.js';
import { bindWithProps } from '../../../../test-utils/index.js';
import { FORECAST_START, monthlyVisitsForecastData } from '../../lineData.js';
import { setControls } from '../../lineStoryUtils.js';

export default {
  title: 'React Spectrum Charts 2/Line/Features/Forecast',
  component: LineForecast,
};

const ForecastStory: StoryFn<typeof LineForecast> = (args): ReactElement => {
  const chartProps = useChartProps({ data: monthlyVisitsForecastData, minWidth: 400, maxWidth: 800, height: 400 });
  return (
    <Chart {...chartProps}>
      <Axis position="left" grid title="Monthly visits" numberFormat="shortNumber" />
      <Axis position="bottom" labelFormat="time" granularity="month" baseline ticks />
      <Line dimension="datetime" metric="visits" color="device">
        <LineForecast {...args} />
      </Line>
      <Legend highlight />
    </Chart>
  );
};

const Basic = bindWithProps(ForecastStory);
Basic.args = { metric: 'forecastVisits', start: FORECAST_START };
setControls(Basic, ['metric', 'start']);

const Label = bindWithProps(ForecastStory);
Label.args = { metric: 'forecastVisits', start: FORECAST_START, label: 'Projected' };
setControls(Label, ['label']);

export { Basic, Label };
