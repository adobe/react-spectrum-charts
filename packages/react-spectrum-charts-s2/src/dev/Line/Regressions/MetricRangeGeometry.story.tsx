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
import { Axis, Legend, Line } from '../../../components/index.js';
import useChartProps from '../../../hooks/useChartProps.js';
import { bindWithProps } from '../../../test-utils/index.js';

export default {
  title: 'React Spectrum Charts 2/Line/Regressions/Metric Range Geometry',
  tags: ['alpha'],
  component: Chart,
  parameters: {
    regression: {
      description:
        'Metric-range bands ignored their parent line scale and interpolation and bridged missing bounds, misaligning custom and dual-axis charts through hover and resize.',
      pr: 1118,
    },
  },
};

const CustomMetricAxisStory: StoryFn<typeof Chart> = (args): ReactElement => {
  const chartProps = useChartProps(args);
  return (
    <Chart {...chartProps}>
      <Axis position="left" name="customMetric" range={[0, 80]} grid />
      <Axis position="bottom" labelFormat="time" />
      <Line
        metric="amount"
        dimension="timestamp"
        metricAxis="customMetric"
        interpolate="monotone"
        metricRanges={[{ metric: 'amount', metricStart: 'lower', metricEnd: 'upper' }]}
      />
    </Chart>
  );
};

const DualMetricAxesStory: StoryFn<typeof Chart> = (args): ReactElement => {
  const chartProps = useChartProps(args);
  return (
    <Chart {...chartProps}>
      <Axis position="left" range={[0, 80]} grid />
      <Axis position="right" range={[0, 10000]} />
      <Axis position="bottom" labelFormat="time" />
      <Line
        color="series"
        metric="amount"
        dimension="timestamp"
        dualMetricAxis
        interpolate="monotone"
        showHoverLabel={false}
        metricRanges={[{ metric: 'amount', metricStart: 'lower', metricEnd: 'upper', displayOnHover: true }]}
      />
      <Legend highlight />
    </Chart>
  );
};

const rows = ['Primary', 'Secondary'].flatMap((series, seriesIndex) =>
  [20, 35, 25, 48, 38, 55, 45, 60].map((value, index) => {
    const amount = seriesIndex ? (value + 15) * 100 : value;
    const spread = seriesIndex ? 800 : 8;
    return {
      timestamp: Date.UTC(2026, 0, index + 1),
      series,
      amount,
      lower: amount - spread,
      upper: index === 3 ? null : amount + spread,
    };
  })
);

const CustomMetricAxis = bindWithProps(CustomMetricAxisStory);
CustomMetricAxis.args = {
  data: rows.filter(({ series }) => series === 'Primary'),
  width: 560,
  height: 280,
  animations: false,
  renderer: 'svg',
};

const DualMetricAxes = bindWithProps(DualMetricAxesStory);
DualMetricAxes.args = {
  ...CustomMetricAxis.args,
  data: rows,
  // Show the secondary-axis band in snapshots; clear this control to inspect either series by hovering.
  highlightedSeries: 'Secondary',
};

export { CustomMetricAxis, DualMetricAxes };
