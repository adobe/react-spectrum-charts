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
import {
  Axis,
  ChartActionBar,
  Line,
  LineDirectLabel,
  LineForecast,
  LinePointAnnotation,
  ReferenceLine,
} from '../../../components/index.js';
import useChartProps from '../../../hooks/useChartProps.js';
import { bindWithProps } from '../../../test-utils/index.js';
import { LineProps } from '../../../types/index.js';
import { CartesianDataPreset, playgroundTimeSeriesData } from '../../playgroundData.js';
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
  renderActionBarContent,
  renderPlaygroundInspect,
  renderPlaygroundLegend,
  renderPlaygroundPopover,
  renderPlaygroundTitle,
} from '../../playgroundUtils.js';

interface LinePlaygroundArgs extends LineProps, PlaygroundInspectArgs, PlaygroundPopoverArgs, PlaygroundLegendArgs {
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
  showActionBar: boolean;
  actionBarEmphasized: boolean;
  actionBarMaxActions: number;
  showForecast: boolean;
  forecastMetric: string;
  forecastLabel: string;
  showDirectLabel: boolean;
  directLabelValue: 'last' | 'average' | 'series';
  directLabelPosition: 'start' | 'end';
  directLabelPrefix: string;
  directLabelFormat: string;
  showPointAnnotation: boolean;
  pointAnnotationTextKey: string;
  pointAnnotationAnchor: 'top' | 'bottom' | 'left' | 'right';
  pointAnnotationMatchLineColor: boolean;
  enableClickCallback: boolean;
  enableContextMenuCallback: boolean;
}

export default {
  title: 'React Spectrum Charts 2/Line/Playground',
  component: Line,
  argTypes: {
    ...chartArgTypes,
    dataPreset: { ...chartArgTypes.dataPreset, options: ['multiSeries', 'singleSeries'] },
    ...axesArgTypes,
    ...legendArgTypes,
    ...inspectArgTypes,
    ...popoverArgTypes,
    ...category('Line', [
      'name',
      'metric',
      'color',
      'dimension',
      'lineType',
      'opacity',
      'padding',
      'pointSize',
      'isSparkline',
      'isMethodLast',
      'scaleType',
      'staticPoint',
      'interactionMode',
      'metricAxis',
      'dualMetricAxis',
      'gradient',
      'interpolate',
      'lineCap',
      'alternateSegmentKey',
      'alternateSegmentLineType',
      'alternateSegmentLabel',
      'primarySeries',
      'otherSeriesColor',
      'dimensionHover',
      'showHoverLabel',
      'hoverLabelKey',
    ]),
    scaleType: { control: 'select', options: ['time', 'linear', 'point'], table: { category: 'Line' } },
    interactionMode: { control: 'select', options: ['item', 'nearest', 'dimension'], table: { category: 'Line' } },
    interpolate: {
      control: 'select',
      options: [
        undefined,
        'basis',
        'cardinal',
        'catmull-rom',
        'linear',
        'monotone',
        'natural',
        'step',
        'step-after',
        'step-before',
      ],
      table: { category: 'Line' },
    },
    lineCap: { control: 'select', options: ['round', 'square'], table: { category: 'Line' } },
    alternateSegmentLineType: {
      control: 'select',
      options: [undefined, 'solid', 'dashed', 'dotted', 'dotDash', 'longDash', 'twoDash'],
      table: { category: 'Line' },
    },
    showActionBar: { control: 'boolean', table: { category: 'Action bar' } },
    actionBarEmphasized: { control: 'boolean', table: { category: 'Action bar' } },
    actionBarMaxActions: { control: { type: 'range', min: 1, max: 4, step: 1 }, table: { category: 'Action bar' } },
    showForecast: { control: 'boolean', table: { category: 'Forecast' } },
    forecastMetric: { control: 'text', table: { category: 'Forecast' } },
    forecastLabel: { control: 'text', table: { category: 'Forecast' } },
    showDirectLabel: { control: 'boolean', table: { category: 'Direct label' } },
    directLabelValue: {
      control: 'select',
      options: ['last', 'average', 'series'],
      table: { category: 'Direct label' },
    },
    directLabelPosition: { control: 'select', options: ['start', 'end'], table: { category: 'Direct label' } },
    directLabelPrefix: { control: 'text', table: { category: 'Direct label' } },
    directLabelFormat: { control: 'text', table: { category: 'Direct label' } },
    showPointAnnotation: { control: 'boolean', table: { category: 'Point annotation' } },
    pointAnnotationTextKey: { control: 'text', table: { category: 'Point annotation' } },
    pointAnnotationAnchor: {
      control: 'select',
      options: ['top', 'bottom', 'left', 'right'],
      table: { category: 'Point annotation' },
    },
    pointAnnotationMatchLineColor: { control: 'boolean', table: { category: 'Point annotation' } },
    enableClickCallback: { control: 'boolean', table: { category: 'Interactions' } },
    enableContextMenuCallback: { control: 'boolean', table: { category: 'Interactions' } },
  },
};

