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

import { Chart } from '../../../../Chart';
import { Axis, ChartInspect, Legend, Line } from '../../../../components';
import useChartProps from '../../../../hooks/useChartProps';
import { workspaceTrendsDataWithVisiblePoints } from '../../../../stories/data/data';
import { formatTimestamp } from '../../../../stories/storyUtils';
import { bindWithProps } from '../../../../test-utils';
import { ChartProps } from '../../../../types';

export default {
  title: 'React Spectrum Charts 2/Line/Features/StaticPoint',
  component: Line,
};

const defaultChartProps: ChartProps = {
  data: workspaceTrendsDataWithVisiblePoints,
  minWidth: 400,
  maxWidth: 800,
  height: 400,
};

const LineWithStaticPointStory: StoryFn<typeof Line> = (args): ReactElement => {
  const chartProps = useChartProps(defaultChartProps);
  return (
    <Chart {...chartProps}>
      <Axis position="left" grid title="Users" />
      <Axis position="bottom" labelFormat="time" baseline ticks />
      <Line {...args} />
      <Legend highlight />
    </Chart>
  );
};

/**
 * S2 static points render as a solid filled circle (series color) with a background-colored
 * halo ring behind it. The halo uses BACKGROUND_COLOR so it tracks the chart's backgroundColor
 * prop at runtime.
 */
const StaticPointSolidFill = bindWithProps(LineWithStaticPointStory);
StaticPointSolidFill.args = {
  color: 'series',
  name: 'line0',
  dimension: 'datetime',
  metric: 'value',
  scaleType: 'time',
  staticPoint: 'staticPoint',
};

const CHART_HEIGHT = 300;
const MAX_WIDTH = CHART_SIZE_BREAKPOINTS.L + 200;
const THUMB_HEIGHT = 32;

const POINT_SIZE_THRESHOLDS = [
  { px: CHART_SIZE_BREAKPOINTS.M, label: 'M' },
  { px: CHART_SIZE_BREAKPOINTS.L, label: 'L' },
];

const POINT_DIAMETERS: Record<string, string> = { S: '4px', M: '6px', L: '8px' };

const HANDLE_STYLES = `
  .rsc-static-point-size-handle {
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
  .rsc-static-point-size-handle::-webkit-slider-runnable-track {
    background: transparent;
    height: ${CHART_HEIGHT}px;
  }
  .rsc-static-point-size-handle::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 8px;
    height: ${THUMB_HEIGHT}px;
    border-radius: 4px;
    background: #999;
    cursor: ew-resize;
    pointer-events: all;
    margin-top: ${(CHART_HEIGHT - THUMB_HEIGHT) / 2}px;
  }
  .rsc-static-point-size-handle::-moz-range-track {
    background: transparent;
  }
  .rsc-static-point-size-handle::-moz-range-thumb {
    width: 8px;
    height: ${THUMB_HEIGHT}px;
    border-radius: 4px;
    background: #999;
    border: none;
    cursor: ew-resize;
  }
`;

const StaticPointSizeAutoDetectStory = (): ReactElement => {
  const [width, setWidth] = useState(600);

  let currentSize = 'L';
  if (width < CHART_SIZE_BREAKPOINTS.M) currentSize = 'S';
  else if (width < CHART_SIZE_BREAKPOINTS.L) currentSize = 'M';

  return (
    <div style={{ padding: '16px 0' }}>
      <style>{HANDLE_STYLES}</style>
      <div style={{ marginBottom: 8, fontSize: 13, color: '#666' }}>
        Width: <strong>{Math.round(width)}px</strong> — Size tier: <strong>{currentSize}</strong> — Point diameter:{' '}
        <strong>{POINT_DIAMETERS[currentSize]}</strong>
      </div>
      <div style={{ position: 'relative', minWidth: MAX_WIDTH }}>
        {POINT_SIZE_THRESHOLDS.map(({ px, label }) => (
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
          <Chart data={workspaceTrendsDataWithVisiblePoints} width={width} height={CHART_HEIGHT}>
            <Axis position="bottom" baseline ticks labelFormat="time" />
            <Axis position="left" grid />
            <Line dimension="datetime" metric="value" color="series" scaleType="time" staticPoint="staticPoint">
              <ChartInspect>
                {(datum) => (
                  <div>
                    <div>{formatTimestamp(datum.datetime as number)}</div>
                    <div>Event: {datum.series as string}</div>
                    <div>Users: {Number(datum.value).toLocaleString()}</div>
                  </div>
                )}
              </ChartInspect>
            </Line>
          </Chart>

          <input
            type="range"
            className="rsc-static-point-size-handle"
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

export const StaticPointSizeAutoDetect = StaticPointSizeAutoDetectStory;

export { StaticPointSolidFill };
