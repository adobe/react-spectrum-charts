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
import { Axis, Line } from '../../../../components';
import { workspaceTrendsData } from '../../../../stories/data/data';
import { bindWithProps } from '../../../../test-utils';
import { ChartProps } from '../../../../types';

export default {
  title: 'React Spectrum Charts 2/Chart/Features/ChartSize',
  component: Chart,
};

const defaultArgs: ChartProps = { data: workspaceTrendsData, width: 600, height: 300 };

const CHART_HEIGHT = 300;
const MAX_WIDTH = CHART_SIZE_BREAKPOINTS.L + 200;
const THUMB_HEIGHT = 32;

const THRESHOLDS = [
  { px: CHART_SIZE_BREAKPOINTS.M, label: 'M' },
  { px: CHART_SIZE_BREAKPOINTS.L, label: 'L' },
];

// The range input is overlaid on the chart area. min=0 so the thumb position (in px) equals
// the value, placing it at the right edge of the chart as the user drags.
const HANDLE_STYLES = `
  .rsc-chart-size-handle {
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
  .rsc-chart-size-handle::-webkit-slider-runnable-track {
    background: transparent;
    height: ${CHART_HEIGHT}px;
  }
  .rsc-chart-size-handle::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 8px;
    height: ${THUMB_HEIGHT}px;
    border-radius: 4px;
    background: #999;
    cursor: ew-resize;
    pointer-events: all;
    margin-top: ${(CHART_HEIGHT - THUMB_HEIGHT) / 2}px;
  }
  .rsc-chart-size-handle::-moz-range-track {
    background: transparent;
  }
  .rsc-chart-size-handle::-moz-range-thumb {
    width: 8px;
    height: ${THUMB_HEIGHT}px;
    border-radius: 4px;
    background: #999;
    border: none;
    cursor: ew-resize;
  }
`;

const AutoDetectStory = (): ReactElement => {
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
      {/* Outer container holds threshold lines at fixed positions regardless of chart width */}
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
          <Chart data={workspaceTrendsData} width={width} height={CHART_HEIGHT}>
            <Axis position="bottom" baseline ticks labelFormat="time" />
            <Axis position="left" grid />
            <Line dimension="datetime" metric="value" color="series" scaleType="time" />
          </Chart>

          <input
            type="range"
            className="rsc-chart-size-handle"
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

const FixedSizeStory: StoryFn<typeof Chart> = (args): ReactElement => (
  <Chart {...args}>
    <Axis position="bottom" baseline ticks labelFormat="time" />
    <Axis position="left" grid />
    <Line dimension="datetime" metric="value" color="series" scaleType="time" />
  </Chart>
);

export const AutoDetect = AutoDetectStory;

const SizeS = bindWithProps(FixedSizeStory);
SizeS.args = {
  ...defaultArgs,
  width: 300,
};

const SizeM = bindWithProps(FixedSizeStory);
SizeM.args = {
  ...defaultArgs,
  width: 600,
};

const SizeL = bindWithProps(FixedSizeStory);
SizeL.args = {
  ...defaultArgs,
  width: 900,
};

export { SizeS, SizeM, SizeL };
