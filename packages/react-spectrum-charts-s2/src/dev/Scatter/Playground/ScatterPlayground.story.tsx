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

import { Chart } from '../../../Chart';
import { Axis, ChartInspect, ChartPopover, Legend, Title } from '../../../components';
import useChartProps from '../../../hooks/useChartProps';
import { Scatter, ScatterAnnotation, ScatterPath, Trendline, TrendlineAnnotation } from '../../../pre-alpha';
import { bindWithProps } from '../../../test-utils';
import { ScatterProps } from '../../../types';
import { getScatterData, ScatterDataPreset } from '../../playgroundData';
import { axesArgTypes, category, chartArgTypes, inspectArgTypes, legendArgTypes, popoverArgTypes, renderInspectContent, renderPopoverContent } from '../../playgroundUtils';

interface ScatterPlaygroundArgs extends ScatterProps {
  dataPreset: ScatterDataPreset;
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
  showLegend: boolean;
  legendPosition: 'top' | 'bottom' | 'left' | 'right';
  legendTitle?: string;
  legendHighlight: boolean;
  legendToggleable: boolean;
  legendLabelLimit: number;
  showInspect: boolean;
  inspectHighlightBy: 'item' | 'series' | 'dimension';
  inspectTargets: ('item' | 'dimensionArea')[];
  showPopover: boolean;
  popoverWidth: number;
  popoverRightClick: boolean;
  popoverHighlightBy: 'item' | 'series' | 'dimension';
  showAnnotation: boolean;
  annotationTextKey: string;
  annotationAnchor: 'top' | 'bottom' | 'left' | 'right';
  showPath: boolean;
  pathColor: string;
  pathWidth: number;
  pathOpacity: number;
  showTrendline: boolean;
  trendlineMethod: 'average' | 'median' | 'linear' | 'exponential' | 'movingAverage-3';
  trendlineColor: string;
  trendlineWidth: number;
  trendlineDisplayOnHover: boolean;
  showTrendlineAnnotation: boolean;
  trendlineAnnotationPrefix: string;
  trendlineAnnotationBadge: boolean;
}

export default {
  title: 'React Spectrum Charts 2/Pre-Alpha/Scatter/Playground',
  component: Scatter,
  argTypes: {
    ...chartArgTypes,
    dataPreset: { ...chartArgTypes.dataPreset, options: ['clusters', 'sizedPoints', 'linearTrend'] },
    ...axesArgTypes,
    ...legendArgTypes,
    ...inspectArgTypes,
    ...popoverArgTypes,
    ...category('Scatter', ['name', 'metric', 'clip', 'color', 'colorScaleType', 'dimension', 'dimensionScaleType', 'lineType', 'lineWidth', 'opacity', 'size', 'stroke', 'blend']),
    colorScaleType: { control: 'select', options: ['ordinal', 'linear'], table: { category: 'Scatter' } },
    dimensionScaleType: { control: 'select', options: ['linear', 'time', 'point'], table: { category: 'Scatter' } },
    blend: { control: 'select', options: [undefined, 'normal', 'multiply', 'screen', 'overlay'], table: { category: 'Scatter' } },
    showAnnotation: { control: 'boolean', table: { category: 'Annotation' } },
    annotationTextKey: { control: 'text', table: { category: 'Annotation' } },
    annotationAnchor: { control: 'select', options: ['top', 'bottom', 'left', 'right'], table: { category: 'Annotation' } },
    showPath: { control: 'boolean', table: { category: 'Path' } },
    pathColor: { control: 'color', table: { category: 'Path' } },
    pathWidth: { control: { type: 'range', min: 1, max: 10, step: 1 }, table: { category: 'Path' } },
    pathOpacity: { control: { type: 'range', min: 0.1, max: 1, step: 0.05 }, table: { category: 'Path' } },
    showTrendline: { control: 'boolean', table: { category: 'Trendline' } },
    trendlineMethod: { control: 'select', options: ['average', 'median', 'linear', 'exponential', 'movingAverage-3'], table: { category: 'Trendline' } },
    trendlineColor: { control: 'color', table: { category: 'Trendline' } },
    trendlineWidth: { control: { type: 'range', min: 1, max: 8, step: 1 }, table: { category: 'Trendline' } },
    trendlineDisplayOnHover: { control: 'boolean', table: { category: 'Trendline' } },
    showTrendlineAnnotation: { control: 'boolean', table: { category: 'Trendline annotation' } },
    trendlineAnnotationPrefix: { control: 'text', table: { category: 'Trendline annotation' } },
    trendlineAnnotationBadge: { control: 'boolean', table: { category: 'Trendline annotation' } },
  },
};

