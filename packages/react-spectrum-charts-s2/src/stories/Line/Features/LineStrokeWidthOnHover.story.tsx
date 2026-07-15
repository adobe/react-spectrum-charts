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

import { CHART_SIZE_BREAKPOINTS, CHART_SIZE_HOVER_STROKE_WIDTHS, CHART_SIZE_STROKE_WIDTHS } from '@spectrum-charts/constants';

import { Chart } from '../../../Chart';
import { Axis, ChartInspect, Legend, Line } from '../../../components';
import { workspaceTrendsData } from '../../../stories/data/data';

export default {
  title: 'React Spectrum Charts 2/Line/Features/StrokeWidthOnHover',
  component: Line,
};

const CHART_HEIGHT = 300;
const MAX_WIDTH = CHART_SIZE_BREAKPOINTS.L + 200;
const THUMB_HEIGHT = 32;

const THRESHOLDS = [
  { px: CHART_SIZE_BREAKPOINTS.M, label: 'M' },
  { px: CHART_SIZE_BREAKPOINTS.L, label: 'L' },
];

const HANDLE_STYLES = `
  .rsc-stroke-width-handle {
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
  .rsc-stroke-width-handle::-webkit-slider-runnable-track {
    background: transparent;
    height: ${CHART_HEIGHT}px;
  }
  .rsc-stroke-width-handle::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 8px;
    height: ${THUMB_HEIGHT}px;
    border-radius: 4px;
    background: #999;
    cursor: ew-resize;
    pointer-events: all;
    margin-top: ${(CHART_HEIGHT - THUMB_HEIGHT) / 2}px;
  }
  .rsc-stroke-width-handle::-moz-range-track { background: transparent; }
  .rsc-stroke-width-handle::-moz-range-thumb {
    width: 8px;
    height: ${THUMB_HEIGHT}px;
    border-radius: 4px;
    background: #999;
    border: none;
    cursor: ew-resize;
  }
`;

const getSizeTier = (width: number): 'S' | 'M' | 'L' => {
  if (width < CHART_SIZE_BREAKPOINTS.M) return 'S';
  if (width < CHART_SIZE_BREAKPOINTS.L) return 'M';
  return 'L';
};

const groupedData = [
  ...workspaceTrendsData.slice(0, 7).map((d) => ({ ...d, category: 'Analyze' })),
  ...workspaceTrendsData.slice(7, 14).map((d) => ({ ...d, category: 'Analyze' })),
  ...workspaceTrendsData.slice(14, 21).map((d) => ({ ...d, category: 'Visualize' })),
  ...workspaceTrendsData.slice(21).map((d) => ({ ...d, category: 'Visualize' })),
];

const ResizableChart = ({ children }: { children: (width: number) => ReactElement }): ReactElement => {
  const [width, setWidth] = useState(600);
  const tier = getSizeTier(width);

  return (
    <div style={{ padding: '16px 0' }}>
      <style>{HANDLE_STYLES}</style>
      <div style={{ marginBottom: 8, fontSize: 13, color: '#666', lineHeight: 1.6 }}>
        <div>Width: <strong>{Math.round(width)}px</strong> — Size tier: <strong>{tier}</strong></div>
        <div>
          Stroke width: <strong>{CHART_SIZE_STROKE_WIDTHS[tier]}px</strong> base →{' '}
          <strong>{CHART_SIZE_HOVER_STROKE_WIDTHS[tier]}px</strong> on hover/select
        </div>
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
            <span style={{ position: 'absolute', top: 2, left: 3, fontSize: 10, color: 'rgba(220, 60, 60, 0.9)', whiteSpace: 'nowrap', lineHeight: 1 }}>
              {label} ({px}px)
            </span>
          </div>
        ))}
        <div style={{ position: 'relative', display: 'inline-block' }}>
          {children(width)}
          <input
            type="range"
            className="rsc-stroke-width-handle"
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

export const StrokeWidthOnHover = (): ReactElement => (
  <ResizableChart>
    {(width) => (
      <Chart data={workspaceTrendsData} width={width} height={CHART_HEIGHT}>
        <Axis position="bottom" baseline ticks labelFormat="time" />
        <Axis position="left" grid />
        <Line dimension="datetime" metric="value" color="series" scaleType="time">
          <ChartInspect>
            {(datum) => (
              <div>
                <div>{datum.series}</div>
                <div>{Number(datum.value).toLocaleString()}</div>
              </div>
            )}
          </ChartInspect>
        </Line>
        <Legend highlight />
      </Chart>
    )}
  </ResizableChart>
);

export const StrokeWidthOnHoverGroupLegend = (): ReactElement => (
  <ResizableChart>
    {(width) => (
      <Chart data={groupedData} width={width} height={CHART_HEIGHT} debug={true}>
        <Axis position="bottom" baseline ticks labelFormat="time" />
        <Axis position="left" grid />
        <Line dimension="datetime" metric="value" color="series" lineType="category" scaleType="time">
          <ChartInspect>
            {(datum) => (
              <div>
                <div>{datum.series}</div>
                <div>{Number(datum.value).toLocaleString()}</div>
              </div>
            )}
          </ChartInspect>
        </Line>
        <Legend keys={['category']} highlight />
      </Chart>
    )}
  </ResizableChart>
);
