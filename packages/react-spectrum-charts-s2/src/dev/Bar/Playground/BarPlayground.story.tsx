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
import { ReactElement, useState } from 'react';

import { StoryFn } from '@storybook/react';
import { action } from 'storybook/actions';

import { Chart } from '../../../Chart';
import { Axis, Bar, BarDirectLabel, ChartInspect, ChartPopover, Legend, ReferenceLine, Title } from '../../../components';
import useChartProps from '../../../hooks/useChartProps';
import { bindWithProps } from '../../../test-utils';
import { BarProps } from '../../../types';
import { CartesianDataPreset, getCartesianData } from '../../playgroundData';
import {
  axesArgTypes,
  category,
  chartArgTypes,
  inspectArgTypes,
  legendArgTypes,
  popoverArgTypes,
  renderInspectContent,
  renderPopoverContent,
} from '../../playgroundUtils';

interface BarPlaygroundArgs extends BarProps {
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
  axisLabelLimit: number;
  showReferenceLine: boolean;
  referenceLineLabel: string;
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
  showDirectLabel: boolean;
  directLabelPosition: 'start' | 'middle' | 'end' | 'end-outside';
  directLabelFormat: string;
  enableClickCallback: boolean;
  enableHoverCallbacks: boolean;
  enableContextMenuCallback: boolean;
}

export default {
  title: 'React Spectrum Charts 2/Bar/Playground',
  component: Bar,
  argTypes: {
    ...chartArgTypes,
    dataPreset: { ...chartArgTypes.dataPreset, options: ['singleSeries', 'multiSeries', 'negativeValues', 'longLabels'] },
    ...axesArgTypes,
    ...legendArgTypes,
    ...inspectArgTypes,
    ...popoverArgTypes,
    ...category('Bar', [
      'dimension',
      'metric',
      'color',
      'colorOverride',
      'dimensionDataType',
      'dualMetricAxis',
      'groupedPadding',
      'hasSquareCorners',
      'lineType',
      'lineWidth',
      'name',
      'order',
      'orientation',
      'opacity',
      'paddingRatio',
      'paddingOuter',
      'trellis',
      'trellisOrientation',
      'trellisPadding',
      'type',
      'diverging',
      'metricAxis',
    ]),
    orientation: { control: 'select', options: ['vertical', 'horizontal'], table: { category: 'Bar' } },
    type: { control: 'select', options: ['stacked', 'dodged'], table: { category: 'Bar' } },
    lineWidth: { control: { type: 'range', min: 0, max: 8, step: 1 }, table: { category: 'Bar' } },
    showDirectLabel: { control: 'boolean', table: { category: 'Direct label' } },
    directLabelPosition: { control: 'select', options: ['start', 'middle', 'end', 'end-outside'], table: { category: 'Direct label' } },
    directLabelFormat: { control: 'text', table: { category: 'Direct label' } },
    enableClickCallback: { control: 'boolean', table: { category: 'Interactions' } },
    enableHoverCallbacks: { control: 'boolean', table: { category: 'Interactions' } },
    enableContextMenuCallback: { control: 'boolean', table: { category: 'Interactions' } },
  },
};