const ScatterPlaygroundStory: StoryFn<ScatterPlaygroundArgs> = ({
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
  showLegend,
  legendPosition,
  legendTitle,
  legendHighlight,
  legendToggleable,
  legendLabelLimit,
  showInspect,
  inspectHighlightBy,
  inspectTargets,
  showPopover,
  popoverWidth,
  popoverRightClick,
  popoverHighlightBy,
  showAnnotation,
  annotationTextKey,
  annotationAnchor,
  showPath,
  pathColor,
  pathWidth,
  pathOpacity,
  showTrendline,
  trendlineMethod,
  trendlineColor,
  trendlineWidth,
  trendlineDisplayOnHover,
  showTrendlineAnnotation,
  trendlineAnnotationPrefix,
  trendlineAnnotationBadge,
  ...scatterProps
}): ReactElement => {
  const chartProps = useChartProps({ data: getScatterData(dataPreset), height, maxWidth });
  return (
    <Chart {...chartProps} colorScheme={colorScheme} backgroundColor={backgroundColor}>
      {chartTitle ? <Title text={chartTitle} /> : undefined}
      {showBottomAxis ? <Axis position="bottom" baseline={axisBaseline} grid={axisGrid} title={bottomAxisTitle} /> : undefined}
      {showLeftAxis ? <Axis position="left" baseline={axisBaseline} grid={axisGrid} title={leftAxisTitle} /> : undefined}
      <Scatter {...scatterProps}>
        {showInspect ? <ChartInspect highlightBy={inspectHighlightBy} targets={inspectTargets}>{renderInspectContent(['name', 'speedNormal', 'handlingNormal'])}</ChartInspect> : undefined}
        {showPopover ? <ChartPopover width={popoverWidth} rightClick={popoverRightClick} UNSAFE_highlightBy={popoverHighlightBy} onOpenChange={action('Scatter ChartPopover:onOpenChange')}>{renderPopoverContent(['name', 'weightClass', 'speedNormal', 'handlingNormal'])}</ChartPopover> : undefined}
        {showAnnotation ? <ScatterAnnotation textKey={annotationTextKey} anchor={annotationAnchor} /> : undefined}
        {showPath ? <ScatterPath color={pathColor} pathWidth={{ value: pathWidth }} opacity={pathOpacity} groupBy={['pathGroup']} /> : undefined}
        {showTrendline ? (
          <Trendline color={trendlineColor} method={trendlineMethod} dimensionExtent={['domain', 'domain']} lineWidth={trendlineWidth} displayOnHover={trendlineDisplayOnHover}>
            {showTrendlineAnnotation ? <TrendlineAnnotation prefix={trendlineAnnotationPrefix} badge={trendlineAnnotationBadge} /> : undefined}
          </Trendline>
        ) : undefined}
      </Scatter>
      {showLegend ? <Legend color={scatterProps.color} position={legendPosition} title={legendTitle} highlight={legendHighlight} isToggleable={legendToggleable} labelLimit={legendLabelLimit} onClick={action('Scatter Legend:onClick')} onMouseOver={action('Scatter Legend:onMouseOver')} onMouseOut={action('Scatter Legend:onMouseOut')} /> : undefined}
    </Chart>
  );
};

export const Playground = bindWithProps(ScatterPlaygroundStory);
Playground.args = {
  dataPreset: 'clusters',
  chartTitle: 'Character handling profile',
  height: 420,
  maxWidth: 720,
  showBottomAxis: true,
  showLeftAxis: true,
  bottomAxisTitle: 'Speed',
  leftAxisTitle: 'Handling',
  axisGrid: true,
  axisBaseline: false,
  showLegend: true,
  legendPosition: 'bottom',
  legendTitle: 'Weight class',
  legendHighlight: true,
  legendToggleable: true,
  legendLabelLimit: 160,
  showInspect: true,
  inspectHighlightBy: 'item',
  inspectTargets: ['item'],
  showPopover: true,
  popoverWidth: 260,
  popoverRightClick: false,
  popoverHighlightBy: 'item',
  showAnnotation: true,
  annotationTextKey: 'annotation',
  annotationAnchor: 'top',
  showPath: true,
  pathColor: 'gray-600',
  pathWidth: 2,
  pathOpacity: 0.45,
  showTrendline: true,
  trendlineMethod: 'median',
  trendlineColor: 'categorical-200',
  trendlineWidth: 2,
  trendlineDisplayOnHover: false,
  showTrendlineAnnotation: true,
  trendlineAnnotationPrefix: 'Trend ',
  trendlineAnnotationBadge: true,
  name: 'scatter0',
  dimension: 'speedNormal',
  metric: 'handlingNormal',
  color: 'weightClass',
  colorScaleType: 'ordinal',
  dimensionScaleType: 'linear',
  size: 'size',
  opacity: 'opacity',
  lineType: { value: 'solid' },
  lineWidth: { value: 0 },
  clip: true,
} satisfies ScatterPlaygroundArgs;
