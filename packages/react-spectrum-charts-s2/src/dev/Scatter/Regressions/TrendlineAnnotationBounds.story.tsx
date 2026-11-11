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
import { Axis, Legend } from '../../../components/index.js';
import useChartProps from '../../../hooks/useChartProps.js';
import { Scatter, Trendline, TrendlineAnnotation } from '../../../lab/index.js';
import { bindWithProps } from '../../../test-utils/index.js';

export default {
  title: 'React Spectrum Charts 2/Lab/Scatter/Regressions/Trendline Annotation',
  tags: ['lab'],
  component: TrendlineAnnotation,
};

// both series have the same median, so one of the two labels can't be placed
const sharedMedianData = [1, 2, 3, 4, 5, 6].flatMap((week) => [
  { week, sessions: 40 + (week % 2) * 10, platform: 'Desktop' },
  { week, sessions: 50 - (week % 2) * 10, platform: 'Mobile' },
]);

const UnplacedLabelStory: StoryFn<typeof Chart> = (args): ReactElement => {
  const chartProps = useChartProps(args);
  return (
    <Chart {...chartProps}>
      <Axis position="left" grid title="Sessions" />
      <Axis position="bottom" baseline title="Week" />
      <Scatter dimension="week" metric="sessions" color="platform">
        <Trendline method="median">
          <TrendlineAnnotation prefix="Median" />
        </Trendline>
      </Scatter>
      <Legend highlight />
    </Chart>
  );
};

const UnplacedLabel = bindWithProps(UnplacedLabelStory);
UnplacedLabel.args = {
  data: sharedMedianData,
  width: 400,
  height: 300,
};
UnplacedLabel.parameters = {
  ...UnplacedLabel.parameters,
  regression: {
    description:
      'When a trendline label could not be placed, the chart shrank and grew back on every update, so hovering made the plot jump; the plot should stay still.',
    pr: 1102,
  },
};

export { UnplacedLabel };
