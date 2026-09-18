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

import { Chart } from '../../../../Chart';
import useChartProps from '../../../../hooks/useChartProps';
import { Bullet } from '../../../../pre-alpha';
import { bindWithProps } from '../../../../test-utils';
import { BulletProps } from '../../../../types';
import {
  basicBulletData,
  kmbtBulletData,
  kmbtThresholdsData,
  largeNumbersBulletData,
  largeNumbersThresholdsData,
} from '../../../data/bulletData';

export default {
  title: 'React Spectrum Charts 2/Pre-Alpha/Bullet/Features/NumberFormat',
  component: Bullet,
};

// K/M/B/T-range data, to demonstrate the abbreviation cutovers
const KmbtStory: StoryFn<BulletProps> = (args): ReactElement => {
  const chartProps = useChartProps({ data: kmbtBulletData, width: 500, height: 450 });
  return (
    <Chart {...chartProps}>
      <Bullet {...args} />
    </Chart>
  );
};

// billions-range data, enough to show currency-style formatting without the full K/M/B/T sweep
const LargeNumbersStory: StoryFn<BulletProps> = (args): ReactElement => {
  const chartProps = useChartProps({ data: largeNumbersBulletData, width: 500, height: 350 });
  return (
    <Chart {...chartProps}>
      <Bullet {...args} />
    </Chart>
  );
};

// small data, for custom d3-format specifiers that don't need large-number formatting
const BasicNumbersStory: StoryFn<BulletProps> = (args): ReactElement => {
  const chartProps = useChartProps({ data: basicBulletData, width: 500, height: 350 });
  return (
    <Chart {...chartProps}>
      <Bullet {...args} />
    </Chart>
  );
};

const sharedArgs: Partial<BulletProps> = {
  metric: 'currentAmount',
  dimension: 'graphLabel',
  target: 'target',
  direction: 'column',
  labelPosition: 'top',
  showTarget: true,
  showTargetValue: true,
};

// K/M/B/T abbreviations (e.g. 5.5K, 12.5M, 3.25B)
const ShortNumber = bindWithProps(KmbtStory);
ShortNumber.args = {
  ...sharedArgs,
  thresholds: kmbtThresholdsData,
  thresholdBarColor: true,
  numberFormat: 'shortNumber',
};

// K/M/B/T abbreviations with a currency symbol (e.g. $1.5M)
const ShortCurrency = bindWithProps(LargeNumbersStory);
ShortCurrency.args = {
  ...sharedArgs,
  thresholds: largeNumbersThresholdsData,
  thresholdBarColor: true,
  numberFormat: 'shortCurrency',
};

// full currency formatting (e.g. $1,500,000.00)
const Currency = bindWithProps(LargeNumbersStory);
Currency.args = {
  ...sharedArgs,
  thresholds: largeNumbersThresholdsData,
  thresholdBarColor: true,
  numberFormat: 'currency',
};

// a custom d3-format specifier, applied identically to the metric, target, and axis labels
const CustomFormat = bindWithProps(BasicNumbersStory);
CustomFormat.args = {
  ...sharedArgs,
  track: true,
  maxScaleValue: 500,
  numberFormat: ',.1f',
};

// a custom d3-format specifier for percentages (e.g. 30%)
const Percentage = bindWithProps(BasicNumbersStory);
Percentage.args = {
  ...sharedArgs,
  track: true,
  maxScaleValue: 500,
  numberFormat: '.0%',
};

export { ShortNumber, ShortCurrency, Currency, CustomFormat, Percentage };