const BarPlaygroundStory: StoryFn<BarPlaygroundArgs> = ({
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
  axisLabelLimit,
  showReferenceLine,
  referenceLineLabel,
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
  showDirectLabel,
  directLabelPosition,
  directLabelFormat,
  enableClickCallback,
  enableHoverCallbacks,
  enableContextMenuCallback,
  ...barProps
}): ReactElement => {
  const [contextMenuLabel, setContextMenuLabel] = useState<string>();
  const data = getCartesianData(dataPreset);
  const chartProps = useChartProps({ data, height, maxWidth });
  const isHorizontal = barProps.orientation === 'horizontal';
  const metricAxis = isHorizontal ? 'bottom' : 'left';

  const legendColor = Array.isArray(barProps.color) ? 'operatingSystem' : barProps.color;

  return (
    <div style={{ position: 'relative' }}>
    <Chart {...chartProps} colorScheme={colorScheme} backgroundColor={backgroundColor}>
      {chartTitle ? <Title text={chartTitle} /> : undefined}
      {showBottomAxis ? (
        <Axis position="bottom" baseline={axisBaseline} grid={axisGrid && isHorizontal} labelLimit={axisLabelLimit} title={isHorizontal ? leftAxisTitle : bottomAxisTitle}>
          {showReferenceLine && metricAxis === 'bottom' ? <ReferenceLine value={50} label={referenceLineLabel} /> : undefined}
        </Axis>
      ) : undefined}
      {showLeftAxis ? (
        <Axis position="left" baseline={axisBaseline} grid={axisGrid && !isHorizontal} labelLimit={axisLabelLimit} title={isHorizontal ? bottomAxisTitle : leftAxisTitle}>
          {showReferenceLine && metricAxis === 'left' ? <ReferenceLine value={50} label={referenceLineLabel} /> : undefined}
        </Axis>
      ) : undefined}
      <Bar
        {...barProps}
        onClick={enableClickCallback ? action('Bar:onClick') : undefined}
        onContextMenu={
          enableContextMenuCallback
            ? (event, datum): void => {
                event.preventDefault();
                action('Bar:onContextMenu')({ event, datum });
                setContextMenuLabel(`Bar context menu: ${String(datum.browser ?? datum.series ?? datum.value)}`);
              }
            : undefined
        }
        onMouseOut={enableHoverCallbacks ? action('Bar:onMouseOut') : undefined}
        onMouseOver={enableHoverCallbacks ? action('Bar:onMouseOver') : undefined}
      >
        {showInspect ? <ChartInspect highlightBy={inspectHighlightBy} targets={inspectTargets}>{renderInspectContent(['browser', 'operatingSystem', 'value'])}</ChartInspect> : undefined}
        {showPopover ? <ChartPopover width={popoverWidth} rightClick={popoverRightClick} UNSAFE_highlightBy={popoverHighlightBy} onOpenChange={action('Bar ChartPopover:onOpenChange')}>{renderPopoverContent(['browser', 'operatingSystem', 'value'])}</ChartPopover> : undefined}
        {showDirectLabel ? <BarDirectLabel position={directLabelPosition} format={directLabelFormat} /> : undefined}
      </Bar>
      {showLegend ? <Legend color={legendColor} position={legendPosition} title={legendTitle} highlight={legendHighlight} isToggleable={legendToggleable} labelLimit={legendLabelLimit} onClick={action('Bar Legend:onClick')} onMouseOver={action('Bar Legend:onMouseOver')} onMouseOut={action('Bar Legend:onMouseOut')} /> : undefined}
    </Chart>
    {contextMenuLabel ? <div style={{ position: 'absolute', top: 8, right: 8, background: 'white', border: '1px solid #999', padding: 8 }}>{contextMenuLabel}</div> : undefined}
    </div>
  );
};

export const Playground = bindWithProps(BarPlaygroundStory);
Playground.args = {
  dataPreset: 'multiSeries',
  chartTitle: 'Browser adoption by platform',
  height: 420,
  maxWidth: 760,
  showBottomAxis: true,
  showLeftAxis: true,
  bottomAxisTitle: 'Browser',
  leftAxisTitle: 'Adoption',
  axisGrid: true,
  axisBaseline: true,
  axisLabelLimit: 110,
  showReferenceLine: false,
  referenceLineLabel: 'Goal',
  showLegend: true,
  legendPosition: 'bottom',
  legendTitle: 'Operating system',
  legendHighlight: true,
  legendToggleable: true,
  legendLabelLimit: 140,
  showInspect: true,
  inspectHighlightBy: 'item',
  inspectTargets: ['item', 'dimensionArea'],
  showPopover: true,
  popoverWidth: 240,
  popoverRightClick: false,
  popoverHighlightBy: 'item',
  showDirectLabel: true,
  directLabelPosition: 'end-outside',
  directLabelFormat: ',.0f',
  enableClickCallback: true,
  enableHoverCallbacks: true,
  enableContextMenuCallback: true,
  dimension: 'browser',
  metric: 'value',
  color: 'operatingSystem',
  order: 'order',
  orientation: 'vertical',
  type: 'dodged',
  trellis: undefined,
  trellisOrientation: 'horizontal',
  diverging: false,
  hasSquareCorners: false,
  lineWidth: 0,
  paddingRatio: 0.2,
} satisfies BarPlaygroundArgs;
