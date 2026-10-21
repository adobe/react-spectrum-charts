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
import { KeyboardEvent, PointerEvent, ReactElement, useRef, useState } from 'react';

import { ActionButton, Badge, Switch, Text } from '@react-spectrum/s2';

import { DONUT_SIZE_TIER_CUTPOINTS, DONUT_SIZE_TIER_LABELED_CHART_SIZES } from '@spectrum-charts/core-s2/constants';
import { ChartData } from '@spectrum-charts/vega-spec-builder-s2';

import { Chart } from '../../../Chart.js';
import { Donut } from '../../../components/index.js';
import useChartProps from '../../../hooks/useChartProps.js';
import { DonutProps } from '../../../types/index.js';
import { TIER_LABELS, getEffectiveDiameter, getSizeTierIndex } from './ResponsiveDonut.js';

const MIN_SIZE = 80;
const KEY_STEP = 10;
// 50px past the XL breakpoint so the corner handle can reach XL
const MAX_SIZE = (DONUT_SIZE_TIER_LABELED_CHART_SIZES.at(-1) ?? 0) + 50;
const HANDLE_SIZE = 20;
const ACCENT = 'rgb(220, 60, 60)';

// the tier is read from min(width, height), so each breakpoint is a square that the chart must contain
const BREAKPOINTS = DONUT_SIZE_TIER_LABELED_CHART_SIZES.map((size, index) => ({
  size,
  tier: TIER_LABELS[index + 1],
  diameter: DONUT_SIZE_TIER_CUTPOINTS[index],
}));

const clamp = (value: number): number => Math.min(MAX_SIZE, Math.max(MIN_SIZE, Math.round(value)));

/** A donut with a corner drag handle; breakpoint squares show the chart sizes at which the donut changes size tier. */
export const ResizableDonut = ({
  data,
  donutProps,
  children,
  initialWidth = 300,
  initialHeight = 300,
}: {
  data: ChartData[];
  donutProps?: Partial<DonutProps>;
  children: DonutProps['children'];
  initialWidth?: number;
  initialHeight?: number;
}): ReactElement => {
  const [size, setSize] = useState({ width: initialWidth, height: initialHeight });
  const [showBreakpoints, setShowBreakpoints] = useState(true);
  const dragStart = useRef<{ x: number; y: number; width: number; height: number } | null>(null);
  const chartProps = useChartProps({ data });

  const chartSize = Math.min(size.width, size.height);
  const tier = TIER_LABELS[getSizeTierIndex(chartSize)];
  const diameter = Math.round(getEffectiveDiameter(chartSize));

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    dragStart.current = { x: event.clientX, y: event.clientY, ...size };
  };
  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const start = dragStart.current;
    if (!start) return;
    setSize({
      width: clamp(start.width + event.clientX - start.x),
      height: clamp(start.height + event.clientY - start.y),
    });
  };
  const onPointerUp = () => {
    dragStart.current = null;
  };
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const deltas: Record<string, [number, number]> = {
      ArrowRight: [KEY_STEP, 0],
      ArrowLeft: [-KEY_STEP, 0],
      ArrowDown: [0, KEY_STEP],
      ArrowUp: [0, -KEY_STEP],
    };
    const delta = deltas[event.key];
    if (!delta) return;
    event.preventDefault();
    setSize(({ width, height }) => ({ width: clamp(width + delta[0]), height: clamp(height + delta[1]) }));
  };

  return (
    <div style={{ padding: '16px 0', fontFamily: 'adobe-clean, sans-serif' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
        <Badge variant="informative">{`Size tier: ${tier}`}</Badge>
        <Text>{`Chart: ${size.width} × ${size.height}px`}</Text>
        <Text>{`Smaller side: ${chartSize}px`}</Text>
        <Text>{`Donut diameter: ${diameter}px`}</Text>
        <Switch isSelected={showBreakpoints} onChange={setShowBreakpoints}>
          Show breakpoints
        </Switch>
        <ActionButton onPress={() => setSize({ width: initialWidth, height: initialHeight })}>Reset</ActionButton>
      </div>
      <div style={{ position: 'relative', width: MAX_SIZE + HANDLE_SIZE, height: MAX_SIZE + HANDLE_SIZE }}>
        {showBreakpoints &&
          BREAKPOINTS.map(({ size: breakpoint, tier: label, diameter: cutpoint }) => (
            <div
              key={label}
              data-testid={`breakpoint-${label}`}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: breakpoint,
                height: breakpoint,
                boxSizing: 'border-box',
                border: `1px dashed ${ACCENT}`,
                opacity: chartSize >= breakpoint ? 1 : 0.5,
                pointerEvents: 'none',
                zIndex: 10,
              }}
            >
              <span
                style={{
                  position: 'absolute',
                  bottom: 2,
                  right: 4,
                  fontSize: 10,
                  lineHeight: 1,
                  color: ACCENT,
                  whiteSpace: 'nowrap',
                }}
              >
                {`${label}: ${Math.round(breakpoint)}px chart, ${cutpoint}px donut`}
              </span>
            </div>
          ))}
        <div style={{ position: 'absolute', top: 0, left: 0 }}>
          <Chart {...chartProps} width={size.width} height={size.height}>
            <Donut metric="count" color="browser" {...donutProps}>
              {children}
            </Donut>
          </Chart>
        </div>
        <div
          role="slider"
          aria-label="Resize chart"
          aria-valuemin={MIN_SIZE}
          aria-valuemax={MAX_SIZE}
          aria-valuenow={chartSize}
          aria-valuetext={`${size.width} by ${size.height} pixels`}
          tabIndex={0}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onKeyDown={onKeyDown}
          style={{
            position: 'absolute',
            left: size.width - HANDLE_SIZE / 2,
            top: size.height - HANDLE_SIZE / 2,
            width: HANDLE_SIZE,
            height: HANDLE_SIZE,
            cursor: 'nwse-resize',
            touchAction: 'none',
            zIndex: 20,
            background: `linear-gradient(135deg, transparent 50%, #999 50%, #999 58%, transparent 58%, transparent 70%, #999 70%, #999 78%, transparent 78%)`,
          }}
        />
      </div>
    </div>
  );
};
