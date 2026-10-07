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

import { Chart } from '../../../Chart.js';
import { Axis, Bar, BarDirectLabel, ReferenceLine } from '../../../components/index.js';
import useChartProps from '../../../hooks/useChartProps.js';
import { bindWithProps } from '../../../test-utils/index.js';
import { BarProps } from '../../../types/index.js';
import { CartesianDataPreset, getCartesianData } from '../../playgroundData.js';
import {
  ContextMenuLabel,
  PlaygroundInspectArgs,
  PlaygroundLegendArgs,
  PlaygroundPopoverArgs,
  axesArgTypes,
  category,
  chartArgTypes,
  chartArgs,
  getContextMenuHandler,
  inspectArgKeys,
  inspectArgTypes,
  legendArgKeys,
  legendArgTypes,
  omitArgs,
  optionalAction,
  popoverArgKeys,
  popoverArgTypes,
  renderPlaygroundInspect,
  renderPlaygroundLegend,
  renderPlaygroundPopover,
  renderPlaygroundTitle,
} from '../../playgroundUtils.js';

const DATUM_KEYS = ['browser', 'operatingSystem', 'value'];

interface BarPlaygroundArgs extends BarProps, PlaygroundInspectArgs, PlaygroundPopoverArgs, PlaygroundLegendArgs {
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
    dataPreset: {
      ...chartArgTypes.dataPreset,
      options: ['singleSeries', 'multiSeries', 'negativeValues', 'longLabels'],
    },
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
    directLabelPosition: {
      control: 'select',
      options: ['start', 'middle', 'end', 'end-outside'],
      table: { category: 'Direct label' },
    },
    directLabelFormat: { control: 'text', table: { category: 'Direct label' } },
    enableClickCallback: { control: 'boolean', table: { category: 'Interactions' } },
    enableHoverCallbacks: { control: 'boolean', table: { category: 'Interactions' } },
    enableContextMenuCallback: { control: 'boolean', table: { category: 'Interactions' } },
  },
};

const renderBarAxis = (position: 'bottom' | 'left', args: BarPlaygroundArgs): ReactElement | undefined => {
  const isHorizontal = args.orientation === 'horizontal';
  const isMetricAxis = (position === 'bottom') === isHorizontal;
  const isBottom = position === 'bottom';
  if (!(isBottom ? args.showBottomAxis : args.showLeftAxis)) return undefined;
  const title = isBottom === isHorizontal ? args.leftAxisTitle : args.bottomAxisTitle;
  return (
    <Axis
      position={position}
      baseline={args.axisBaseline}
      grid={args.axisGrid && isMetricAxis}
      labelLimit={args.axisLabelLimit}
      title={title}
    >
      {args.showReferenceLine && isMetricAxis ? (
        <ReferenceLine value={50} label={args.referenceLineLabel} />
      ) : undefined}
    </Axis>
  );
};

const BAR_PLAYGROUND_KEYS = [
  'dataPreset',
  'chartTitle',
  'height',
  'maxWidth',
  'colorScheme',
  'backgroundColor',
  'showDirectLabel',
  'directLabelPosition',
  'directLabelFormat',
  'enableClickCallback',
  'enableHoverCallbacks',
  'enableContextMenuCallback',
  'showBottomAxis',
  'showLeftAxis',
  'bottomAxisTitle',
  'leftAxisTitle',
  'axisGrid',
  'axisBaseline',
  'axisLabelLimit',
  'showReferenceLine',
  'referenceLineLabel',
  ...inspectArgKeys,
  ...popoverArgKeys,
  ...legendArgKeys,
] as const;

const BarPlaygroundStory: StoryFn<BarPlaygroundArgs> = (args): ReactElement => {
  const {
    dataPreset,
    chartTitle,
    height,
    maxWidth,
    colorScheme,
    backgroundColor,
    showDirectLabel,
    directLabelPosition,
    directLabelFormat,
    enableClickCallback,
    enableHoverCallbacks,
    enableContextMenuCallback,
  } = args;
  const barProps = omitArgs(args, BAR_PLAYGROUND_KEYS);
  const [contextMenuLabel, setContextMenuLabel] = useState<string>();
  const data = getCartesianData(dataPreset);
  const chartProps = useChartProps({ data, height, maxWidth });
  const legendColor = Array.isArray(barProps.color) ? 'operatingSystem' : barProps.color;

  return (
    <div style={{ position: 'relative' }}>
      <Chart {...chartProps} colorScheme={colorScheme} backgroundColor={backgroundColor}>
        {renderPlaygroundTitle(chartTitle)}
        {renderBarAxis('bottom', args)}
        {renderBarAxis('left', args)}
        <Bar
          {...barProps}
          onClick={optionalAction(enableClickCallback, 'Bar:onClick')}
          onContextMenu={getContextMenuHandler(enableContextMenuCallback, 'Bar', setContextMenuLabel, [
            'browser',
            'series',
            'value',
          ])}
          onMouseOut={optionalAction(enableHoverCallbacks, 'Bar:onMouseOut')}
          onMouseOver={optionalAction(enableHoverCallbacks, 'Bar:onMouseOver')}
        >
          {renderPlaygroundInspect(args, DATUM_KEYS)}
          {renderPlaygroundPopover(args, DATUM_KEYS, 'Bar')}
          {showDirectLabel ? <BarDirectLabel position={directLabelPosition} format={directLabelFormat} /> : undefined}
        </Bar>
        {renderPlaygroundLegend(args, legendColor, 'Bar')}
      </Chart>
      <ContextMenuLabel label={contextMenuLabel} />
    </div>
  );
};

export const Playground = bindWithProps(BarPlaygroundStory);
Playground.args = {
  ...chartArgs,
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
