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

import { DONUT_SIZE_TIER_CUTPOINTS } from '@spectrum-charts/constants';
import { sequentialCerulean5 } from '@spectrum-charts/themes';
import { ChartColors, ChartData } from '@spectrum-charts/vega-spec-builder-s2';

import { Chart } from '../../../Chart';
import { Legend } from '../../../components';
import useChartProps from '../../../hooks/useChartProps';
import { Donut, DonutSummary } from '../../../pre-alpha';
import { bindWithProps } from '../../../test-utils';
import { DonutProps, DonutSummaryProps } from '../../../types';

export default {
  title: 'React Spectrum Charts 2/Donut/Features/Semicircle',
  component: DonutSummary,
};

const semicircleData: ChartData[] = [
  { browser: 'Chrome', count: 55 },
  { browser: 'Safari', count: 25 },
  { browser: 'Firefox', count: 12 },
  { browser: 'Edge', count: 8 },
];

const TIER_LABELS = ['XS', 'S', 'M', 'L', 'XL'];
const MAX_WIDTH = (DONUT_SIZE_TIER_CUTPOINTS.at(-1) ?? 400) + 100;
const MIN_WIDTH = 60;
const THUMB_HEIGHT = 32;

const getSizeTier = (diameter: number): string => {
  const index = DONUT_SIZE_TIER_CUTPOINTS.findIndex((cutpoint) => diameter < cutpoint);
  return TIER_LABELS[index === -1 ? TIER_LABELS.length - 1 : index];
};

type SemicircleStoryProps = DonutProps & Pick<DonutSummaryProps, 'hideValue' | 'numberFormat' | 'delta'>;

const ResponsiveSemicircle = ({
  data,
  donutProps,
  children,
  initialWidth = 300,
  legend,
  colors,
}: {
  data: ChartData[];
  donutProps: Partial<DonutProps>;
  children: DonutProps['children'];
  initialWidth?: number;
  legend?: ReactElement;
  colors?: ChartColors;
}): ReactElement => {
  const [width, setWidth] = useState(initialWidth);
  const chartProps = useChartProps({ data, ...(colors && { colors }) });
  const chartHeight = Math.ceil(width / 2);
  const setClampedWidth = (nextWidth: number): void =>
    setWidth(Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, Math.round(nextWidth))));

  return (
    <div style={{ padding: '16px 0' }}>
      <div style={{ marginBottom: 8, fontSize: 13, color: '#666' }}>
        Container Width: <strong>{width}px</strong> — Outer Diameter: <strong>{width}px</strong> — Size tier:{' '}
        <strong>{getSizeTier(width)}</strong>
      </div>
      <div style={{ position: 'relative', minWidth: MAX_WIDTH }}>
        {DONUT_SIZE_TIER_CUTPOINTS.map((diameter, index) => (
          <div
            key={diameter}
            style={{
              position: 'absolute',
              left: diameter,
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
              {TIER_LABELS[index + 1]} ({diameter}px)
            </span>
          </div>
        ))}
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <Chart {...chartProps} width={width}>
            <Donut metric="count" color="browser" {...donutProps}>
              {children}
            </Donut>
            {legend}
          </Chart>
          <div
            role="slider"
            tabIndex={0}
            aria-label="Chart width"
            aria-valuemin={MIN_WIDTH}
            aria-valuemax={MAX_WIDTH}
            aria-valuenow={width}
            onPointerDown={(event) => event.currentTarget.setPointerCapture(event.pointerId)}
            onPointerMove={(event) => {
              if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
              const containerLeft = event.currentTarget.parentElement?.getBoundingClientRect().left;
              if (containerLeft !== undefined) setClampedWidth(event.clientX - containerLeft);
            }}
            onPointerUp={(event) => event.currentTarget.releasePointerCapture(event.pointerId)}
            onKeyDown={(event) => {
              if (event.key === 'ArrowLeft') setClampedWidth(width - 1);
              if (event.key === 'ArrowRight') setClampedWidth(width + 1);
            }}
            style={{
              position: 'absolute',
              left: width - 4,
              top: (chartHeight - THUMB_HEIGHT) / 2,
              width: 8,
              height: THUMB_HEIGHT,
              borderRadius: 4,
              background: '#999',
              cursor: 'ew-resize',
              touchAction: 'none',
              zIndex: 20,
            }}
          />
        </div>
      </div>
    </div>
  );
};

const SemicircleStory: StoryFn<SemicircleStoryProps> = (args): ReactElement => {
  const { hideValue, numberFormat, delta, ...donutProps } = args;
  return (
    <ResponsiveSemicircle data={semicircleData} donutProps={donutProps}>
      <DonutSummary hideValue={hideValue} label="Visitors" numberFormat={numberFormat} delta={delta} />
    </ResponsiveSemicircle>
  );
};

const Semicircle = bindWithProps(SemicircleStory);
Semicircle.args = {
  metric: 'count',
  color: 'browser',
  variant: 'semicircle',
};

const booleanSemicircleData: ChartData[] = [
  { id: '1', value: 0.68 },
  { id: '2', value: 0.32 },
];

const ordinalSemicircleData: ChartData[] = [
  { response: 'Strongly agree', count: 18 },
  { response: 'Agree', count: 32 },
  { response: 'Neutral', count: 24 },
  { response: 'Disagree', count: 16 },
  { response: 'Strongly disagree', count: 10 },
];

const ordinalSemicircleColors: ChartColors = [
  sequentialCerulean5[1],
  sequentialCerulean5[0],
  ...sequentialCerulean5.slice(2),
];

const SemicircleOrdinalStory: StoryFn<SemicircleStoryProps> = (args): ReactElement => {
  const { hideValue, numberFormat, delta, ...donutProps } = args;
  return (
    <ResponsiveSemicircle
      data={ordinalSemicircleData}
      donutProps={donutProps}
      initialWidth={350}
      legend={<Legend title="Response" position="top" highlight />}
      colors={ordinalSemicircleColors}
    >
      <DonutSummary hideValue={hideValue} label="Responses" numberFormat={numberFormat} delta={delta} />
    </ResponsiveSemicircle>
  );
};

const SemicircleOrdinal = bindWithProps(SemicircleOrdinalStory);
SemicircleOrdinal.args = {
  metric: 'count',
  color: 'response',
  sortOrder: 'data',
  variant: 'semicircle',
};

// isBoolean's forced primary/secondary-gray fill logic is angle-range agnostic, so it composes with variant: 'semicircle' unchanged
const SemicircleBooleanStory: StoryFn<SemicircleStoryProps> = (args): ReactElement => {
  const { hideValue, numberFormat, delta, ...donutProps } = args;
  return (
    <ResponsiveSemicircle data={booleanSemicircleData} donutProps={donutProps}>
      <DonutSummary hideValue={hideValue} label="Success rate" numberFormat={numberFormat} delta={delta} />
    </ResponsiveSemicircle>
  );
};

const SemicircleBoolean = bindWithProps(SemicircleBooleanStory);
SemicircleBoolean.args = {
  metric: 'value',
  color: 'id',
  variant: 'semicircle',
  isBoolean: true,
};

export { Semicircle, SemicircleOrdinal, SemicircleBoolean };
