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

import { Chart } from '../../../Chart';
import { Axis, Bar, BarDirectLabel } from '../../../components';
import useChartProps from '../../../hooks/useChartProps';
import { bindWithProps } from '../../../test-utils';
import { BarDirectLabelProps } from '../../../types';
import { barData, mixedBarData } from './data';

export default {
  title: 'RSC/Bar/BarDirectLabel',
  component: BarDirectLabel,
};

const CHART_HEIGHT = 400;
const MAX_WIDTH = CHART_SIZE_BREAKPOINTS.L + 200;
const THUMB_HEIGHT = 32;

const HANDLE_STYLES = `
  .rsc-dl-size-handle {
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
  .rsc-dl-size-handle::-webkit-slider-runnable-track {
    background: transparent;
    height: ${CHART_HEIGHT}px;
  }
  .rsc-dl-size-handle::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 8px;
    height: ${THUMB_HEIGHT}px;
    border-radius: 4px;
    background: #999;
    cursor: ew-resize;
    pointer-events: all;
    margin-top: ${(CHART_HEIGHT - THUMB_HEIGHT) / 2}px;
  }
  .rsc-dl-size-handle::-moz-range-track { background: transparent; }
  .rsc-dl-size-handle::-moz-range-thumb {
    width: 8px;
    height: ${THUMB_HEIGHT}px;
    border-radius: 4px;
    background: #999;
    border: none;
    cursor: ew-resize;
  }
`;

const THRESHOLDS = [
  { px: CHART_SIZE_BREAKPOINTS.M, label: 'M' },
  { px: CHART_SIZE_BREAKPOINTS.L, label: 'L' },
];

const BarDirectLabelStory: StoryFn<BarDirectLabelProps> = (args): ReactElement => {
  const chartProps = useChartProps({ data: barData, width: 600, height: 400 });
  return (
    <Chart {...chartProps}>
      <Axis position="bottom" baseline title="Browser" />
      <Axis position="left" grid title="Downloads" />
      <Bar dimension="browser" metric="downloads">
        <BarDirectLabel {...args} />
      </Bar>
    </Chart>
  );
};

const HorizontalBarDirectLabelStory: StoryFn<BarDirectLabelProps> = (args): ReactElement => {
  const chartProps = useChartProps({ data: barData, width: 600, height: 400 });
  return (
    <Chart {...chartProps}>
      <Axis position="left" baseline title="Browser" />
      <Axis position="bottom" grid title="Downloads" />
      <Bar dimension="browser" metric="downloads" orientation="horizontal">
        <BarDirectLabel {...args} />
      </Bar>
    </Chart>
  );
};

const NegativeBarDirectLabelStory: StoryFn<BarDirectLabelProps> = (args): ReactElement => {
  const chartProps = useChartProps({ data: mixedBarData, width: 600, height: 400 });
  return (
    <Chart {...chartProps}>
      <Axis position="bottom" baseline title="Browser" />
      <Axis position="left" grid title="Downloads" />
      <Bar dimension="browser" metric="downloads">
        <BarDirectLabel {...args} />
      </Bar>
    </Chart>
  );
};

const HorizontalNegativeBarDirectLabelStory: StoryFn<BarDirectLabelProps> = (args): ReactElement => {
  const chartProps = useChartProps({ data: mixedBarData, width: 600, height: 400 });
  return (
    <Chart {...chartProps}>
      <Axis position="left" baseline title="Browser" />
      <Axis position="bottom" grid title="Downloads" />
    <Bar dimension="browser" metric="downloads" orientation="horizontal">
      <BarDirectLabel {...args} />
    </Bar>
    </Chart>
  );
};

const BarDirectLabelSizeScalingStory: StoryFn<BarDirectLabelProps> = (args): ReactElement => {
  const chartProps = useChartProps({ data: barData, height: CHART_HEIGHT });
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
          <Chart {...chartProps} data={barData} width={width} height={CHART_HEIGHT}>
            <Axis position="bottom" baseline title="Browser" />
            <Axis position="left" grid title="Downloads" />
            <Bar dimension="browser" metric="downloads">
              <BarDirectLabel {...args} />
            </Bar>
          </Chart>
          <input
            type="range"
            className="rsc-dl-size-handle"
            aria-label="Chart width"
            min={200}
            max={MAX_WIDTH}
            value={Math.round(width)}
            onChange={(e) => setWidth(Math.max(200, Number(e.target.value)))}
            style={{ width: MAX_WIDTH }}
          />
        </div>
      </div>
    </div>
  );
};

const defaultProps: BarDirectLabelProps = {
  position: 'end-outside',
};

const Default = bindWithProps(BarDirectLabelStory);
Default.args = {
  ...defaultProps,
};

const Horizontal = bindWithProps(HorizontalBarDirectLabelStory);
Horizontal.args = {
  ...defaultProps,
};

const MixedValues = bindWithProps(NegativeBarDirectLabelStory);
MixedValues.args = {
  ...defaultProps,
};

const MixedValuesHorizontal = bindWithProps(HorizontalNegativeBarDirectLabelStory);
MixedValuesHorizontal.args = {
  ...defaultProps,
};

const Position = bindWithProps(BarDirectLabelStory);
Position.args = { ...defaultProps, position: 'middle' };

const PositionHorizontal = bindWithProps(HorizontalBarDirectLabelStory);
PositionHorizontal.args = { ...defaultProps, position: 'start' };

const SizeScaling = bindWithProps(BarDirectLabelSizeScalingStory);
SizeScaling.args = { ...defaultProps };

export { Default, Horizontal, MixedValues, MixedValuesHorizontal, Position, PositionHorizontal, SizeScaling };
