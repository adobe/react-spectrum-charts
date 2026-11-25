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

/* eslint-disable react/prop-types */
import { ReactElement } from 'react';

import { StoryFn } from '@storybook/react';
import { action } from 'storybook/actions';

import { Datum, HistogramCellColors } from '@spectrum-charts/vega-spec-builder-s2';

import { Chart } from '../../../Chart.js';
import { Axis, ChartInspect, ChartPopover, Legend, Title } from '../../../components/index.js';
import useChartProps from '../../../hooks/useChartProps.js';
import { Histogram } from '../../../lab/index.js';
import { customerAgeData, responseTimeData } from '../../../storyShared/Histogram/data.js';
import { bindWithProps } from '../../../test-utils/index.js';
import { HistogramProps } from '../../../types/index.js';
import {
  axesArgTypes,
  category,
  chartArgTypes,
  chartArgs,
  legendArgTypes,
  popoverArgTypes,
  renderInspectContent,
  renderPopoverContent,
} from '../../playgroundUtils.js';

type HistogramDataPreset = 'responseTimes' | 'customerAges';

interface HistogramPlaygroundArgs extends HistogramProps {
  dataPreset: HistogramDataPreset;
  chartTitle?: string;
  height: number;
  maxWidth: number;
  colorScheme?: 'light' | 'dark';
  backgroundColor?: string;
  showBottomAxis: boolean;
  showLeftAxis: boolean;
  bottomAxisTitle?: string;
  leftAxisTitle?: string;
  axisGrid: boolean;
  axisBaseline: boolean;
  axisLabelFormat?: 'linear' | 'percentage';
  showLegend: boolean;
  legendPosition: 'top' | 'bottom' | 'left' | 'right';
  legendTitle?: string;
  showInspect: boolean;
  showPopover: boolean;
  popoverWidth: number;
  popoverRightClick: boolean;
}

const playgroundData = { responseTimes: responseTimeData, customerAges: customerAgeData };

const inspectKeys = [
  'binStart',
  'binEnd',
  'yBinStart',
  'yBinEnd',
  'count',
  'sum',
  'percent',
  'density',
  'cumulativeCount',
  'region',
];

// 1D bins have no y bin edges and only weighted bins have a sum
const getInspectKeys = (datum: Datum): string[] => inspectKeys.filter((key) => datum[key] !== undefined);

const cellColorOptions: HistogramCellColors[] = [
  'sequentialCerulean5',
  'sequentialCerulean9',
  'sequentialCerulean16',
  'sequentialForest5',
  'sequentialForest9',
  'sequentialForest16',
  'sequentialMagma5',
  'sequentialMagma9',
  'sequentialMagma16',
  'sequentialRose5',
  'sequentialRose9',
  'sequentialRose16',
  'sequentialViridis5',
  'sequentialViridis9',
  'sequentialViridis16',
];

export default {
  title: 'React Spectrum Charts 2/Lab/Histogram/Playground',
  tags: ['lab'],
  component: Histogram,
  argTypes: {
    ...chartArgTypes,
    dataPreset: { ...chartArgTypes.dataPreset, options: ['responseTimes', 'customerAges'] },
    ...axesArgTypes,
    axisLabelFormat: { control: 'select', options: [undefined, 'linear', 'percentage'], table: { category: 'Axes' } },
    showLegend: legendArgTypes.showLegend,
    legendPosition: legendArgTypes.legendPosition,
    legendTitle: legendArgTypes.legendTitle,
    showInspect: { control: 'boolean', table: { category: 'Inspect' } },
    showPopover: popoverArgTypes.showPopover,
    popoverWidth: popoverArgTypes.popoverWidth,
    popoverRightClick: popoverArgTypes.popoverRightClick,
    ...category('Histogram', [
      'name',
      'metric',
      'binCount',
      'binSize',
      'binEdges',
      'extent',
      'binAnchor',
      'color',
      'cumulative',
      'densityCurve',
      'yMetric',
      'yBinCount',
      'yBinSize',
      'yExtent',
      'cellLegend',
      'cellLegendTitle',
    ]),
    metric: { control: 'select', options: ['responseTime', 'payloadKb', 'age'], table: { category: 'Histogram' } },
    weight: { control: 'select', options: [undefined, 'payloadKb', 'responseTime'], table: { category: 'Histogram' } },
    orientation: { control: 'inline-radio', options: ['vertical', 'horizontal'], table: { category: 'Histogram' } },
    layout: { control: 'radio', options: ['stacked', 'overlaid', 'dodged'], table: { category: 'Histogram' } },
    yValue: { control: 'radio', options: ['count', 'percent', 'density'], table: { category: 'Histogram' } },
    drawInEffect: { control: 'inline-radio', options: ['grow', 'sweep', 'fade'], table: { category: 'Histogram' } },
    yMetric: { control: 'select', options: [undefined, 'payloadKb'], table: { category: 'Histogram' } },
    cellColors: { control: 'select', options: cellColorOptions, table: { category: 'Histogram' } },
  },
};