const DATUM_KEYS = ['series', 'datetime', 'value'];

const renderLineAxes = (args: LinePlaygroundArgs): ReactElement[] => {
  const axes: ReactElement[] = [];
  if (args.showBottomAxis) {
    axes.push(
      <Axis
        key="bottom"
        position="bottom"
        baseline={args.axisBaseline}
        labelFormat={args.axisLabelFormat}
        labelLimit={args.axisLabelLimit}
        title={args.bottomAxisTitle}
      />
    );
  }
  if (args.showLeftAxis) {
    axes.push(
      <Axis key="left" position="left" baseline={args.axisBaseline} grid={args.axisGrid} title={args.leftAxisTitle}>
        {args.showReferenceLine ? <ReferenceLine value={50} label={args.referenceLineLabel} /> : undefined}
      </Axis>
    );
  }
  return axes;
};

const renderLineAnnotations = (args: LinePlaygroundArgs): ReactElement[] => {
  const children: ReactElement[] = [];
  if (args.showActionBar) {
    children.push(
      <ChartActionBar key="actionBar" isEmphasized={args.actionBarEmphasized} maxActions={args.actionBarMaxActions}>
        {renderActionBarContent(['series', 'value'])}
      </ChartActionBar>
    );
  }
  if (args.showForecast) {
    children.push(
      <LineForecast
        key="forecast"
        metric={args.forecastMetric}
        start={Date.UTC(2026, 0, 6)}
        label={args.forecastLabel}
      />
    );
  }
  if (args.showDirectLabel) {
    children.push(
      <LineDirectLabel
        key="directLabel"
        value={args.directLabelValue}
        position={args.directLabelPosition}
        prefix={args.directLabelPrefix}
        format={args.directLabelFormat}
      />
    );
  }
  if (args.showPointAnnotation) {
    children.push(
      <LinePointAnnotation
        key="pointAnnotation"
        textKey={args.pointAnnotationTextKey}
        anchor={args.pointAnnotationAnchor}
        matchLineColor={args.pointAnnotationMatchLineColor}
      />
    );
  }
  return children;
};

const LINE_PLAYGROUND_KEYS = [
  'dataPreset',
  'chartTitle',
  'height',
  'maxWidth',
  'colorScheme',
  'backgroundColor',
  'showActionBar',
  'popoverRightClick',
  'enableClickCallback',
  'enableContextMenuCallback',
  'showBottomAxis',
  'showLeftAxis',
  'bottomAxisTitle',
  'leftAxisTitle',
  'axisGrid',
  'axisBaseline',
  'axisLabelFormat',
  'axisLabelLimit',
  'showReferenceLine',
  'referenceLineLabel',
  'actionBarEmphasized',
  'actionBarMaxActions',
  'showForecast',
  'forecastMetric',
  'forecastLabel',
  'showDirectLabel',
  'directLabelValue',
  'directLabelPosition',
  'directLabelPrefix',
  'directLabelFormat',
  'showPointAnnotation',
  'pointAnnotationTextKey',
  'pointAnnotationAnchor',
  'pointAnnotationMatchLineColor',
  ...inspectArgKeys,
  ...popoverArgKeys,
  ...legendArgKeys,
] as const;

