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
import { ReactElement, useEffect, useRef, useState } from 'react';

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

const MAX_WIDTH = CHART_SIZE_BREAKPOINTS.L + 200;

const THRESHOLDS = [
  { px: CHART_SIZE_BREAKPOINTS.M, label: 'M' },
  { px: CHART_SIZE_BREAKPOINTS.L, label: 'L' },
];

const AutoDetectStory = (): ReactElement => {
  const [width, setWidth] = useState(600);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const startWidth = useRef(0);

  let currentSize = 'L';
  if (width < CHART_SIZE_BREAKPOINTS.M) currentSize = 'S';
  else if (width < CHART_SIZE_BREAKPOINTS.L) currentSize = 'M';

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      setWidth(Math.max(100, startWidth.current + (e.clientX - startX.current)));
    };
    const onMouseUp = () => { isDragging.current = false; };
    globalThis.addEventListener('mousemove', onMouseMove);
    globalThis.addEventListener('mouseup', onMouseUp);
    return () => {
      globalThis.removeEventListener('mousemove', onMouseMove);
      globalThis.removeEventListener('mouseup', onMouseUp);
    };
  }, []);

  const onHandleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    startX.current = e.clientX;
    startWidth.current = width;
    e.preventDefault();
  };

  return (
    <div style={{ padding: '16px 0' }}>
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

        {/* Resizable chart */}
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <Chart data={workspaceTrendsData} width={width} height={300}>
            <Axis position="bottom" baseline ticks labelFormat="time" />
            <Axis position="left" grid />
            <Line dimension="datetime" metric="value" color="series" scaleType="time" />
          </Chart>

          {/* Drag handle — mouse drag updates width; the native range input inside handles keyboard/AT */}
          <div
            onMouseDown={onHandleMouseDown}
            style={{
              position: 'absolute',
              right: -8,
              top: 0,
              bottom: 0,
              width: 16,
              cursor: 'ew-resize',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 20,
            }}
          >
            <input
              type="range"
              aria-label="Chart width"
              min={100}
              max={MAX_WIDTH}
              value={Math.round(width)}
              onChange={(e) => setWidth(Number(e.target.value))}
              style={{ position: 'absolute', inset: 0, opacity: 0, pointerEvents: 'none' }}
            />
            <div style={{ width: 4, height: 32, borderRadius: 2, background: '#999' }} />
          </div>
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
