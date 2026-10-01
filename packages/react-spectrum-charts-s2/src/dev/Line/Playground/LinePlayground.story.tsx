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
import {
  Axis,
  ChartActionBar,
  ChartInspect,
  ChartPopover,
  Legend,
  Line,
  LineDirectLabel,
  LineForecast,
  LinePointAnnotation,
  ReferenceLine,
  Title,
} from '../../../components';
import useChartProps from '../../../hooks/useChartProps';
import { bindWithProps } from '../../../test-utils';
import { LineProps } from '../../../types';
import { CartesianDataPreset, playgroundTimeSeriesData } from '../../playgroundData';
import {
  axesArgTypes,
  category,
  chartArgTypes,
  chartArgs,
  inspectArgTypes,
  legendArgTypes,
  popoverArgTypes,
  renderActionBarContent,
  renderInspectContent,
  renderPopoverContent,
} from '../../playgroundUtils';

interface LinePlaygroundArgs extends LineProps {
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
    dataPreset: { ...chartArgTypes.dataPreset, options: ['timeSeries', 'multiSeries'] },
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

const LinePlaygroundStory: StoryFn<LinePlaygroundArgs> = ({
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
  showActionBar,
  actionBarEmphasized,
  actionBarMaxActions,
  showForecast,
  forecastMetric,
  forecastLabel,
  showDirectLabel,
  directLabelValue,
  directLabelPosition,
  directLabelPrefix,
  directLabelFormat,
  showPointAnnotation,
  pointAnnotationTextKey,
  pointAnnotationAnchor,
  pointAnnotationMatchLineColor,
  enableClickCallback,
  enableContextMenuCallback,
  ...lineProps
}): ReactElement => {
  const [contextMenuLabel, setContextMenuLabel] = useState<string>();
  const data =
    dataPreset === 'singleSeries'
      ? playgroundTimeSeriesData.filter((datum) => (datum as Record<string, unknown>).series === 'Create')
      : playgroundTimeSeriesData;
  const chartProps = useChartProps({ data, height, maxWidth });
  const effectiveRightClick = showActionBar ? true : popoverRightClick;

  return (
    <div style={{ position: 'relative' }}>
      <Chart {...chartProps} colorScheme={colorScheme} backgroundColor={backgroundColor}>
        {chartTitle ? <Title text={chartTitle} /> : undefined}
        {showBottomAxis ? (
          <Axis
            position="bottom"
            baseline={axisBaseline}
            labelFormat={axisLabelFormat}
            labelLimit={axisLabelLimit}
            title={bottomAxisTitle}
          />
        ) : undefined}
        {showLeftAxis ? (
          <Axis position="left" baseline={axisBaseline} grid={axisGrid} title={leftAxisTitle}>
            {showReferenceLine ? <ReferenceLine value={50} label={referenceLineLabel} /> : undefined}
          </Axis>
        ) : undefined}
        <Line
          {...lineProps}
          onClick={enableClickCallback ? action('Line:onClick') : undefined}
          onContextMenu={
            enableContextMenuCallback
              ? (event, datum): void => {
                  event.preventDefault();
                  action('Line:onContextMenu')({ event, datum });
                  setContextMenuLabel(
                    `Line context menu: ${String(
                      (datum as Record<string, unknown>).series ?? (datum as Record<string, unknown>).value
                    )}`
                  );
                }
              : undefined
          }
        >
          {showInspect ? (
            <ChartInspect highlightBy={inspectHighlightBy} targets={inspectTargets}>
              {renderInspectContent(['series', 'datetime', 'value'])}
            </ChartInspect>
          ) : undefined}
          {showPopover ? (
            <ChartPopover
              width={popoverWidth}
              rightClick={effectiveRightClick}
              UNSAFE_highlightBy={popoverHighlightBy}
              onOpenChange={action('Line ChartPopover:onOpenChange')}
            >
              {renderPopoverContent(['series', 'datetime', 'value'])}
            </ChartPopover>
          ) : undefined}
          {showActionBar ? (
            <ChartActionBar isEmphasized={actionBarEmphasized} maxActions={actionBarMaxActions}>
              {renderActionBarContent(['series', 'value'])}
            </ChartActionBar>
          ) : undefined}
          {showForecast ? (
            <LineForecast metric={forecastMetric} start={Date.UTC(2026, 0, 6)} label={forecastLabel} />
          ) : undefined}
          {showDirectLabel ? (
            <LineDirectLabel
              value={directLabelValue}
              position={directLabelPosition}
              prefix={directLabelPrefix}
              format={directLabelFormat}
            />
          ) : undefined}
          {showPointAnnotation ? (
            <LinePointAnnotation
              textKey={pointAnnotationTextKey}
              anchor={pointAnnotationAnchor}
              matchLineColor={pointAnnotationMatchLineColor}
            />
          ) : undefined}
        </Line>
        {showLegend ? (
          <Legend
            color={lineProps.color}
            position={legendPosition}
            title={legendTitle}
            highlight={legendHighlight}
            isToggleable={legendToggleable}
            labelLimit={legendLabelLimit}
            onClick={action('Line Legend:onClick')}
            onMouseOver={action('Line Legend:onMouseOver')}
            onMouseOut={action('Line Legend:onMouseOut')}
          />
        ) : undefined}
      </Chart>
      {contextMenuLabel ? (
        <div
          style={{ position: 'absolute', top: 8, right: 8, background: 'white', border: '1px solid #999', padding: 8 }}
        >
          {contextMenuLabel}
        </div>
      ) : undefined}
    </div>
  );
};

export const Playground = bindWithProps(LinePlaygroundStory);
Playground.args = {
  ...chartArgs,
  dataPreset: 'timeSeries',
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
