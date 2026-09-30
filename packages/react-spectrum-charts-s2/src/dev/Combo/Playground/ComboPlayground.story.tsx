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
import { Axis, Bar, BarDirectLabel, ChartInspect, ChartPopover, Legend, Line, LineDirectLabel, LineForecast, Title } from '../../../components';
import useChartProps from '../../../hooks/useChartProps';
import { Combo } from '../../../pre-alpha';
import { bindWithProps } from '../../../test-utils';
import { ComboProps } from '../../../types';
import { axesArgTypes, category, chartArgTypes, inspectArgTypes, legendArgTypes, popoverArgTypes, renderInspectContent, renderPopoverContent } from '../../playgroundUtils';

const comboPlaygroundData = [
  { datetime: Date.UTC(2026, 0, 1), orders: 42, visits: 58, visitsForecast: null, series: 'Orders', staticPoint: false },
  { datetime: Date.UTC(2026, 0, 2), orders: 55, visits: 63, visitsForecast: null, series: 'Orders', staticPoint: true },
  { datetime: Date.UTC(2026, 0, 3), orders: 61, visits: 70, visitsForecast: null, series: 'Orders', staticPoint: false },
  { datetime: Date.UTC(2026, 0, 4), orders: 48, visits: 66, visitsForecast: 71, series: 'Orders', staticPoint: false },
  { datetime: Date.UTC(2026, 0, 5), orders: 70, visits: 82, visitsForecast: 86, series: 'Orders', staticPoint: true },
];

interface ComboPlaygroundArgs extends ComboProps {
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

const ComboPlaygroundStory: StoryFn<ComboPlaygroundArgs> = ({
  chartTitle,
  height,
  maxWidth,
  colorScheme,
  backgroundColor,
  showBottomAxis,
  showLeftAxis,
  axisGrid,
  axisLabelFormat,
  showLegend,
  legendPosition,
  legendTitle,
  legendHighlight,
  legendToggleable,
  legendLabelLimit,
  showBar,
  barType,
  showBarDirectLabel,
  showLine,
  showLineDirectLabel,
  showLineForecast,
  showInspect,
  inspectHighlightBy,
  inspectTargets,
  showPopover,
  popoverWidth,
  popoverRightClick,
  popoverHighlightBy,
  ...comboProps
}): ReactElement => {
  const chartProps = useChartProps({ data: comboPlaygroundData, height, maxWidth });
  return (
    <Chart {...chartProps} colorScheme={colorScheme} backgroundColor={backgroundColor}>
      {chartTitle ? <Title text={chartTitle} /> : undefined}
      {showBottomAxis ? <Axis position="bottom" labelFormat={axisLabelFormat} title="Date" /> : undefined}
      {showLeftAxis ? <Axis position="left" grid={axisGrid} title="Volume" /> : undefined}
      <Combo {...comboProps}>
        {showBar ? (
          <Bar
            metric="orders"
            color={{ value: 'categorical-100' }}
            type={barType}
            onClick={action('Combo Bar:onClick')}
            onContextMenu={(event, datum): void => {
              event.preventDefault();
              action('Combo Bar:onContextMenu')({ event, datum });
            }}
            onMouseOver={action('Combo Bar:onMouseOver')}
            onMouseOut={action('Combo Bar:onMouseOut')}
          >
            {showBarDirectLabel ? <BarDirectLabel position="end-outside" format=",.0f" /> : undefined}
            {showPopover ? <ChartPopover width={popoverWidth} rightClick={popoverRightClick} UNSAFE_highlightBy={popoverHighlightBy} onOpenChange={action('Combo Bar ChartPopover:onOpenChange')}>{renderPopoverContent(['datetime', 'orders'])}</ChartPopover> : undefined}
          </Bar>
        ) : undefined}
        {showLine ? (
          <Line
            metric="visits"
            color={{ value: 'categorical-200' }}
            scaleType="time"
            staticPoint="staticPoint"
            onClick={action('Combo Line:onClick')}
            onContextMenu={(event, datum): void => {
              event.preventDefault();
              action('Combo Line:onContextMenu')({ event, datum });
            }}
          >
            {showInspect ? <ChartInspect highlightBy={inspectHighlightBy} targets={inspectTargets}>{renderInspectContent(['datetime', 'visits'])}</ChartInspect> : undefined}
            {showLineDirectLabel ? <LineDirectLabel value="last" position="end" prefix="Visits " format=",.0f" /> : undefined}
            {showLineForecast ? <LineForecast metric="visitsForecast" start={Date.UTC(2026, 0, 4)} label="Forecast" /> : undefined}
          </Line>
        ) : undefined}
      </Combo>
      {showLegend ? <Legend color="series" position={legendPosition} title={legendTitle} highlight={legendHighlight} isToggleable={legendToggleable} labelLimit={legendLabelLimit} onClick={action('Combo Legend:onClick')} onMouseOver={action('Combo Legend:onMouseOver')} onMouseOut={action('Combo Legend:onMouseOut')} /> : undefined}
    </Chart>
  );
};

export const Playground = bindWithProps(ComboPlaygroundStory);
Playground.args = {
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
