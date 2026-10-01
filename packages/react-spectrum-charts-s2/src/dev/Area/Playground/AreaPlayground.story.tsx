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
import { Area } from '../../../pre-alpha';
import { bindWithProps } from '../../../test-utils';
import { AreaProps } from '../../../types';
import { CartesianDataPreset, playgroundTimeSeriesData } from '../../playgroundData';
import {
  axesArgTypes,
  category,
  chartArgTypes,
  chartArgs,
  inspectArgTypes,
  legendArgTypes,
  popoverArgTypes,
  renderInspectContent,
  renderPopoverContent,
} from '../../playgroundUtils';

interface AreaPlaygroundArgs extends AreaProps {
  dataPreset: CartesianDataPreset;
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
  axisLabelFormat?: 'time' | 'linear' | 'percentage' | 'duration';
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
}

export default {
  title: 'React Spectrum Charts 2/Pre-Alpha/Area/Playground',
  component: Area,
  argTypes: {
    ...chartArgTypes,
    dataPreset: { ...chartArgTypes.dataPreset, options: ['timeSeries', 'multiSeries'] },
    ...axesArgTypes,
    ...legendArgTypes,
    ...inspectArgTypes,
    ...popoverArgTypes,
    ...category('Area', [
      'name',
      'color',
      'metric',
      'dimension',
      'order',
      'opacity',
      'padding',
      'scaleType',
      'metricStart',
      'metricEnd',
    ]),
    scaleType: { control: 'select', options: ['time', 'linear', 'point'], table: { category: 'Area' } },
    opacity: { control: { type: 'range', min: 0.05, max: 1, step: 0.05 }, table: { category: 'Area' } },
    padding: { control: { type: 'range', min: 0, max: 1, step: 0.05 }, table: { category: 'Area' } },
  },
};

const AreaPlaygroundStory: StoryFn<AreaPlaygroundArgs> = ({
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
  ...areaProps
}): ReactElement => {
  const data =
    dataPreset === 'singleSeries'
      ? playgroundTimeSeriesData.filter((datum) => (datum as Record<string, unknown>).series === 'Create')
      : playgroundTimeSeriesData;
  const chartProps = useChartProps({ data, height, maxWidth });

  return (
    <Chart {...chartProps} colorScheme={colorScheme} backgroundColor={backgroundColor}>
      {chartTitle ? <Title text={chartTitle} /> : undefined}
      {showBottomAxis ? (
        <Axis position="bottom" baseline={axisBaseline} labelFormat={axisLabelFormat} title={bottomAxisTitle} />
      ) : undefined}
      {showLeftAxis ? (
        <Axis position="left" baseline={axisBaseline} grid={axisGrid} title={leftAxisTitle} />
      ) : undefined}
      <Area {...areaProps}>
        {showInspect ? (
          <ChartInspect highlightBy={inspectHighlightBy} targets={inspectTargets}>
            {renderInspectContent(['series', 'datetime', 'value'])}
          </ChartInspect>
        ) : undefined}
        {showPopover ? (
          <ChartPopover
            width={popoverWidth}
            rightClick={popoverRightClick}
            UNSAFE_highlightBy={popoverHighlightBy}
            onOpenChange={action('Area ChartPopover:onOpenChange')}
          >
            {renderPopoverContent(['series', 'datetime', 'value'])}
          </ChartPopover>
        ) : undefined}
      </Area>
      {showLegend ? (
        <Legend
          color={areaProps.color}
          position={legendPosition}
          title={legendTitle}
          highlight={legendHighlight}
          isToggleable={legendToggleable}
          labelLimit={legendLabelLimit}
          onClick={action('Area Legend:onClick')}
          onMouseOver={action('Area Legend:onMouseOver')}
          onMouseOut={action('Area Legend:onMouseOut')}
        />
      ) : undefined}
    </Chart>
  );
};

export const Playground = bindWithProps(AreaPlaygroundStory);
Playground.args = {
  ...chartArgs,
  dataPreset: 'timeSeries',
  chartTitle: 'Area volume by workflow',
  height: 400,
  maxWidth: 760,
  showBottomAxis: true,
  showLeftAxis: true,
  bottomAxisTitle: 'Date',
  leftAxisTitle: 'Events',
  axisGrid: true,
  axisBaseline: false,
  axisLabelFormat: 'time',
  showLegend: true,
  legendPosition: 'bottom',
  legendTitle: 'Workflow',
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
  name: 'area0',
  dimension: 'datetime',
  metric: 'value',
  color: 'series',
  order: 'order',
  opacity: 0.65,
  padding: 0,
  scaleType: 'time',
} satisfies AreaPlaygroundArgs;
