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

import { Chart } from '../../../Chart.js';
import { Axis, ChartInspect, Legend, Line } from '../../../components/index.js';
import { workspaceTrendsData } from '../../../storyShared/data/data.js';
import { bindWithProps } from '../../../test-utils/index.js';
import { ChartProps } from '../../../types/index.js';

export default {
  title: 'React Spectrum Charts 2/Line/Coverage/D3 Engine',
  tags: ['alpha'],
  component: Line,
  parameters: { controls: { include: ['color', 'dimension', 'metric', 'scaleType'] } },
};

const chartProps: ChartProps = { data: workspaceTrendsData, width: 600, height: 400 };

const EngineChart = ({ args, engine }: { args: object; engine: 'vega' | 'd3' }): ReactElement => (
  <div>
    <h3 style={{ fontFamily: 'sans-serif' }}>{engine === 'd3' ? 'D3' : 'Vega'}</h3>
    <Chart {...chartProps} engine={engine}>
      <Axis position="left" grid title="Users" />
      <Axis position="bottom" labelFormat="time" baseline ticks />
      <Line {...args} />
      <Legend />
    </Chart>
  </div>
);

// Same props rendered by both engines for visual and animation comparison.
const SideBySideStory: StoryFn<typeof Line> = (args): ReactElement => (
  <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
    <EngineChart args={args} engine="vega" />
    <EngineChart args={args} engine="d3" />
  </div>
);

const VegaVsD3 = bindWithProps(SideBySideStory);
VegaVsD3.args = {
  color: 'series',
  name: 'line0',
  dimension: 'datetime',
  metric: 'users',
  scaleType: 'time',
};

const shuffle = (seed: number) =>
  workspaceTrendsData.map((row, i) => ({
    ...row,
    users: Math.round(row.users * (0.6 + ((i * 37 + seed * 53) % 80) / 100)),
  }));

const ShowcaseChart = ({ engine, data }: { engine: 'vega' | 'd3'; data: typeof workspaceTrendsData }): ReactElement => (
  <div>
    <h3 style={{ fontFamily: 'sans-serif' }}>{engine === 'd3' ? 'D3' : 'Vega'}</h3>
    <Chart data={data} width={600} height={400} engine={engine}>
      <Axis position="left" grid title="Users" />
      <Axis position="bottom" labelFormat="time" baseline ticks />
      <Line color="series" dimension="datetime" metric="users" scaleType="time" name="line0">
        <ChartInspect>
          {(datum) => (
            <div>
              {String(datum.series)}: {String(datum.users)}
            </div>
          )}
        </ChartInspect>
      </Line>
      <Legend highlight position="bottom" />
    </Chart>
  </div>
);

// Hover, inspect, legend highlight and data-change animations in both engines; the button changes data.
const ShowcaseStory: StoryFn<typeof Line> = (): ReactElement => {
  const [seed, setSeed] = useState(0);
  const data = seed ? shuffle(seed) : workspaceTrendsData;
  return (
    <div>
      <button onClick={() => setSeed(seed + 1)}>Change data</button>
      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
        <ShowcaseChart engine="vega" data={data} />
        <ShowcaseChart engine="d3" data={data} />
      </div>
    </div>
  );
};

const FeatureShowcase = bindWithProps(ShowcaseStory);

export { VegaVsD3, FeatureShowcase };