const HistogramPlaygroundStory: StoryFn<HistogramPlaygroundArgs> = ({
  dataPreset,
  chartTitle,
  height,
  maxWidth,
  colorScheme,
  backgroundColor,
  showBottomAxis,
  showLeftAxis,
  bottomAxisTitle,
  leftAxisTitle,
  axisGrid,
  axisBaseline,
  axisLabelFormat,
  showLegend,
  legendPosition,
  legendTitle,
  showInspect,
  showPopover,
  popoverWidth,
  popoverRightClick,
  ...histogramProps
}): ReactElement => {
  const chartProps = useChartProps({ data: playgroundData[dataPreset], height, maxWidth });
  // horizontal 1D histograms put the count axis at the bottom, so the titles and count-axis styling swap sides
  const isHorizontal = histogramProps.orientation === 'horizontal' && !histogramProps.yMetric;
  const binAxisTitle = bottomAxisTitle || undefined;
  const countAxisTitle = leftAxisTitle || undefined;
  return (
    <Chart {...chartProps} colorScheme={colorScheme} backgroundColor={backgroundColor}>
      {chartTitle ? <Title text={chartTitle} /> : undefined}
      {showBottomAxis ? (
        <Axis
          position="bottom"
          baseline={axisBaseline}
          grid={isHorizontal && axisGrid}
          labelFormat={isHorizontal ? axisLabelFormat : undefined}
          ticks={!isHorizontal}
          title={isHorizontal ? countAxisTitle : binAxisTitle}
        />
      ) : undefined}
      {showLeftAxis ? (
        <Axis
          position="left"
          baseline={axisBaseline}
          grid={!isHorizontal && axisGrid}
          labelFormat={isHorizontal ? undefined : axisLabelFormat}
          ticks={isHorizontal}
          title={isHorizontal ? binAxisTitle : countAxisTitle}
        />
      ) : undefined}
      <Histogram {...histogramProps} onClick={action('Histogram:onClick')}>
        {showInspect ? (
          <ChartInspect>{(datum) => renderInspectContent(getInspectKeys(datum))(datum)}</ChartInspect>
        ) : undefined}
        {showPopover ? (
          <ChartPopover
            width={popoverWidth}
            rightClick={popoverRightClick}
            onOpenChange={action('Histogram ChartPopover:onOpenChange')}
          >
            {(datum, close) => renderPopoverContent(getInspectKeys(datum))(datum, close)}
          </ChartPopover>
        ) : undefined}
      </Histogram>
      {showLegend ? <Legend position={legendPosition} title={legendTitle} /> : undefined}
    </Chart>
  );
};

export const Playground = bindWithProps(HistogramPlaygroundStory);
Playground.args = {
  ...chartArgs,
  dataPreset: 'responseTimes',
  chartTitle: 'API response time',
  height: 400,
  maxWidth: 760,
  showBottomAxis: true,
  showLeftAxis: true,
  bottomAxisTitle: 'Response time (ms)',
  leftAxisTitle: '',
  axisGrid: true,
  axisBaseline: false,
  showLegend: true,
  legendPosition: 'bottom',
  legendTitle: 'Region',
  showInspect: true,
  showPopover: true,
  popoverWidth: 240,
  popoverRightClick: false,
  name: 'histogram0',
  metric: 'responseTime',
  color: 'region',
  orientation: 'vertical',
  layout: 'stacked',
  yValue: 'count',
  cumulative: false,
  densityCurve: false,
  drawInEffect: 'grow',
  cellColors: 'sequentialCerulean9',
  cellLegend: true,
} satisfies HistogramPlaygroundArgs;
