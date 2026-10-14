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
import { Axis, ChartInspect, Line } from '../../../components/index.js';
import useChartProps from '../../../hooks/useChartProps.js';
import { bindWithProps } from '../../../test-utils/index.js';
import { LineProps } from '../../../types/index.js';
import { lineVariationDatasets } from '../Dashboards/lineVariationData.js';

export default {
  title: 'React Spectrum Charts 2/Line/Regressions/Fixed Metric Range',
  component: Line,
  parameters: {
    regression: {
      description:
        'Off-plot lines or the zero baseline collapsed fixed-range plots and produced hover indicators for invisible points.',
    },
  },
};

type FixedMetricRangeProps = LineProps & { metricRange?: [number, number] };

const FixedMetricRangeStory: StoryFn<FixedMetricRangeProps> = ({
  metricRange = [0, 10000],
  ...args
}: FixedMetricRangeProps): ReactElement => {
  const chartProps = useChartProps({ data: lineVariationDatasets.sparse, width: 360, height: 216 });
  return (
    <Chart {...chartProps}>
      <Axis position="left" grid numberFormat="shortNumber" range={metricRange} />
      <Axis position="bottom" labelFormat="time" baseline ticks />
      <Line {...args}>
        <ChartInspect>{(datum) => <div>{String(datum.value)}</div>}</ChartInspect>
      </Line>
    </Chart>
  );
};

const SparseFixedMetricRange = bindWithProps(FixedMetricRangeStory);
SparseFixedMetricRange.args = { color: 'series' };

const PartiallyOutOfBoundsFixedMetricRange = bindWithProps(FixedMetricRangeStory);
PartiallyOutOfBoundsFixedMetricRange.args = { color: 'series', metricRange: [400000, 550000] };

export { SparseFixedMetricRange, PartiallyOutOfBoundsFixedMetricRange };
