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
import { Axis, Bar, Legend, ReferenceLine } from '../../../components/index.js';
import useChartProps from '../../../hooks/useChartProps.js';
import { browserData } from '../../../storyShared/data/data.js';
import { bindWithProps } from '../../../test-utils/index.js';

export default {
  title: 'React Spectrum Charts 2/Axis/Regressions/Reference Line',
  component: ReferenceLine,
};

const BottomAxisStory: StoryFn<typeof ReferenceLine> = (args): ReactElement => {
  const chartProps = useChartProps({ data: browserData, width: 600, height: 300 });
  return (
    <Chart {...chartProps}>
      <Axis position="left" grid />
      <Axis position="bottom" baseline>
        <ReferenceLine {...args} />
      </Axis>
      <Bar dimension="category" metric="value" color="series" />
      <Legend />
    </Chart>
  );
};

const LeftBandAxisStory: StoryFn<typeof ReferenceLine> = (args): ReactElement => {
  const chartProps = useChartProps({ data: browserData, width: 600, height: 300 });
  return (
    <Chart {...chartProps}>
      <Axis position="left" baseline>
        <ReferenceLine {...args} />
      </Axis>
      <Axis position="bottom" grid />
      <Bar dimension="category" metric="value" color="series" orientation="horizontal" />
      <Legend />
    </Chart>
  );
};

// Safari is the last category, so the label has to move to the left of the line.
const BottomAxis = bindWithProps(BottomAxisStory);
BottomAxis.args = { value: 'Safari', label: 'Default browser' };
BottomAxis.parameters = {
  ...BottomAxis.parameters,
  regression: {
    description: 'A ReferenceLine inside a bottom or top axis drew nothing.',
    pr: 1038,
  },
};

const LeftBandAxis = bindWithProps(LeftBandAxisStory);
LeftBandAxis.args = { value: 'Firefox', label: 'Default browser' };
LeftBandAxis.parameters = {
  ...LeftBandAxis.parameters,
  regression: {
    description: 'A ReferenceLine on a left band axis drew as a value-axis line with carets.',
    pr: 1038,
  },
};

export { BottomAxis, LeftBandAxis };
