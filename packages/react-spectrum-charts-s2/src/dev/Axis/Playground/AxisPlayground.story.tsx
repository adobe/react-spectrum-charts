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
import { Axis, AxisThumbnail, Bar, ReferenceLine, Title } from '../../../components';
import useChartProps from '../../../hooks/useChartProps';
import { bindWithProps } from '../../../test-utils';
import { AxisProps } from '../../../types';
import { CartesianDataPreset, getCartesianData } from '../../playgroundData';
import { category, chartArgTypes } from '../../playgroundUtils';

interface AxisPlaygroundArgs extends AxisProps {
  dataPreset: CartesianDataPreset;
  chartTitle?: string;
  height: number;
  maxWidth: number;
  colorScheme?: 'light' | 'dark';
  backgroundColor?: string;
  showComparisonAxis: boolean;
  comparisonAxisGrid: boolean;
  barOrientation: 'vertical' | 'horizontal';
  barColor: string;
  showReferenceLine: boolean;
  referenceLineLabel: string;
  referenceLineSecondary: boolean;
  showAxisThumbnail: boolean;
  axisThumbnailUrlKey: string;
}

export default {
  title: 'React Spectrum Charts 2/Axis/Playground',
  component: Axis,
  argTypes: {
    ...chartArgTypes,
    dataPreset: { ...chartArgTypes.dataPreset, options: ['singleSeries', 'multiSeries', 'negativeValues', 'longLabels'] },
    ...category('Axis', ['position', 'name', 'baseline', 'baselineOffset', 'granularity', 'grid', 'hideDefaultLabels', 'labelAlign', 'labelFontWeight', 'labelFormat', 'labelOrientation', 'labelLimit', 'labels', 'tickCountMinimum', 'tickCountLimit', 'numberFormat', 'range', 'subLabels', 'ticks', 'hasTooltip', 'tooltipText', 'tickMinStep', 'title', 'truncateLabels', 'currencyLocale', 'currencyCode']),
    position: { control: 'select', options: ['bottom', 'left', 'right', 'top'], table: { category: 'Axis' } },
    granularity: { control: 'select', options: ['second', 'minute', 'hour', 'day', 'week', 'month', 'quarter', 'year'], table: { category: 'Axis' } },
    labelAlign: { control: 'select', options: ['center', 'start', 'end'], table: { category: 'Axis' } },
    labelFontWeight: { control: 'select', options: ['normal', 'bold'], table: { category: 'Axis' } },
    labelFormat: { control: 'select', options: [undefined, 'duration', 'linear', 'percentage', 'time'], table: { category: 'Axis' } },
    labelOrientation: { control: 'select', options: ['horizontal', 'vertical'], table: { category: 'Axis' } },
    labelLimit: { control: { type: 'range', min: 40, max: 240, step: 5 }, table: { category: 'Axis' } },
    barOrientation: { control: 'select', options: ['vertical', 'horizontal'], table: { category: 'Context mark' } },
    barColor: { control: 'text', table: { category: 'Context mark' } },
    showComparisonAxis: { control: 'boolean', table: { category: 'Context axes' } },
    comparisonAxisGrid: { control: 'boolean', table: { category: 'Context axes' } },
    showReferenceLine: { control: 'boolean', table: { category: 'Reference line' } },
    referenceLineLabel: { control: 'text', table: { category: 'Reference line' } },
    referenceLineSecondary: { control: 'boolean', table: { category: 'Reference line' } },
    showAxisThumbnail: { control: 'boolean', table: { category: 'Axis thumbnail' } },
    axisThumbnailUrlKey: { control: 'text', table: { category: 'Axis thumbnail' } },
  },
};

const AxisPlaygroundStory: StoryFn<AxisPlaygroundArgs> = ({
  dataPreset,
  chartTitle,
  height,
  maxWidth,
  colorScheme,
  backgroundColor,
  showComparisonAxis,
  comparisonAxisGrid,
  barOrientation,
  barColor,
  showReferenceLine,
  referenceLineLabel,
  referenceLineSecondary,
  showAxisThumbnail,
  axisThumbnailUrlKey,
  ...axisProps
}): ReactElement => {
  const chartProps = useChartProps({ data: getCartesianData(dataPreset), height, maxWidth });
  const comparisonPosition = axisProps.position === 'bottom' || axisProps.position === 'top' ? 'left' : 'bottom';
  return (
    <Chart {...chartProps} colorScheme={colorScheme} backgroundColor={backgroundColor}>
      {chartTitle ? <Title text={chartTitle} /> : undefined}
      <Axis {...axisProps} onClick={action('Axis:onClick')}>
        {showReferenceLine ? <ReferenceLine value="Safari" label={referenceLineLabel} secondary={referenceLineSecondary} /> : undefined}
        {showAxisThumbnail ? <AxisThumbnail urlKey={axisThumbnailUrlKey} /> : undefined}
      </Axis>
      {showComparisonAxis ? <Axis position={comparisonPosition} grid={comparisonAxisGrid} /> : undefined}
      <Bar dimension="browser" metric="value" color={barColor} orientation={barOrientation} order="order" />
    </Chart>
  );
};

export const Playground = bindWithProps(AxisPlaygroundStory);
Playground.args = {
  dataPreset: 'longLabels',
  chartTitle: 'Axis feature playground',
  height: 400,
  maxWidth: 760,
  showComparisonAxis: true,
  comparisonAxisGrid: true,
  barOrientation: 'vertical',
  barColor: 'operatingSystem',
  showReferenceLine: true,
  referenceLineLabel: 'Target',
  referenceLineSecondary: false,
  showAxisThumbnail: true,
  axisThumbnailUrlKey: 'thumbnail',
  position: 'bottom',
  baseline: true,
  baselineOffset: 0,
  granularity: 'day',
  grid: false,
  hideDefaultLabels: false,
  labelAlign: 'center',
  labelFontWeight: 'normal',
  labelFormat: undefined,
  labelOrientation: 'horizontal',
  labelLimit: 120,
  numberFormat: 'shortNumber',
  ticks: true,
  tickCountLimit: 8,
  tickCountMinimum: 2,
  title: 'Browser',
  truncateLabels: true,
} satisfies AxisPlaygroundArgs;
