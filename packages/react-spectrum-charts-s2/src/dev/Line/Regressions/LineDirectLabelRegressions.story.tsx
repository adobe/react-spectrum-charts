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

import { CHART_SIZE_BREAKPOINTS } from '@spectrum-charts/constants';

import { Chart } from '../../../Chart';
import { Axis, ChartInspect, Legend, Line, LineDirectLabel } from '../../../components';
import useChartProps from '../../../hooks/useChartProps';
import { workspaceTrendsData } from '../../../stories/data/data';
import { bindWithProps } from '../../../test-utils';
import { ChartProps } from '../../../types';

const labelCollisionData = workspaceTrendsData.map((d) =>
  d.series === 'Add Line viz' && d.datetime === 1668409200000 ? { ...d, users: 3500 } : d
);

export default {
  title: 'React Spectrum Charts 2/Line/Regressions/Direct Label',
  component: LineDirectLabel,
};

const defaultChartProps: ChartProps = { data: workspaceTrendsData, minWidth: 100, maxWidth: 1000, height: 400, backgroundColor: 'gray-50' };

const CHART_HEIGHT = 400;
const MAX_WIDTH = CHART_SIZE_BREAKPOINTS.L + 200;
const THUMB_HEIGHT = 32;

const HANDLE_STYLES = `
  .rsc-dl-size-handle {
    -webkit-appearance: none;
    appearance: none;
    background: transparent;
    border: none;
    outline: none;
    position: absolute;
    top: 0;
    left: 0;
    height: ${CHART_HEIGHT}px;
    pointer-events: none;
    z-index: 20;
  }
  .rsc-dl-size-handle::-webkit-slider-runnable-track {
    background: transparent;
    height: ${CHART_HEIGHT}px;
  }
  .rsc-dl-size-handle::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 8px;
    height: ${THUMB_HEIGHT}px;
    border-radius: 4px;
    background: #999;
    cursor: ew-resize;
    pointer-events: all;
    margin-top: ${(CHART_HEIGHT - THUMB_HEIGHT) / 2}px;
  }
  .rsc-dl-size-handle::-moz-range-track { background: transparent; }
  .rsc-dl-size-handle::-moz-range-thumb {
    width: 8px;
    height: ${THUMB_HEIGHT}px;
    border-radius: 4px;
    background: #999;
    border: none;
    cursor: ew-resize;
  }
`;

const THRESHOLDS = [
  { px: CHART_SIZE_BREAKPOINTS.M, label: 'M' },
  { px: CHART_SIZE_BREAKPOINTS.L, label: 'L' },
];

const manySeriesData = (
  [
    ['Series A', 9800, 9500],
    ['Series B', 9000, 8700],
    ['Series C', 8200, 7900],
    ['Series D', 7500, 7200],
    ['Series E', 6800, 6500],
    ['Series F', 6100, 5800],
    ['Series G', 5400, 5200],
    ['Series H', 4800, 4600],
    ['Series I', 4200, 4000],
    ['Series J', 3600, 3400],
    ['Series K', 3100, 2900],
    ['Series L', 2600, 2400],
    ['Series M', 2100, 1900],
    ['Series N', 1700, 1500],
    ['Series O', 1300, 1100],
    ['Series P', 1000, 800],
    ['Series Q', 700, 550],
    ['Series R', 450, 350],
    ['Series S', 250, 180],
    ['Series T', 120, 60],
  ] as [string, number, number][]
).flatMap(([series, start, end]) =>
  Array.from({ length: 7 }, (_, i) => ({
    datetime: 1667890800000 + i * 86400000,
    users: Math.round(start + (end - start) * (i / 6)),
    series,
  }))
);

const LineDirectLabelLabelCollisionStory: StoryFn<typeof LineDirectLabel> = (args): ReactElement => {
  const chartProps = useChartProps({ ...defaultChartProps, data: labelCollisionData });
  return (
    <Chart {...chartProps} debug>
      <Axis position="left" grid title="Users" />
      <Axis position="bottom" labelFormat="time" baseline ticks />
      <Line dimension="datetime" metric="users" color="series" scaleType="time">
        <LineDirectLabel {...args} />
        <ChartInspect>{(datum: Record<string, string>) => <div>{datum.users}</div>}</ChartInspect>
      </Line>
      <Legend highlight />
    </Chart>
  );
};

