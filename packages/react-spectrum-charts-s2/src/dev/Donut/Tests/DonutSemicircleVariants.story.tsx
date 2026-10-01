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
import { ReactElement } from 'react';

import { StoryFn } from '@storybook/react';

import { sequentialCerulean5 } from '@spectrum-charts/themes';
import { ChartColors, ChartData } from '@spectrum-charts/vega-spec-builder-s2';

import { Chart } from '../../../Chart';
import { Legend } from '../../../components';
import useChartProps from '../../../hooks/useChartProps';
import { Donut, DonutSummary } from '../../../pre-alpha';
import { bindWithProps } from '../../../test-utils';
import { DonutProps, DonutSummaryProps } from '../../../types';

export default {
  title: 'React Spectrum Charts 2/Pre-Alpha/Donut/Tests/Semicircle Variants',
  component: Donut,
};

type SemicircleMode = 'browser' | 'ordinal' | 'boolean';
type SemicircleStoryProps = DonutProps &
  Pick<DonutSummaryProps, 'hideValue' | 'numberFormat' | 'delta'> & { mode?: SemicircleMode };

const browserData: ChartData[] = [
  { browser: 'Chrome', count: 55 },
  { browser: 'Safari', count: 25 },
  { browser: 'Firefox', count: 12 },
  { browser: 'Edge', count: 8 },
];

const booleanData: ChartData[] = [
  { id: 'Complete', value: 0.68 },
  { id: 'Remaining', value: 0.32 },
];

const ordinalData: ChartData[] = [
  { response: 'Strongly agree', count: 18 },
  { response: 'Agree', count: 32 },
  { response: 'Neutral', count: 24 },
  { response: 'Disagree', count: 16 },
  { response: 'Strongly disagree', count: 10 },
];

const ordinalColors: ChartColors = [sequentialCerulean5[1], sequentialCerulean5[0], ...sequentialCerulean5.slice(2)];

const modeConfig: Record<
  SemicircleMode,
  { data: ChartData[]; colors?: ChartColors; label: string; legendTitle: string; donutProps: Partial<DonutProps> }
> = {
  browser: {
    data: browserData,
    label: 'Share',
    legendTitle: 'Browser',
    donutProps: { metric: 'count', color: 'browser' },
  },
  ordinal: {
    data: ordinalData,
    colors: ordinalColors,
    label: 'Responses',
    legendTitle: 'Response',
    donutProps: { metric: 'count', color: 'response', sortOrder: 'data' },
  },
  boolean: {
    data: booleanData,
    label: 'Success rate',
    legendTitle: 'Status',
    donutProps: { metric: 'value', color: 'id', isBoolean: true },
  },
};

const SemicircleStory: StoryFn<SemicircleStoryProps> = (args): ReactElement => {
  const { hideValue, numberFormat, delta, mode = 'ordinal', ...donutOnlyProps } = args;
  const config = modeConfig[mode];
  const chartProps = useChartProps({
    data: config.data,
    width: 420,
    height: 260,
    ...(config.colors && { colors: config.colors }),
  });

  return (
    <Chart {...chartProps}>
      <Donut variant="semicircle" {...config.donutProps} {...donutOnlyProps}>
        <DonutSummary hideValue={hideValue} label={config.label} numberFormat={numberFormat} delta={delta} />
      </Donut>
      <Legend title={config.legendTitle} position="right" highlight />
    </Chart>
  );
};

const SemicircleOrdinal = bindWithProps(SemicircleStory);
SemicircleOrdinal.args = { mode: 'ordinal' };

const SemicircleBoolean = bindWithProps(SemicircleStory);
SemicircleBoolean.args = { mode: 'boolean' };

export { SemicircleBoolean, SemicircleOrdinal };
