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
import { ReactElement, useRef } from 'react';

import { ActionButton } from '@react-spectrum/s2';
import { ChartHandle } from '@spectrum-charts/vega-spec-builder-s2';

import { Chart } from '../../../../Chart.js';
import { Axis, ChartInspect, Donut, DonutSummary, Legend, Line, SegmentLabel } from '../../../../components/index.js';
import { visitsByChannelData } from '../../../../stories/Line/lineData.js';
import { basicDonutData } from '../../../../storyShared/Donut/data.js';
import { ChartProps } from '../../../../types/index.js';

export default {
  title: 'React Spectrum Charts 2/Chart/Coverage/Native Engine',
  tags: ['alpha'],
  component: Chart,
};

const SideBySide = ({ render }: { render: (engine: ChartProps['engine']) => ReactElement }) => (
  <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
    {(['vega', 'native'] as const).map((engine) => (
      <div key={engine} style={{ width: 520 }}>
        <h3>{engine}</h3>
        {render(engine)}
      </div>
    ))}
  </div>
);

const LineChart = (engine: ChartProps['engine']) => (
  <Chart data={visitsByChannelData} engine={engine} width={520} height={360} title="Visits by channel">
    <Axis position="left" grid title="Visits" numberFormat="shortNumber" />
    <Axis position="bottom" labelFormat="time" baseline ticks />
    <Line color="channel" dimension="datetime" metric="visits">
      <ChartInspect />
    </Line>
    <Legend position="bottom" />
  </Chart>
);

const DonutChart = (engine: ChartProps['engine']) => (
  <Chart data={basicDonutData} engine={engine} width={520} height={360}>
    <Donut color="browser" metric="count">
      <DonutSummary label="Visitors" />
      <SegmentLabel />
    </Donut>
    <Legend position="right" title="Browsers" />
  </Chart>
);

export const LineComparison = () => <SideBySide render={LineChart} />;

export const DonutComparison = () => <SideBySide render={DonutChart} />;

// Native-engine export goes through the same ChartHandle as Vega.
export const NativeExport = () => {
  const ref = useRef<ChartHandle>(null);
  return (
    <div>
      <ActionButton onPress={() => ref.current?.download('native-line')}>Download PNG</ActionButton>
      <ActionButton onPress={async () => console.log(await ref.current?.getSvg())}>Log SVG</ActionButton>
      <Chart ref={ref} data={visitsByChannelData} engine="native" width={520} height={360} title="Visits by channel">
        <Axis position="left" grid title="Visits" />
        <Axis position="bottom" labelFormat="time" />
        <Line color="channel" dimension="datetime" metric="visits" />
        <Legend position="bottom" />
      </Chart>
    </div>
  );
};

// Unsupported marks fall back to Vega with a console warning.
export const UnsupportedFallback = () => (
  <Chart data={visitsByChannelData} engine="native" width={520} height={360}>
    <Axis position="left" grid />
    <Axis position="bottom" labelFormat="time" />
    <Line color="channel" dimension="datetime" metric="visits" />
    <Line color="channel" dimension="datetime" metric="visits" name="second" />
  </Chart>
);
