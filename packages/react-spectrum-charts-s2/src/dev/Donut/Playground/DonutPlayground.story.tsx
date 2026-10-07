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
import { ChartInspect, ChartPopover, Legend, Title } from '../../../components';
import useChartProps from '../../../hooks/useChartProps';
import { Donut, DonutSummary, SegmentLabel } from '../../../pre-alpha';
import { bindWithProps } from '../../../test-utils';
import { DonutProps } from '../../../types';
import { DonutDataPreset, getDonutData } from '../../playgroundData';
import {
  category,
  chartArgTypes,
  chartArgs,
  inspectArgTypes,
  legendArgTypes,
  popoverArgTypes,
  renderInspectContent,
  renderPopoverContent,
} from '../../playgroundUtils';

interface DonutPlaygroundArgs extends DonutProps {
  dataPreset: DonutDataPreset;
  chartTitle?: string;
  height: number;
  maxWidth: number;
  colorScheme?: 'light' | 'dark';
  backgroundColor?: string;
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
  showSummary: boolean;
  summaryLabel: string;
  summaryNumberFormat: string;
  summaryHideValue: boolean;
  summaryDelta: number;
  showSegmentLabel: boolean;
  segmentLabelMode: 'emphasized' | 'deemphasized';
  segmentLabelKey: string;
  segmentLabelPercent: boolean;
  segmentLabelValue: boolean;
  segmentLabelSwatch: boolean;
  segmentLabelShowValueRow: boolean;
  segmentLabelShowTotal: boolean;
}

export default {
  title: 'React Spectrum Charts 2/Pre-Alpha/Donut/Playground',
  component: Donut,
  argTypes: {
    ...chartArgTypes,
    dataPreset: { ...chartArgTypes.dataPreset, options: ['browserShare', 'emphasized', 'boolean'] },
    ...legendArgTypes,
    ...inspectArgTypes,
    ...popoverArgTypes,
    ...category('Donut', [
      'color',
      'holeRatio',
      'isBoolean',
      'metric',
      'name',
      'sortOrder',
      'emphasizedItems',
      'hideDeemphasizedLabels',
      'variant',
    ]),
    holeRatio: { control: { type: 'range', min: 0.1, max: 0.9, step: 0.05 }, table: { category: 'Donut' } },
    sortOrder: { control: 'select', options: ['valueDescending', 'data'], table: { category: 'Donut' } },
    variant: { control: 'select', options: ['circle', 'semicircle'], table: { category: 'Donut' } },
    showSummary: { control: 'boolean', table: { category: 'Summary' } },
    summaryLabel: { control: 'text', table: { category: 'Summary' } },
    summaryNumberFormat: { control: 'text', table: { category: 'Summary' } },
    summaryHideValue: { control: 'boolean', table: { category: 'Summary' } },
    summaryDelta: { control: { type: 'range', min: -1, max: 1, step: 0.01 }, table: { category: 'Summary' } },
    showSegmentLabel: { control: 'boolean', table: { category: 'Segment label' } },
    segmentLabelMode: {
      control: 'select',
      options: ['emphasized', 'deemphasized'],
      table: { category: 'Segment label' },
    },
    segmentLabelKey: { control: 'text', table: { category: 'Segment label' } },
    segmentLabelPercent: { control: 'boolean', table: { category: 'Segment label' } },
    segmentLabelValue: { control: 'boolean', table: { category: 'Segment label' } },
    segmentLabelSwatch: { control: 'boolean', table: { category: 'Segment label' } },
    segmentLabelShowValueRow: { control: 'boolean', table: { category: 'Segment label' } },
    segmentLabelShowTotal: { control: 'boolean', table: { category: 'Segment label' } },
  },
};

