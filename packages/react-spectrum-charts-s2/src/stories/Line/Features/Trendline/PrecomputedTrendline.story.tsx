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
import { Axis, Legend, Line } from '../../../../components/index.js';
import useChartProps from '../../../../hooks/useChartProps.js';
import { Trendline } from '../../../../lab/index.js';
import { bindWithProps } from '../../../../test-utils/index.js';

export default {
  title: 'React Spectrum Charts 2/Line/Features/Precomputed Trendline',
  tags: ['alpha'],
  component: Trendline,
};

const data = ['A', 'B'].flatMap((series) =>
  [10, 20, 15, 30].map((value, index) => ({
    series,
    timestamp: Date.UTC(2026, 0, index + 1),
    value: value + (series === 'B' ? 20 : 0),
  }))
);
const trend = data.map((row, index) => {
  const seriesOffset = row.series === 'B' ? 20 : 0;
  return {
    ...row,
    value: index % 4 === 2 ? null : 12 + (index % 4) * 4 + seriesOffset,
  };
});

const PrecomputedStory: StoryFn<typeof Trendline> = (args): ReactElement => {
  const chartProps = useChartProps({ data, minWidth: 400, maxWidth: 800, height: 400 });
  return (
    <Chart {...chartProps}>
      <Axis position="left" grid />
      <Axis position="bottom" labelFormat="time" />
      <Line dimension="timestamp" color="series">
        <Trendline {...args} data={trend} />
      </Line>
      <Legend highlight isToggleable />
    </Chart>
  );
};

const Precomputed = bindWithProps(PrecomputedStory);
Precomputed.args = { color: 'gray-600', lineType: 'solid', displayOnHover: true };

export { Precomputed };