const LinePlaygroundStory: StoryFn<LinePlaygroundArgs> = (args): ReactElement => {
  const {
    dataPreset,
    chartTitle,
    height,
    maxWidth,
    colorScheme,
    backgroundColor,
    showActionBar,
    popoverRightClick,
    enableClickCallback,
    enableContextMenuCallback,
  } = args;
  const lineProps = omitArgs(args, LINE_PLAYGROUND_KEYS);
  const [contextMenuLabel, setContextMenuLabel] = useState<string>();
  const data =
    dataPreset === 'singleSeries'
      ? playgroundTimeSeriesData.filter((datum) => (datum as Record<string, unknown>).series === 'Create')
      : playgroundTimeSeriesData;
  const chartProps = useChartProps({ data, height, maxWidth });
  const popoverArgs = { ...args, popoverRightClick: showActionBar || popoverRightClick };

  return (
    <div style={{ position: 'relative' }}>
      <Chart {...chartProps} colorScheme={colorScheme} backgroundColor={backgroundColor}>
        {renderPlaygroundTitle(chartTitle)}
        {renderLineAxes(args)}
        <Line
          {...lineProps}
          onClick={optionalAction(enableClickCallback, 'Line:onClick')}
          onContextMenu={getContextMenuHandler(enableContextMenuCallback, 'Line', setContextMenuLabel, [
            'series',
            'value',
          ])}
        >
          {renderPlaygroundInspect(args, DATUM_KEYS)}
          {renderPlaygroundPopover(popoverArgs, DATUM_KEYS, 'Line')}
          {renderLineAnnotations(args)}
        </Line>
        {renderPlaygroundLegend(args, lineProps.color, 'Line')}
      </Chart>
      <ContextMenuLabel label={contextMenuLabel} />
    </div>
  );
};

export const Playground = bindWithProps(LinePlaygroundStory);
Playground.args = {
  ...chartArgs,
  dataPreset: 'multiSeries',
  chartTitle: 'Workspace activity forecast',
  height: 420,
  maxWidth: 780,
  showBottomAxis: true,
  showLeftAxis: true,
  bottomAxisTitle: 'Date',
  leftAxisTitle: 'Events',
  axisGrid: true,
  axisBaseline: false,
  axisLabelFormat: 'time',
  axisLabelLimit: 120,
  showReferenceLine: true,
  referenceLineLabel: 'Goal',
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
  showActionBar: false,
  actionBarEmphasized: false,
  actionBarMaxActions: 2,
  showForecast: true,
  forecastMetric: 'forecastValue',
  forecastLabel: 'Forecast',
  showDirectLabel: true,
  directLabelValue: 'last',
  directLabelPosition: 'end',
  directLabelPrefix: '',
  directLabelFormat: ',.0f',
  showPointAnnotation: true,
  pointAnnotationTextKey: 'annotation',
  pointAnnotationAnchor: 'top',
  pointAnnotationMatchLineColor: true,
  enableClickCallback: true,
  enableContextMenuCallback: true,
  name: 'line0',
  dimension: 'datetime',
  metric: 'value',
  color: 'series',
  scaleType: 'time',
  staticPoint: 'staticPoint',
  lineType: { value: 'solid' },
  opacity: { value: 1 },
  pointSize: 80,
  isSparkline: false,
  isMethodLast: false,
  interactionMode: 'item',
  gradient: false,
  lineCap: 'round',
  alternateSegmentKey: 'alternate',
  alternateSegmentLineType: 'dashed',
  alternateSegmentLabel: 'Projected',
  dimensionHover: false,
  showHoverLabel: true,
  hoverLabelKey: 'value',
} satisfies LinePlaygroundArgs;
