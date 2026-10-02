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

import { CHART_SIZE_BREAKPOINTS } from '@spectrum-charts/constants';
import { LineType } from '@spectrum-charts/vega-spec-builder-s2';

import { Chart } from '../../../Chart';
import { Axis, Legend, Line } from '../../../components';

export default {
  title: 'React Spectrum Charts 2/Line/Features',
  component: Line,
};

const LINE_TYPES: LineType[] = ['dashed', 'dotted', 'dotDash', 'shortDash', 'longDash', 'twoDash'];
const START_DATE = Date.UTC(2023, 10, 8);
const DAY_MS = 24 * 60 * 60 * 1000;
const data = LINE_TYPES.flatMap((series, seriesIndex) =>
  Array.from({ length: 7 }, (_, day) => ({
    datetime: START_DATE + day * DAY_MS,
    series,
    value: (LINE_TYPES.length - seriesIndex) * 10 + Math.sin(day + seriesIndex) * 3,
  }))
);

const CHART_HEIGHT = 400;
const MAX_WIDTH = CHART_SIZE_BREAKPOINTS.L + 200;
const THUMB_HEIGHT = 32;
const THRESHOLDS = [
  { px: CHART_SIZE_BREAKPOINTS.M, label: 'M' },
  { px: CHART_SIZE_BREAKPOINTS.L, label: 'L' },
];

const HANDLE_STYLES = `
  .rsc-line-type-size-handle {
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
  .rsc-line-type-size-handle::-webkit-slider-runnable-track {
    background: transparent;
    height: ${CHART_HEIGHT}px;
  }
  .rsc-line-type-size-handle::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 8px;
    height: ${THUMB_HEIGHT}px;
    border-radius: 4px;
    background: #999;
    cursor: ew-resize;
    pointer-events: all;
    margin-top: ${(CHART_HEIGHT - THUMB_HEIGHT) / 2}px;
  }
  .rsc-line-type-size-handle::-moz-range-track {
    background: transparent;
  }
  .rsc-line-type-size-handle::-moz-range-thumb {
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

// Drag the handle across the S/M/L breakpoints to compare dash spacing at each chart size.
const LineTypeChartSizeStory = (): ReactElement => {
  const [width, setWidth] = useState(600);

  return (
    <div style={{ padding: '16px 0' }}>
      <style>{HANDLE_STYLES}</style>
      <div style={{ marginBottom: 8, fontSize: 13, color: '#666' }}>
        Width: <strong>{width}px</strong> — Size tier: <strong>{getSizeTier(width)}</strong>
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
          <Chart data={data} width={width} height={CHART_HEIGHT} lineTypes={LINE_TYPES}>
            <Axis position="bottom" baseline ticks labelFormat="time" />
            <Axis position="left" grid />
            <Line dimension="datetime" metric="value" color="series" lineType="series" scaleType="time" />
            <Legend />
          </Chart>

          <input
            type="range"
            className="rsc-line-type-size-handle"
            aria-label="Chart width"
            min={0}
            max={MAX_WIDTH}
            value={width}
            onChange={(e) => setWidth(Math.max(100, Number(e.target.value)))}
            style={{ width: MAX_WIDTH }}
          />
        </div>
      </div>
    </div>
  );
};

export const LineTypeChartSize = LineTypeChartSizeStory;
