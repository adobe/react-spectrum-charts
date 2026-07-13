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
import { ReactElement } from 'react';

import { CHART_SIZE_BREAKPOINTS, CHART_SIZE_HOVER_STROKE_WIDTHS, CHART_SIZE_STROKE_WIDTHS } from '@spectrum-charts/constants';

import { Chart } from '../../../Chart';
import { Axis, ChartInspect, Legend, Line } from '../../../components';
import { workspaceTrendsData } from '../../../stories/data/data';
import { CHART_SIZE_THRESHOLDS, ResizableChart } from '../../../stories/storyUtils';

export default {
  title: 'React Spectrum Charts 2/Line/Features/StrokeWidthOnHover',
  component: Line,
};

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

export const StrokeWidthOnHover = (): ReactElement => (
  <ResizableChart
    thresholds={CHART_SIZE_THRESHOLDS}
    renderLabel={(width) => {
      const tier = getSizeTier(width);
      return (
        <div style={{ lineHeight: 1.6 }}>
          <div>Width: <strong>{Math.round(width)}px</strong> — Size tier: <strong>{tier}</strong></div>
          <div>
            Stroke width: <strong>{CHART_SIZE_STROKE_WIDTHS[tier]}px</strong> base →{' '}
            <strong>{CHART_SIZE_HOVER_STROKE_WIDTHS[tier]}px</strong> on hover/select
          </div>
        </div>
      );
    }}
  >
    <Chart data={workspaceTrendsData} width="auto" height={300}>
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
  </ResizableChart>
);

export const StrokeWidthOnHoverGroupLegend = (): ReactElement => (
  <ResizableChart
    thresholds={CHART_SIZE_THRESHOLDS}
    renderLabel={(width) => {
      const tier = getSizeTier(width);
      return (
        <div style={{ lineHeight: 1.6 }}>
          <div>Width: <strong>{Math.round(width)}px</strong> — Size tier: <strong>{tier}</strong></div>
          <div>
            Stroke width: <strong>{CHART_SIZE_STROKE_WIDTHS[tier]}px</strong> base →{' '}
            <strong>{CHART_SIZE_HOVER_STROKE_WIDTHS[tier]}px</strong> on hover/select
          </div>
        </div>
      );
    }}
  >
    <Chart data={groupedData} width="auto" height={300}>
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
  </ResizableChart>
);
