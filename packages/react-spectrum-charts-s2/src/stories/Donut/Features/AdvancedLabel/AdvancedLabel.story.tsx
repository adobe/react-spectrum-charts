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

import {
  DONUT_LABEL_MAX_ANCHOR_OFFSET_RATIO,
  DONUT_LABEL_RING_GAP,
  DONUT_SIZE_TIER_CUTPOINTS,
} from '@spectrum-charts/constants';

import { Chart } from '../../../../Chart';
import useChartProps from '../../../../hooks/useChartProps';
import { AdvancedLabel, Donut } from '../../../../pre-alpha';
import { bindWithProps } from '../../../../test-utils';
import { AdvancedLabelProps } from '../../../../types';
import { basicDonutData } from '../../../components/Donut/data';

export default {
  title: 'React Spectrum Charts 2/Donut/Features/Advanced Label',
  component: AdvancedLabel,
};

const AdvancedLabelStory: StoryFn<typeof AdvancedLabel> = (args): ReactElement => {
  const chartProps = useChartProps({ data: basicDonutData, width: 500, height: 500 });
  return (
    <Chart {...chartProps}>
      <Donut metric="count" color="browser">
        <AdvancedLabel {...(args as AdvancedLabelProps)} />
      </Donut>
    </Chart>
  );
};

const Basic = bindWithProps(AdvancedLabelStory);
Basic.args = { value: true, percent: true };

const NameOnly = bindWithProps(AdvancedLabelStory);
NameOnly.args = {};

const THUMB_HEIGHT = 32;

// Mirrors getDonutOuterRadiusExpr's reservation math (donutUtils.ts) - AdvancedLabel uses the exact
// same horizontal reservation ratio as SegmentLabel, so the donut's actual rendered radius (and
// therefore its font-size/ring-width size tier) is based on this same label-reserved diameter.
const getEffectiveDiameter = (containerWidth: number): number => {
  const rawRadius = containerWidth / 2 - 2;
  const reservedRadius = (rawRadius - DONUT_LABEL_RING_GAP) / (1 + DONUT_LABEL_MAX_ANCHOR_OFFSET_RATIO);
  return 2 * reservedRadius;
};

// Inverse of getEffectiveDiameter - the container width at which the effective (label-reserved)
// diameter reaches a given tier cutpoint, so breakpoint markers land at the right slider position.
const getContainerWidthForDiameter = (diameter: number): number =>
  diameter * (1 + DONUT_LABEL_MAX_ANCHOR_OFFSET_RATIO) + 4 + 2 * DONUT_LABEL_RING_GAP;

const lastCutpoint = DONUT_SIZE_TIER_CUTPOINTS.at(-1);
if (lastCutpoint === undefined) {
  throw new Error('DONUT_SIZE_TIER_CUTPOINTS must not be empty');
}
const MAX_TIER_CUTPOINT = lastCutpoint;
// height must be at least as large as the container width needed to reach the XL cutpoint, or
// min(width, height) caps out at `height` and the donut can never actually reach XL by dragging
// the width slider alone, no matter how far right the slider goes
const CHART_SIZE = getContainerWidthForDiameter(MAX_TIER_CUTPOINT) + 50;
const MAX_WIDTH = CHART_SIZE + 100;

const HANDLE_STYLES = `
  .rsc-al-size-handle {
    -webkit-appearance: none;
    appearance: none;
    background: transparent;
    border: none;
    outline: none;
    position: absolute;
    top: 0;
    left: 0;
    height: ${CHART_SIZE}px;
    pointer-events: none;
    z-index: 20;
  }
  .rsc-al-size-handle::-webkit-slider-runnable-track {
    background: transparent;
    height: ${CHART_SIZE}px;
  }
  .rsc-al-size-handle::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 8px;
    height: ${THUMB_HEIGHT}px;
    border-radius: 4px;
    background: #999;
    cursor: ew-resize;
    pointer-events: all;
    margin-top: ${(CHART_SIZE - THUMB_HEIGHT) / 2}px;
  }
  .rsc-al-size-handle::-moz-range-track { background: transparent; }
  .rsc-al-size-handle::-moz-range-thumb {
    width: 8px;
    height: ${THUMB_HEIGHT}px;
    border-radius: 4px;
    background: #999;
    border: none;
    cursor: ew-resize;
  }
`;

const TIER_LABELS = ['XS', 'S', 'M', 'L', 'XL'];
const THRESHOLDS = DONUT_SIZE_TIER_CUTPOINTS.map((cutpoint, i) => ({
  px: getContainerWidthForDiameter(cutpoint),
  label: TIER_LABELS[i + 1],
  diameter: cutpoint,
}));

const getSizeTier = (containerWidth: number): string => {
  const diameter = getEffectiveDiameter(containerWidth);
  const index = DONUT_SIZE_TIER_CUTPOINTS.findIndex((cutpoint) => diameter < cutpoint);
  if (index !== -1) return TIER_LABELS[index];
  const lastLabel = TIER_LABELS.at(-1);
  if (lastLabel === undefined) {
    throw new Error('TIER_LABELS must not be empty');
  }
  return lastLabel;
};

// drag the slider to see the swatch+name+value+detail block scale across size tiers, including how
// the vertical row-stacking cap (getAdvancedLabelRowDy) behaves for segments near the ring's top/bottom
const ResponsiveAdvancedLabel: StoryFn<typeof AdvancedLabel> = (args): ReactElement => {
  const [width, setWidth] = useState(300);
  const chartProps = useChartProps({ data: basicDonutData });
  const outerDiameter = getEffectiveDiameter(width);
  const currentSize = getSizeTier(width);

  return (
    <div style={{ padding: '16px 0' }}>
      <style>{HANDLE_STYLES}</style>
      <div style={{ marginBottom: 8, fontSize: 13, color: '#666' }}>
        Container Width: <strong>{Math.round(width)}px</strong> — Outer Diameter:{' '}
        <strong>{Math.round(outerDiameter)}px</strong> — Size tier: <strong>{currentSize}</strong>
      </div>
      <div style={{ position: 'relative', minWidth: MAX_WIDTH }}>
        {THRESHOLDS.map(({ px, label, diameter }) => (
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
              {label} ({diameter}px)
            </span>
          </div>
        ))}
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <Chart {...chartProps} width={width} height={CHART_SIZE}>
            <Donut metric="count" color="browser">
              <AdvancedLabel {...(args as AdvancedLabelProps)} />
            </Donut>
          </Chart>
          <input
            type="range"
            className="rsc-al-size-handle"
            aria-label="Chart width"
            min={0}
            max={MAX_WIDTH}
            value={Math.round(width)}
            onChange={(e) => setWidth(Math.max(50, Number(e.target.value)))}
            style={{ width: MAX_WIDTH }}
          />
        </div>
      </div>
    </div>
  );
};

const WithDetail = bindWithProps(ResponsiveAdvancedLabel);
WithDetail.args = { value: true, percent: true, detail: true };

export { Basic, NameOnly, WithDetail };
