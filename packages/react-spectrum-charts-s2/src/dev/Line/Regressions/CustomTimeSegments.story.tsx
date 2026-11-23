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
import { Axis, Line, LineForecast } from '../../../components/index.js';
import useChartProps from '../../../hooks/useChartProps.js';
import { bindWithProps } from '../../../test-utils/index.js';

export default {
  title: 'React Spectrum Charts 2/Line/Regressions/Custom Time Segments',
  tags: ['alpha'],
  component: Chart,
  parameters: {
    regression: {
      description:
        'Alternate and forecast segments were grouped in the wrong order when their time field was not named datetime.',
      pr: 1116,
    },
  },
};

const AlternateSegmentsStory: StoryFn<typeof Chart> = (args): ReactElement => {
  const chartProps = useChartProps(args);
  return (
    <Chart {...chartProps}>
      <Axis position="left" grid />
      <Axis position="bottom" labelFormat="time" />
      <Line dimension="timestamp" interpolate="linear" alternateSegmentKey="isAlternate" />
    </Chart>
  );
};

const ForecastSegmentsStory: StoryFn<typeof Chart> = (args): ReactElement => {
  const chartProps = useChartProps(args);
  return (
    <Chart {...chartProps}>
      <Axis position="left" grid />
      <Axis position="bottom" labelFormat="time" />
      <Line dimension="timestamp" interpolate="linear">
        <LineForecast metric="prediction" start={Date.UTC(2026, 0, 5)} />
      </Line>
    </Chart>
  );
};

// Deliberately shuffled and without a datetime field, so segment order must follow timestamp.
const rows = [3, 0, 6, 2, 7, 1, 5, 4].map((index) => ({
  timestamp: Date.UTC(2026, 0, index + 1),
  value: [20, 35, 30, 45, 40, 55, 50, 65][index],
  isAlternate: index % 4 >= 2,
}));

const AlternateSegments = bindWithProps(AlternateSegmentsStory);
AlternateSegments.args = { data: rows, width: 560, height: 280, animations: false, renderer: 'svg' };

const ForecastSegments = bindWithProps(ForecastSegmentsStory);
ForecastSegments.args = {
  ...AlternateSegments.args,
  data: rows.map(({ value, ...row }) => ({
    ...row,
    value: row.timestamp < Date.UTC(2026, 0, 5) ? value : null,
    prediction: row.timestamp >= Date.UTC(2026, 0, 5) ? value : null,
  })),
};

export { AlternateSegments, ForecastSegments };