const DonutPlaygroundStory: StoryFn<DonutPlaygroundArgs> = ({
  dataPreset,
  chartTitle,
  height,
  maxWidth,
  colorScheme,
  backgroundColor,
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
  showSummary,
  summaryLabel,
  summaryNumberFormat,
  summaryHideValue,
  summaryDelta,
  showSegmentLabel,
  segmentLabelMode,
  segmentLabelKey,
  segmentLabelPercent,
  segmentLabelValue,
  segmentLabelSwatch,
  segmentLabelShowValueRow,
  segmentLabelShowTotal,
  ...donutProps
}): ReactElement => {
  const chartProps = useChartProps({ data: getDonutData(dataPreset), height, maxWidth });
  const isBoolean = dataPreset === 'boolean' || donutProps.isBoolean;

  return (
    <Chart {...chartProps} colorScheme={colorScheme} backgroundColor={backgroundColor}>
      {chartTitle ? <Title text={chartTitle} /> : undefined}
      <Donut {...donutProps} isBoolean={isBoolean}>
        {showInspect ? (
          <ChartInspect highlightBy={inspectHighlightBy} targets={inspectTargets}>
            {renderInspectContent(['browser', 'count'])}
          </ChartInspect>
        ) : undefined}
        {showPopover ? (
          <ChartPopover
            width={popoverWidth}
            rightClick={popoverRightClick}
            UNSAFE_highlightBy={popoverHighlightBy}
            onOpenChange={action('Donut ChartPopover:onOpenChange')}
          >
            {renderPopoverContent(['browser', 'count'])}
          </ChartPopover>
        ) : undefined}
        {showSummary ? (
          <DonutSummary
            label={summaryLabel}
            numberFormat={summaryNumberFormat}
            hideValue={summaryHideValue}
            delta={summaryDelta}
          />
        ) : undefined}
        {showSegmentLabel ? (
          <SegmentLabel
            labelMode={segmentLabelMode}
            labelKey={segmentLabelKey}
            percent={segmentLabelPercent}
            value={segmentLabelValue}
            swatch={segmentLabelSwatch}
            showValueRow={segmentLabelShowValueRow}
            showTotal={segmentLabelShowTotal}
          />
        ) : undefined}
      </Donut>
      {showLegend ? (
        <Legend
          color={donutProps.color}
          position={legendPosition}
          title={legendTitle}
          highlight={legendHighlight}
          isToggleable={legendToggleable}
          labelLimit={legendLabelLimit}
          onClick={action('Donut Legend:onClick')}
          onMouseOver={action('Donut Legend:onMouseOver')}
          onMouseOut={action('Donut Legend:onMouseOut')}
        />
      ) : undefined}
    </Chart>
  );
};

export const Playground = bindWithProps(DonutPlaygroundStory);
Playground.args = {
  ...chartArgs,
  dataPreset: 'browserShare',
  chartTitle: 'Browser share',
  height: 420,
  maxWidth: 560,
  showLegend: true,
  legendPosition: 'right',
  legendTitle: 'Browser',
  legendHighlight: true,
  legendToggleable: true,
  legendLabelLimit: 160,
  showInspect: true,
  inspectHighlightBy: 'item',
  inspectTargets: ['item'],
  showPopover: true,
  popoverWidth: 240,
  popoverRightClick: false,
  popoverHighlightBy: 'item',
  showSummary: true,
  summaryLabel: 'Total sessions',
  summaryNumberFormat: 'shortNumber',
  summaryHideValue: false,
  summaryDelta: 0.08,
  showSegmentLabel: true,
  segmentLabelMode: 'emphasized',
  segmentLabelKey: 'segmentLabel',
  segmentLabelPercent: true,
  segmentLabelValue: true,
  segmentLabelSwatch: true,
  segmentLabelShowValueRow: true,
  segmentLabelShowTotal: false,
  color: 'browser',
  metric: 'count',
  name: 'donut0',
  holeRatio: 0.72,
  isBoolean: false,
  sortOrder: 'valueDescending',
  emphasizedItems: ['Chrome', 'Safari'],
  hideDeemphasizedLabels: false,
  variant: 'circle',
} satisfies DonutPlaygroundArgs;
