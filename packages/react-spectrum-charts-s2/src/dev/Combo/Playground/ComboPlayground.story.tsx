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

import { Chart } from '../../../Chart.js';
import { Axis, Bar, BarDirectLabel, Line, LineDirectLabel, LineForecast } from '../../../components/index.js';
import useChartProps from '../../../hooks/useChartProps.js';
import { Combo } from '../../../pre-alpha/index.js';
import { bindWithProps } from '../../../test-utils/index.js';
import { ComboProps, ContextMenuCallback } from '../../../types/index.js';
import {
  PlaygroundInspectArgs,
  PlaygroundLegendArgs,
  PlaygroundPopoverArgs,
  axesArgTypes,
  category,
  chartArgTypes,
  chartArgs,
  inspectArgKeys,
  inspectArgTypes,
  legendArgKeys,
  legendArgTypes,
  omitArgs,
  popoverArgKeys,
  popoverArgTypes,
  renderPlaygroundInspect,
  renderPlaygroundLegend,
  renderPlaygroundPopover,
  renderPlaygroundTitle,
} from '../../playgroundUtils.js';

const comboPlaygroundData = [
  {
    datetime: Date.UTC(2026, 0, 1),
    orders: 42,
    visits: 58,
    visitsForecast: null,
    series: 'Orders',
    staticPoint: false,
  },
  { datetime: Date.UTC(2026, 0, 2), orders: 55, visits: 63, visitsForecast: null, series: 'Orders', staticPoint: true },
  {
    datetime: Date.UTC(2026, 0, 3),
    orders: 61,
    visits: 70,
    visitsForecast: null,
    series: 'Orders',
    staticPoint: false,
  },
  { datetime: Date.UTC(2026, 0, 4), orders: 48, visits: 66, visitsForecast: 71, series: 'Orders', staticPoint: false },
  { datetime: Date.UTC(2026, 0, 5), orders: 70, visits: 82, visitsForecast: 86, series: 'Orders', staticPoint: true },
];

interface ComboPlaygroundArgs extends ComboProps, PlaygroundInspectArgs, PlaygroundPopoverArgs, PlaygroundLegendArgs {
  chartTitle?: string;
  height: number;
  maxWidth: number;
  colorScheme?: 'light' | 'dark';
  backgroundColor?: string;
  showBottomAxis: boolean;
  showLeftAxis: boolean;
  axisGrid: boolean;
  axisLabelFormat?: 'time' | 'linear' | 'percentage' | 'duration';
  showLegend: boolean;
  legendPosition: 'top' | 'bottom' | 'left' | 'right';
  legendTitle?: string;
  legendHighlight: boolean;
  legendToggleable: boolean;
  legendLabelLimit: number;
  showBar: boolean;
  barType: 'stacked' | 'dodged';
  showBarDirectLabel: boolean;
  showLine: boolean;
  showLineDirectLabel: boolean;
  showLineForecast: boolean;
  showInspect: boolean;
  inspectHighlightBy: 'item' | 'series' | 'dimension';
  inspectTargets: ('item' | 'dimensionArea')[];
  showPopover: boolean;
  popoverWidth: number;
  popoverRightClick: boolean;
  popoverHighlightBy: 'item' | 'series' | 'dimension';
}

export default {
  title: 'React Spectrum Charts 2/Pre-Alpha/Combo/Playground',
  component: Combo,
  argTypes: {
    ...chartArgTypes,
    ...axesArgTypes,
    ...legendArgTypes,
    ...inspectArgTypes,
    ...popoverArgTypes,
    ...category('Combo', ['dimension', 'name']),
    showBar: { control: 'boolean', table: { category: 'Bar child' } },
    barType: { control: 'select', options: ['stacked', 'dodged'], table: { category: 'Bar child' } },
    showBarDirectLabel: { control: 'boolean', table: { category: 'Bar child' } },
    showLine: { control: 'boolean', table: { category: 'Line child' } },
    showLineDirectLabel: { control: 'boolean', table: { category: 'Line child' } },
    showLineForecast: { control: 'boolean', table: { category: 'Line child' } },
  },
};

const preventContextMenu =
  (name: string): ContextMenuCallback =>
  (event, datum) => {
    event.preventDefault();
    action(`${name}:onContextMenu`)({ event, datum });
  };

