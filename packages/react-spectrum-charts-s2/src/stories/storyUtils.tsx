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
import { ReactElement, ReactNode, useState } from 'react';

import { CHART_SIZE_BREAKPOINTS } from '@spectrum-charts/constants';

const RESIZE_THUMB_HEIGHT = 32;
export const RESIZE_MAX_WIDTH = CHART_SIZE_BREAKPOINTS.L + 200;

export const CHART_SIZE_THRESHOLDS = [
  { px: CHART_SIZE_BREAKPOINTS.M, label: 'M' },
  { px: CHART_SIZE_BREAKPOINTS.L, label: 'L' },
];

interface ResizableChartProps {
  chartHeight?: number;
  maxWidth?: number;
  thresholds?: Array<{ px: number; label: string }>;
  renderLabel?: (width: number) => ReactNode;
  initialWidth?: number;
  // Rendered once — pass a <Chart width="auto"> element. The slider resizes the wrapping div,
  // and Chart's own ResizeObserver picks that up, exactly like a real container resize. This
  // avoids recreating the chart's children on every drag tick (which forces a full re-embed
  // instead of an in-place resize).
  children: ReactElement;
}

export const ResizableChart = ({
  chartHeight = 300,
  maxWidth = RESIZE_MAX_WIDTH,
  thresholds,
  renderLabel,
  initialWidth = 600,
  children,
}: ResizableChartProps): ReactElement => {
  const [width, setWidth] = useState(initialWidth);

  const handleStyles = `
    .rsc-resize-handle {
      -webkit-appearance: none;
      appearance: none;
      background: transparent;
      border: none;
      outline: none;
      position: absolute;
      top: 0;
      left: 0;
      height: ${chartHeight}px;
      pointer-events: none;
      z-index: 20;
    }
    .rsc-resize-handle::-webkit-slider-runnable-track {
      background: transparent;
      height: ${chartHeight}px;
    }
    .rsc-resize-handle::-webkit-slider-thumb {
      -webkit-appearance: none;
      width: 8px;
      height: ${RESIZE_THUMB_HEIGHT}px;
      border-radius: 4px;
      background: #999;
      cursor: ew-resize;
      pointer-events: all;
      margin-top: ${(chartHeight - RESIZE_THUMB_HEIGHT) / 2}px;
    }
    .rsc-resize-handle::-moz-range-track { background: transparent; }
    .rsc-resize-handle::-moz-range-thumb {
      width: 8px;
      height: ${RESIZE_THUMB_HEIGHT}px;
      border-radius: 4px;
      background: #999;
      border: none;
      cursor: ew-resize;
    }
  `;

  return (
    <div style={{ padding: '16px 0' }}>
      <style>{handleStyles}</style>
      <div style={{ marginBottom: 8, fontSize: 13, color: '#666' }}>
        {renderLabel ? renderLabel(width) : <>Width: <strong>{Math.round(width)}px</strong></>}
      </div>
      <div style={{ position: 'relative', minWidth: maxWidth }}>
        {thresholds?.map(({ px, label }) => (
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
          <div style={{ width }}>{children}</div>
          <input
            type="range"
            className="rsc-resize-handle"
            aria-label="Chart width"
            min={0}
            max={maxWidth}
            value={Math.round(width)}
            onChange={(e) => setWidth(Math.max(100, Number(e.target.value)))}
            style={{ width: maxWidth }}
          />
        </div>
      </div>
    </div>
  );
};

/**
 * converts a timestamp to a MMM D format
 * @param timestamp
 * @returns
 */
export const formatTimestamp = (timestamp: number): string => {
  // Create a Date object from the timestamp (assuming the timestamp is in milliseconds)
  const date = new Date(timestamp);

  // Define an array of month abbreviations
  const monthAbbreviations = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  // Get the month and day from the Date object
  const month = monthAbbreviations[date.getMonth()];
  const day = date.getDate();

  // Format the date in 'MMM D' format
  return `${month} ${day}`;
};