const DirectLabelSizeScalingStory: StoryFn<typeof LineDirectLabel> = (args): ReactElement => {
  const chartProps = useChartProps(defaultChartProps);
  const [width, setWidth] = useState(600);

  let currentSize = 'L';
  if (width < CHART_SIZE_BREAKPOINTS.M) currentSize = 'S';
  else if (width < CHART_SIZE_BREAKPOINTS.L) currentSize = 'M';

  return (
    <div style={{ padding: '16px 0' }}>
      <style>{HANDLE_STYLES}</style>
      <div style={{ marginBottom: 8, fontSize: 13, color: '#666' }}>
        Width: <strong>{Math.round(width)}px</strong> — Size tier: <strong>{currentSize}</strong>
      </div>
      <div style={{ position: 'relative', minWidth: MAX_WIDTH }}>
        {THRESHOLDS.map(({ px, label }) => (
          <div
            key={label}
            style={{
              position: 'absolute',
              left: px,
              top: 0,
              bottom: 0,
              width: 1,
              background: 'rgba(220, 60, 60, 0.6)',
              zIndex: 10,
              pointerEvents: 'none',
            }}
          >
            <span
              style={{
                position: 'absolute',
                top: 2,
                left: 3,
                fontSize: 10,
                color: 'rgba(220, 60, 60, 0.9)',
                whiteSpace: 'nowrap',
                lineHeight: 1,
              }}
            >
              {label} ({px}px)
            </span>
          </div>
        ))}
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <Chart {...chartProps} data={workspaceTrendsData} width={width} height={CHART_HEIGHT} debug>
            <Axis position="left" grid title="Users" />
            <Axis position="bottom" labelFormat="time" baseline ticks />
            <Line dimension="datetime" metric="users" color="series" scaleType="time">
              <LineDirectLabel value="series" {...args} />
            </Line>
            <Legend highlight />
          </Chart>
          <input
            type="range"
            className="rsc-dl-size-handle"
            aria-label="Chart width"
            min={0}
            max={MAX_WIDTH}
            value={Math.round(width)}
            onChange={(e) => setWidth(Math.max(100, Number(e.target.value)))}
            style={{ width: MAX_WIDTH }}
          />
        </div>
      </div>
    </div>
  );
};

const LineDirectLabelManySeriesStory: StoryFn<typeof LineDirectLabel> = (args): ReactElement => {
  const chartProps = useChartProps({ ...defaultChartProps, data: manySeriesData });
  return (
    <Chart {...chartProps} debug>
      <Axis position="left" grid title="Users" />
      <Axis position="bottom" labelFormat="time" baseline ticks />
      <Line dimension="datetime" metric="users" color="series" scaleType="time">
        <LineDirectLabel {...args} />
        <ChartInspect>{(datum: Record<string, string>) => <div>{datum.users}</div>}</ChartInspect>
      </Line>
    </Chart>
  );
};

const LineDirectLabelManySeriesLegendStory: StoryFn<typeof LineDirectLabel> = (args): ReactElement => {
  const chartProps = useChartProps({ ...defaultChartProps, data: manySeriesData });
  return (
    <Chart {...chartProps} debug>
      <Axis position="left" grid title="Users" />
      <Axis position="bottom" labelFormat="time" baseline ticks />
      <Line dimension="datetime" metric="users" color="series" scaleType="time">
        <LineDirectLabel {...args} />
      </Line>
      <Legend highlight />
    </Chart>
  );
};

const DirectLabelLabelCollision = bindWithProps(LineDirectLabelLabelCollisionStory);
DirectLabelLabelCollision.args = { value: 'series', excludeSeries: ['Add Line viz'] };

const DirectLabelSizeScaling = DirectLabelSizeScalingStory;

const DirectLabelManySeries = bindWithProps(LineDirectLabelManySeriesStory);
DirectLabelManySeries.args = { value: 'series' };

const DirectLabelManySeriesLegend = bindWithProps(LineDirectLabelManySeriesLegendStory);
DirectLabelManySeriesLegend.args = { value: 'series' };

export {
  DirectLabelLabelCollision,
  DirectLabelSizeScaling,
  DirectLabelManySeries,
  DirectLabelManySeriesLegend,
};
