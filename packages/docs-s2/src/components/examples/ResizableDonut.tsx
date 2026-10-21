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
import React, { useRef, useState } from 'react';

import BrowserOnly from '@docusaurus/BrowserOnly';
import { useColorMode } from '@docusaurus/theme-common';
import { useMove } from 'react-aria';

import { ActionButton, Badge, Provider, Switch, Text } from '@react-spectrum/s2';
import {
  DONUT_BASE_PADDING,
  DONUT_LABEL_MIN_SPACE_RATIO,
  DONUT_LABEL_RING_GAPS,
  DONUT_RING_WIDTHS,
  DONUT_SIZE_TIER_CUTPOINTS,
  DONUT_SIZE_TIER_LABELED_CHART_SIZES,
  DONUT_SIZE_TIER_UNLABELED_CHART_SIZES,
} from '@spectrum-charts/core-s2/constants';
import { spectrum2Colors } from '@spectrum-charts/core-s2/tokens';
import { Donut, DonutSummary, SegmentLabel } from '@spectrum-charts/react-spectrum-charts-s2';

import { DocsChart as Chart } from './DocsChart';
import { browserData } from './data';

const TIERS = ['XS', 'S', 'M', 'L', 'XL'];
const MIN_SIZE = 80;
const KEY_STEP = 10;
// just past the labeled XL breakpoint so every tier can be reached
const MAX_SIZE = (DONUT_SIZE_TIER_LABELED_CHART_SIZES.at(-1) ?? 0) + 26;
const HANDLE_SIZE = 16;
const GRIP_COLOR = `light-dark(${spectrum2Colors.light['gray-700']}, ${spectrum2Colors.dark['gray-700']})`;
const ACCENT = 'rgb(220, 60, 60)';
const INITIAL_SIZE = { width: 400, height: 400 };

const clamp = (value: number): number => Math.min(MAX_SIZE, Math.max(MIN_SIZE, Math.round(value)));

const getSizeTierIndex = (chartSize: number, labeled: boolean): number =>
  (labeled ? DONUT_SIZE_TIER_LABELED_CHART_SIZES : DONUT_SIZE_TIER_UNLABELED_CHART_SIZES).filter(
    (breakpoint) => chartSize >= breakpoint
  ).length;

const getDonutDiameter = (chartSize: number, labeled: boolean): number => {
  if (!labeled) return chartSize - 2 * DONUT_BASE_PADDING;
  const tier = getSizeTierIndex(chartSize, true);
  const labelFitDiameter = (2 * (chartSize / 2 - 2 - DONUT_LABEL_RING_GAPS[tier])) / (1 + DONUT_LABEL_MIN_SPACE_RATIO);
  return Math.min(labelFitDiameter, DONUT_SIZE_TIER_CUTPOINTS[tier] ?? Number.POSITIVE_INFINITY);
};

const ResizableDonut = () => {
  const { colorMode } = useColorMode();
  const [size, setSize] = useState(INITIAL_SIZE);
  const [labeled, setLabeled] = useState(true);
  const [showBreakpoints, setShowBreakpoints] = useState(true);

  const chartSize = Math.min(size.width, size.height);
  const tierIndex = getSizeTierIndex(chartSize, labeled);
  const diameter = Math.max(0, Math.round(getDonutDiameter(chartSize, labeled)));
  const breakpoints = labeled ? DONUT_SIZE_TIER_LABELED_CHART_SIZES : DONUT_SIZE_TIER_UNLABELED_CHART_SIZES;

  // accumulates unclamped deltas so the handle stays under the pointer after hitting a size limit
  const rawSize = useRef(size);
  const { moveProps } = useMove({
    onMoveStart() {
      rawSize.current = size;
    },
    onMove({ deltaX, deltaY, pointerType }) {
      const step = pointerType === 'keyboard' ? KEY_STEP : 1;
      rawSize.current = {
        width: rawSize.current.width + deltaX * step,
        height: rawSize.current.height + deltaY * step,
      };
      setSize({ width: clamp(rawSize.current.width), height: clamp(rawSize.current.height) });
    },
  });

  return (
    <Provider colorScheme={colorMode} background="base">
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8, flexWrap: 'wrap' }}>
        <Switch isSelected={labeled} onChange={setLabeled}>
          Segment labels
        </Switch>
        <Switch isSelected={showBreakpoints} onChange={setShowBreakpoints}>
          Breakpoints
        </Switch>
        <ActionButton size="S" onPress={() => setSize(INITIAL_SIZE)}>
          Reset size
        </ActionButton>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
        <Badge variant="informative">{`Size tier: ${TIERS[tierIndex]}`}</Badge>
        <Text>{`Chart: ${size.width} × ${size.height}px`}</Text>
        <Text>{`Donut diameter: ${diameter}px`}</Text>
        <Text>{`Ring width: ${DONUT_RING_WIDTHS[tierIndex]}px`}</Text>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <div style={{ position: 'relative', width: MAX_SIZE + HANDLE_SIZE, height: MAX_SIZE + HANDLE_SIZE }}>
          {showBreakpoints &&
            breakpoints.map((breakpoint, index) => (
              <div
                key={TIERS[index + 1]}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: breakpoint,
                  height: breakpoint,
                  boxSizing: 'border-box',
                  border: `1px dashed ${ACCENT}`,
                  opacity: chartSize >= breakpoint ? 1 : 0.4,
                  pointerEvents: 'none',
                  zIndex: 10,
                }}
              >
                <span
                  style={{
                    position: 'absolute',
                    bottom: 2,
                    right: 4,
                    fontSize: 11,
                    lineHeight: 1,
                    color: ACCENT,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {`${TIERS[index + 1]} ≥ ${breakpoint}px`}
                </span>
              </div>
            ))}
          <div style={{ position: 'absolute', top: 0, left: 0 }}>
            <Chart data={browserData} width={size.width} height={size.height}>
              <Donut metric="count" color="browser">
                <DonutSummary label="Visitors" />
                {labeled ? <SegmentLabel percent swatch showValueRow /> : undefined}
              </Donut>
            </Chart>
          </div>
          <button
            type="button"
            aria-label={`Resize chart, ${size.width} by ${size.height} pixels. Use arrow keys to resize.`}
            {...moveProps}
            style={{
              position: 'absolute',
              left: size.width - HANDLE_SIZE,
              top: size.height - HANDLE_SIZE,
              width: HANDLE_SIZE,
              height: HANDLE_SIZE,
              cursor: 'nwse-resize',
              touchAction: 'none',
              padding: 0,
              border: 'none',
              zIndex: 20,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'transparent',
            }}
          >
            <svg viewBox="0 0 16 16" width={HANDLE_SIZE} height={HANDLE_SIZE} aria-hidden="true">
              <path d="M14 4 4 14M14 9l-5 5" style={{ stroke: GRIP_COLOR, strokeWidth: 1.5, strokeLinecap: 'round' }} />
            </svg>
          </button>
        </div>
      </div>
    </Provider>
  );
};

/**
 * Donut with a corner resize handle that outlines the chart size where each size tier starts.
 * @returns example element
 */
export const ResizableDonutExample = () => (
  <div
    style={{
      padding: 16,
      marginBottom: 'var(--ifm-leading)',
      background: 'var(--ifm-color-emphasis-100)',
      borderRadius: 16,
    }}
  >
    <BrowserOnly fallback={<div style={{ height: MAX_SIZE + HANDLE_SIZE + 100 }} />}>
      {() => <ResizableDonut />}
    </BrowserOnly>
  </div>
);
