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
import { Axis, Line } from '../../../components/index.js';
import useChartProps from '../../../hooks/useChartProps.js';
import { bindWithProps } from '../../../test-utils/index.js';
import { LineProps } from '../../../types/index.js';

export default {
  title: 'React Spectrum Charts 2/Line/Regressions/Fixed Axis Boundary Strokes',
  tags: ['alpha'],
  component: Line,
  parameters: {
    regression: {
      description:
        'Fixed metric axes clipped Line strokes at the plot boundaries; metric-range center lines and trendlines still exhibit boundary clipping and are included for follow-up snapshots.',
      pr: 1130,
    },
  },
};

const boundaryData = [
  { series: 'Lower boundary', boundary: 0 },
  { series: 'Upper boundary', boundary: 100 },
].flatMap(({ series, boundary }) =>
  [0, 0, 25, 50, 0, 0].map((offset, index) => ({
    datetime: Date.UTC(2026, 0, index + 1),
    series,
    value: boundary === 0 ? offset : boundary - offset,
    rangeValue: boundary === 0 ? 30 : 70,
    rangeCenter: boundary,
    rangeStart: boundary - 10,
    rangeEnd: boundary + 10,
    trendValue: boundary + (index % 2 === 0 ? -20 : 20),
  }))
);

const examples: { title: string; lineProps: LineProps }[] = [
  { title: 'Line strokes (fixed)', lineProps: { metric: 'value' } },
  {
    title: 'Metric range (known clipping)',
    lineProps: {
      metric: 'rangeValue',
      metricRanges: [{ metric: 'rangeCenter', metricStart: 'rangeStart', metricEnd: 'rangeEnd', lineWidth: 'L' }],
    },
  },
  {
    title: 'Trendline (known clipping)',
    lineProps: { metric: 'trendValue', trendlines: [{ method: 'average', size: 'L' }] },
  },
];

const FixedAxisBoundaryStory: StoryFn<typeof Line> = (args): ReactElement => {
  const chartProps = useChartProps({
    data: boundaryData,
    width: 360,
    height: 216,
    animations: false,
    renderer: 'svg',
  });
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 32 }}>
      {examples.map(({ title, lineProps }) => (
        <section key={title}>
          <h3>{title}</h3>
          <Chart {...chartProps}>
            <Axis position="left" range={[0, 100]} />
            <Axis position="bottom" labelFormat="time" />
            <Line {...args} {...lineProps} />
          </Chart>
        </section>
      ))}
    </div>
  );
};

const BoundaryStrokesWithOverlays = bindWithProps(FixedAxisBoundaryStory);
BoundaryStrokesWithOverlays.args = { color: 'series', interpolate: 'linear', showHoverLabel: false };

export { BoundaryStrokesWithOverlays };