const renderComboBar = (args: ComboPlaygroundArgs): ReactElement | undefined =>
  args.showBar ? (
    <Bar
      metric="orders"
      color={{ value: 'categorical-100' }}
      type={args.barType}
      onClick={action('Combo Bar:onClick')}
      onContextMenu={preventContextMenu('Combo Bar')}
      onMouseOver={action('Combo Bar:onMouseOver')}
      onMouseOut={action('Combo Bar:onMouseOut')}
    >
      {args.showBarDirectLabel ? <BarDirectLabel position="end-outside" format=",.0f" /> : undefined}
      {renderPlaygroundPopover(args, ['datetime', 'orders'], 'Combo Bar')}
    </Bar>
  ) : undefined;

const renderComboLine = (args: ComboPlaygroundArgs): ReactElement | undefined =>
  args.showLine ? (
    <Line
      metric="visits"
      color={{ value: 'categorical-200' }}
      scaleType="time"
      staticPoint="staticPoint"
      onClick={action('Combo Line:onClick')}
      onContextMenu={preventContextMenu('Combo Line')}
    >
      {renderPlaygroundInspect(args, ['datetime', 'visits'])}
      {args.showLineDirectLabel ? (
        <LineDirectLabel value="last" position="end" prefix="Visits " format=",.0f" />
      ) : undefined}
      {args.showLineForecast ? (
        <LineForecast metric="visitsForecast" start={Date.UTC(2026, 0, 4)} label="Forecast" />
      ) : undefined}
    </Line>
  ) : undefined;

const COMBO_PLAYGROUND_KEYS = [
  'chartTitle',
  'height',
  'maxWidth',
  'colorScheme',
  'backgroundColor',
  'showBottomAxis',
  'showLeftAxis',
  'axisGrid',
  'axisLabelFormat',
  'showBar',
  'barType',
  'showBarDirectLabel',
  'showLine',
  'showLineDirectLabel',
  'showLineForecast',
  ...inspectArgKeys,
  ...popoverArgKeys,
  ...legendArgKeys,
] as const;

const ComboPlaygroundStory: StoryFn<ComboPlaygroundArgs> = (args): ReactElement => {
  const {
    chartTitle,
    height,
    maxWidth,
    colorScheme,
    backgroundColor,
    showBottomAxis,
    showLeftAxis,
    axisGrid,
    axisLabelFormat,
  } = args;
  const comboProps = omitArgs(args, COMBO_PLAYGROUND_KEYS);
  const chartProps = useChartProps({ data: comboPlaygroundData, height, maxWidth });
  return (
    <Chart {...chartProps} colorScheme={colorScheme} backgroundColor={backgroundColor}>
      {renderPlaygroundTitle(chartTitle)}
      {showBottomAxis ? <Axis position="bottom" labelFormat={axisLabelFormat} title="Date" /> : undefined}
      {showLeftAxis ? <Axis position="left" grid={axisGrid} title="Volume" /> : undefined}
      <Combo {...comboProps}>
        {renderComboBar(args)}
        {renderComboLine(args)}
      </Combo>
      {renderPlaygroundLegend(args, 'series', 'Combo')}
    </Chart>
  );
};

export const Playground = bindWithProps(ComboPlaygroundStory);
Playground.args = {
  ...chartArgs,
  chartTitle: 'Orders and visits',
  height: 420,
  maxWidth: 760,
  showBottomAxis: true,
  showLeftAxis: true,
  axisGrid: true,
  axisLabelFormat: 'time',
  showLegend: true,
  legendPosition: 'bottom',
  legendTitle: 'Metric',
  legendHighlight: true,
  legendToggleable: true,
  legendLabelLimit: 160,
  showBar: true,
  barType: 'stacked',
  showBarDirectLabel: true,
  showLine: true,
  showLineDirectLabel: true,
  showLineForecast: true,
  showInspect: true,
  inspectHighlightBy: 'item',
  inspectTargets: ['item'],
  showPopover: true,
  popoverWidth: 240,
  popoverRightClick: false,
  popoverHighlightBy: 'item',
  dimension: 'datetime',
  name: 'combo0',
} satisfies ComboPlaygroundArgs;
