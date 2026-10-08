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
import { ReactElement, useState } from 'react';

import { StoryFn } from '@storybook/react';
import { action } from 'storybook/actions';

import { Chart } from '../../../../Chart.js';
import { Axis, Legend, Line } from '../../../../components/index.js';
import useChartProps from '../../../../hooks/useChartProps.js';
import { bindWithProps } from '../../../../test-utils/index.js';
import { trafficBySourceData } from '../legendStoryData.js';
import { TrafficStory, controls } from '../legendStoryTemplates.js';

export default {
  title: 'React Spectrum Charts 2/Legend/Features/Series Visibility',
  component: Legend,
};

const ControlledHiddenSeriesStory: StoryFn<typeof Legend> = (args): ReactElement => {
  const [hiddenSeries, setHiddenSeries] = useState<string[]>(['Referral']);
  const chartProps = useChartProps({ data: trafficBySourceData, width: 700, height: 400 });
  const toggleSeries = (series: string) => {
    action('legend entry clicked')(series);
    setHiddenSeries((hidden) =>
      hidden.includes(series) ? hidden.filter((name) => name !== series) : [...hidden, series]
    );
  };
  return (
    <Chart {...chartProps} hiddenSeries={hiddenSeries}>
      <Axis position="left" grid title="Sessions" numberFormat="shortNumber" />
      <Axis position="bottom" baseline labelFormat="time" granularity="month" title="Month" />
      <Line dimension="datetime" metric="sessions" color="source" scaleType="time" />
      <Legend {...args} onClick={toggleSeries} />
    </Chart>
  );
};

// Hover a legend entry to highlight its series.
const Highlight = bindWithProps(TrafficStory);
Highlight.args = { highlight: true };
Object.assign(Highlight, controls('highlight'));

// Click a legend entry to hide or show its series.
const IsToggleable = bindWithProps(TrafficStory);
IsToggleable.args = { isToggleable: true };
Object.assign(IsToggleable, controls('isToggleable'));

const DefaultHiddenSeries = bindWithProps(TrafficStory);
DefaultHiddenSeries.args = { isToggleable: true, defaultHiddenSeries: ['Organic search', 'Paid search'] };
Object.assign(DefaultHiddenSeries, controls('defaultHiddenSeries'));

// Chart-level `hiddenSeries` state is updated from the legend `onClick` callback.
const HiddenSeries = bindWithProps(ControlledHiddenSeriesStory);
HiddenSeries.args = {};
Object.assign(HiddenSeries, controls());

const HiddenEntries = bindWithProps(TrafficStory);
HiddenEntries.args = { hiddenEntries: ['Referral'] };
Object.assign(HiddenEntries, controls('hiddenEntries'));

export { Highlight, IsToggleable, DefaultHiddenSeries, HiddenSeries, HiddenEntries };
