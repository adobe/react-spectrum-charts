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

import useChartProps from '../hooks/useChartProps';
import { Axis, Chart, Legend, Line, ReferenceLine } from '../index';
import {
  FunnelConversionStory,
  StackOverflowStory,
  TrendsTimeComparisonBarStory,
  UserGrowthBarStory,
  funnelColors,
  userGrowthColors,
} from '../storyShared/ChartExamples/ChartExamplesUtils';
import { funnelConversionData, userGrowthData } from '../storyShared/data/data';
import { trendsTimeComparisonData } from '../storyShared/data/trendsTimeComparisonData';
import { bindWithProps } from '../test-utils';
import errorData from './data/errorData.json';
import stackOverflowData from './data/stackOverflowTrends.json';

export default {
  title: 'React Spectrum Charts 2/Chart/Examples',
  component: Chart,
  parameters: { controls: { include: [] } },
};

const errorRateData = errorData.map((datum) => ({ ...datum, series: 'Checkout errors' }));

const CheckoutErrorRateStory: StoryFn<typeof Chart> = (args): ReactElement => {
  const chartProps = useChartProps(args);
  return (
    <Chart {...chartProps}>
      <Line scaleType="linear" dimension="time" metric="errors" color="series" />
      <Axis position="left" hideDefaultLabels title="Errors">
        <ReferenceLine value={400} label="Critical" secondary />
        <ReferenceLine value={200} label="Warning" secondary />
        <ReferenceLine value={100} label="Watch" secondary />
      </Axis>
      <Axis position="bottom" baseline ticks labelFormat="duration" title="Time since deploy" />
      <Legend highlight />
    </Chart>
  );
};

// Click a bar to open the popover with segment actions.
const UserGrowthByLifecycleStage = bindWithProps(UserGrowthBarStory);
UserGrowthByLifecycleStage.args = {
  data: userGrowthData,
  colors: userGrowthColors,
  height: 500,
  minWidth: 600,
  maxWidth: 1600,
  width: 'auto',
};

const FunnelConversion = bindWithProps(FunnelConversionStory);
FunnelConversion.args = {
  data: funnelConversionData,
  colors: funnelColors,
  height: 500,
  minWidth: 840,
  maxWidth: 1280,
  width: 'auto',
};

const EventTrendsPeriodComparison = bindWithProps(TrendsTimeComparisonBarStory);
EventTrendsPeriodComparison.args = {
  data: trendsTimeComparisonData,
  height: 500,
  minWidth: 840,
  width: 'auto',
  lineTypes: ['shortDash', 'solid'],
  opacities: [0.5, 1],
};

const stackOverflowChartData = stackOverflowData.map((datum) => ({ ...datum, series: 'Stack Overflow' }));

const StackOverflowPageViews = bindWithProps(StackOverflowStory);
StackOverflowPageViews.args = {
  data: stackOverflowChartData,
  height: 500,
  minWidth: 840,
  width: 'auto',
  renderer: 'canvas',
  title: 'The Fall of Stack Overflow',
};

const CheckoutErrorRateThresholds = bindWithProps(CheckoutErrorRateStory);
CheckoutErrorRateThresholds.args = { data: errorRateData, width: 800 };

export {
  UserGrowthByLifecycleStage,
  FunnelConversion,
  EventTrendsPeriodComparison,
  StackOverflowPageViews,
  CheckoutErrorRateThresholds,
};
