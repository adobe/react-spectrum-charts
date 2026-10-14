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
import { Axis, Legend, Line, ReferenceLine } from '../../../components/index.js';
import useChartProps from '../../../hooks/useChartProps.js';
import { bindWithProps } from '../../../test-utils/index.js';
import { lineVariationDatasets } from '../Dashboards/lineVariationData.js';

export default {
  title: 'React Spectrum Charts 2/Line/Regressions/Reference Lines',
  component: ReferenceLine,
};

const ReferenceLinesStory: StoryFn<typeof ReferenceLine> = (args): ReactElement => {
  const chartProps = useChartProps({ data: lineVariationDatasets.negative, width: 360, height: 216 });
  return (
    <Chart {...chartProps}>
      <Axis position="left" grid numberFormat="shortNumber">
        <ReferenceLine {...args} />
        <ReferenceLine value={-4000} label="Below range" />
        <ReferenceLine value={-600} label="In range" secondary />
      </Axis>
      <Axis position="bottom" labelFormat="time" baseline ticks />
      <Line color="series" />
      <Legend highlight />
    </Chart>
  );
};

const NegativeDataset = bindWithProps(ReferenceLinesStory);
NegativeDataset.args = { value: 4000, label: 'Goal' };
NegativeDataset.parameters = {
  ...NegativeDataset.parameters,
  regression: {
    description:
      'This chart has three reference lines: Goal (4,000) and Below range (-4,000) should stay clipped and hidden, while In range (-600) remains visible; previously the out-of-range lines collapsed the chart and flickered on hover.',
  },
};

export { NegativeDataset };
