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

import { CHART_SIZE_BREAKPOINTS, CHART_SIZE_POINT_SIZES } from '@spectrum-charts/constants';

import { Chart } from '../../../Chart';
import { Axis, ChartInspect, Legend, Line, ReferenceLine } from '../../../components';
import { workspaceTrendsData, workspaceTrendsDataWithVisiblePoints } from '../../../stories/data/data';
import { formatTimestamp } from '../../../stories/storyUtils';

export default {
  title: 'React Spectrum Charts 2/Line/Regressions/Size Auto Detect',
  component: Line,
};

const referenceValue = 5000;
const REFERENCE_CHART_HEIGHT = 400;
const POINT_CHART_HEIGHT = 300;
const MAX_WIDTH = CHART_SIZE_BREAKPOINTS.L + 200;
const THUMB_HEIGHT = 32;

const SIZE_THRESHOLDS = [
  { px: CHART_SIZE_BREAKPOINTS.M, label: 'M' },
  { px: CHART_SIZE_BREAKPOINTS.L, label: 'L' },
];

const POINT_DIAMETERS: Record<string, string> = {
  S: `${Math.sqrt(CHART_SIZE_POINT_SIZES.S)}px`,
  M: `${Math.sqrt(CHART_SIZE_POINT_SIZES.M)}px`,
  L: `${Math.sqrt(CHART_SIZE_POINT_SIZES.L)}px`,
};

const REFERENCE_HANDLE_STYLES = `
  .rsc-ref-size-handle {
    -webkit-appearance: none;
    appearance: none;
    background: transparent;
    border: none;
    outline: none;
    position: absolute;
    top: 0;
    left: 0;
    height: ${REFERENCE_CHART_HEIGHT}px;
    pointer-events: none;
    z-index: 20;
  }
  .rsc-ref-size-handle::-webkit-slider-runnable-track {
    background: transparent;
    height: ${REFERENCE_CHART_HEIGHT}px;
  }
  .rsc-ref-size-handle::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 8px;
    height: ${THUMB_HEIGHT}px;
    border-radius: 4px;
    background: #999;
    cursor: ew-resize;
    pointer-events: all;
    margin-top: ${(REFERENCE_CHART_HEIGHT - THUMB_HEIGHT) / 2}px;
  }
  .rsc-ref-size-handle::-moz-range-track { background: transparent; }
  .rsc-ref-size-handle::-moz-range-thumb {
    width: 8px;
    height: ${THUMB_HEIGHT}px;
    border-radius: 4px;
    background: #999;
    border: none;
    cursor: ew-resize;
  }
`;

const STATIC_POINT_HANDLE_STYLES = `
  .rsc-static-point-size-handle {
    -webkit-appearance: none;
    appearance: none;
    background: transparent;
    border: none;
    outline: none;
    position: absolute;
    top: 0;
    left: 0;
    height: ${POINT_CHART_HEIGHT}px;
    pointer-events: none;
    z-index: 20;
  }
  .rsc-static-point-size-handle::-webkit-slider-runnable-track {
    background: transparent;
    height: ${POINT_CHART_HEIGHT}px;
  }
  .rsc-static-point-size-handle::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 8px;
    height: ${THUMB_HEIGHT}px;
    border-radius: 4px;
    background: #999;
    cursor: ew-resize;
    pointer-events: all;
    margin-top: ${(POINT_CHART_HEIGHT - THUMB_HEIGHT) / 2}px;
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

const getSizeTier = (width: number): string => {
  if (width < CHART_SIZE_BREAKPOINTS.M) return 'S';
  if (width < CHART_SIZE_BREAKPOINTS.L) return 'M';
  return 'L';
};

const AutoDetectSize = (): ReactElement => {
  const [width, setWidth] = useState(600);
  const currentSize = getSizeTier(width);

  return (
    <div style={{ padding: '16px 0' }}>
      <style>{REFERENCE_HANDLE_STYLES}</style>
      <div style={{ marginBottom: 8, fontSize: 13, color: '#666' }}>
        Width: <strong>{Math.round(width)}px</strong> — Reference line size tier: <strong>{currentSize}</strong>
      </div>
      <div style={{ position: 'relative', minWidth: MAX_WIDTH }}>
        {SIZE_THRESHOLDS.map(({ px, label }) => (
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
          <Chart data={workspaceTrendsData} width={width} height={REFERENCE_CHART_HEIGHT}>
            <Axis position="left" grid title="Users">
              <ReferenceLine value={referenceValue} label="Target" />
              <ReferenceLine value={Math.round(referenceValue * 0.7)} label="Minimum" secondary />
            </Axis>
            <Axis position="bottom" labelFormat="time" baseline ticks />
            <Line dimension="datetime" metric="users" color="series" scaleType="time" />
            <Legend highlight />
          </Chart>

          <input
            type="range"
            className="rsc-ref-size-handle"
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

const StaticPointSizeAutoDetect = (): ReactElement => {
  const [width, setWidth] = useState(600);
  const currentSize = getSizeTier(width);

  return (
    <div style={{ padding: '16px 0' }}>
      <style>{STATIC_POINT_HANDLE_STYLES}</style>
      <div style={{ marginBottom: 8, fontSize: 13, color: '#666' }}>
        Width: <strong>{Math.round(width)}px</strong> — Size tier: <strong>{currentSize}</strong> — Point diameter:{' '}
        <strong>{POINT_DIAMETERS[currentSize]}</strong>
      </div>
      <div style={{ position: 'relative', minWidth: MAX_WIDTH }}>
        {SIZE_THRESHOLDS.map(({ px, label }) => (
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
          <Chart data={workspaceTrendsDataWithVisiblePoints} width={width} height={POINT_CHART_HEIGHT}>
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

export { AutoDetectSize, StaticPointSizeAutoDetect };
