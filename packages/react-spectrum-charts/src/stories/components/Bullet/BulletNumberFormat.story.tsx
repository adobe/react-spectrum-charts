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

import { Chart } from '../../../Chart';
import { Bullet } from '../../../alpha';
import useChartProps from '../../../hooks/useChartProps';
import { bindWithProps } from '../../../test-utils';
import { BulletProps } from '../../../types';
import { basicBulletData, kmbtBulletData, kmbtThresholdsData, largeNumbersBulletData, largeNumbersThresholdsData } from './data';

export default {
  title: 'RSC/Bullet (alpha)/Number Format',
  component: Bullet,
};

// Story template for KMBT examples
const KmbtStory: StoryFn<BulletProps & { width?: number; height?: number }> = (args): ReactElement => {
  const { width, height, ...bulletProps } = args;
  const chartProps = useChartProps({
    data: kmbtBulletData,
    width: width ?? 500,
    height: height ?? 450,
  });
  return (
    <Chart {...chartProps}>
      <Bullet {...bulletProps} />
    </Chart>
  );
};

// Story template for large numbers
const LargeNumbersStory: StoryFn<BulletProps & { width?: number; height?: number }> = (args): ReactElement => {
  const { width, height, ...bulletProps } = args;
  const chartProps = useChartProps({
    data: largeNumbersBulletData,
    width: width ?? 500,
    height: height ?? 350,
  });
  return (
    <Chart {...chartProps}>
      <Bullet {...bulletProps} />
    </Chart>
  );
};

// Story template for basic numbers
const BasicNumbersStory: StoryFn<BulletProps & { width?: number; height?: number }> = (args): ReactElement => {
  const { width, height, ...bulletProps } = args;
  const chartProps = useChartProps({
    data: basicBulletData,
    width: width ?? 500,
    height: height ?? 350,
  });
  return (
    <Chart {...chartProps}>
      <Bullet {...bulletProps} />
    </Chart>
  );
};

// Common args for target value stories (showTargetValue: true, labelPosition: 'top')
const targetValueArgs = {
  metric: 'currentAmount',
  dimension: 'graphLabel',
  target: 'target',
  color: 'blue-900',
  direction: 'column' as const,
  showTarget: true,
  showTargetValue: true,
  labelPosition: 'top' as const,
  scaleType: 'normal' as const,
  thresholds: largeNumbersThresholdsData,
  thresholdBarColor: true,
  track: false,
  metricAxis: false,
};

// Common args for KMBT stories
const kmbtTargetValueArgs = {
  metric: 'currentAmount',
  dimension: 'graphLabel',
  target: 'target',
  color: 'blue-900',
  direction: 'column' as const,
  showTarget: true,
  showTargetValue: true,
  labelPosition: 'top' as const,
  scaleType: 'normal' as const,
  thresholds: kmbtThresholdsData,
  thresholdBarColor: true,
  track: false,
  metricAxis: false,
};

// Common args for metric axis stories (showTarget: false, metricAxis: true)
const metricAxisArgs = {
  metric: 'currentAmount',
  dimension: 'graphLabel',
  target: 'target',
  color: 'blue-900',
  direction: 'column' as const,
  showTarget: false, // No target line for axis stories
  showTargetValue: false,
  labelPosition: 'top' as const,
  scaleType: 'normal' as const,
  thresholds: largeNumbersThresholdsData,
  thresholdBarColor: true,
  track: false,
  metricAxis: true, // Shows bottom scale axis with formatted labels
};

// ============================================
// shortNumber: K/M/B/T (e.g., 5.5K, 12.5M, 3.25B, 1.75T)
// ============================================

const ShortNumberWithTarget = bindWithProps(KmbtStory);
ShortNumberWithTarget.args = {
  ...kmbtTargetValueArgs,
  numberFormat: 'shortNumber',
};

const ShortNumberWithAxis = bindWithProps(KmbtStory);
ShortNumberWithAxis.args = {
  ...kmbtTargetValueArgs,
  numberFormat: 'shortNumber',
  showTarget: false,
  showTargetValue: false,
  metricAxis: true,
};

// ============================================
// shortCurrency: $1.5M, $2.75B
// ============================================

const ShortCurrencyWithTarget = bindWithProps(LargeNumbersStory);
ShortCurrencyWithTarget.args = {
  ...targetValueArgs,
  numberFormat: 'shortCurrency',
};

const ShortCurrencyWithAxis = bindWithProps(LargeNumbersStory);
ShortCurrencyWithAxis.args = {
  ...metricAxisArgs,
  numberFormat: 'shortCurrency',
};

// ============================================
// currency: $1,500,000.00
// ============================================

const CurrencyWithTarget = bindWithProps(LargeNumbersStory);
CurrencyWithTarget.args = {
  ...targetValueArgs,
  numberFormat: 'currency',
};

const CurrencyWithAxis = bindWithProps(LargeNumbersStory);
CurrencyWithAxis.args = {
  ...metricAxisArgs,
  numberFormat: 'currency',
};

// ============================================
// standardNumber: 1,500,000
// ============================================

const StandardNumberWithTarget = bindWithProps(LargeNumbersStory);
StandardNumberWithTarget.args = {
  ...targetValueArgs,
  numberFormat: 'standardNumber',
};

const StandardNumberWithAxis = bindWithProps(LargeNumbersStory);
StandardNumberWithAxis.args = {
  ...metricAxisArgs,
  numberFormat: 'standardNumber',
};

// ============================================
// Custom d3 format: ,.1f (thousands separator, 1 decimal)
// ============================================

const CustomD3WithTarget = bindWithProps(BasicNumbersStory);
CustomD3WithTarget.args = {
  ...targetValueArgs,
  numberFormat: ',.1f',
  thresholds: undefined,
  thresholdBarColor: false,
  track: true,
  maxScaleValue: 500,
};

const CustomD3WithAxis = bindWithProps(BasicNumbersStory);
CustomD3WithAxis.args = {
  ...metricAxisArgs,
  numberFormat: ',.1f',
  thresholds: undefined,
  thresholdBarColor: false,
  track: true,
  maxScaleValue: 500,
};

// ============================================
// Custom d3 format: .0% (percentage)
// ============================================

const PercentageWithTarget = bindWithProps(BasicNumbersStory);
PercentageWithTarget.args = {
  ...targetValueArgs,
  numberFormat: '.0%',
  thresholds: undefined,
  thresholdBarColor: false,
  track: true,
  maxScaleValue: 500,
};

const PercentageWithAxis = bindWithProps(BasicNumbersStory);
PercentageWithAxis.args = {
  ...metricAxisArgs,
  numberFormat: '.0%',
  thresholds: undefined,
  thresholdBarColor: false,
  track: true,
  maxScaleValue: 500,
};

export {
  // shortNumber
  ShortNumberWithTarget,
  ShortNumberWithAxis,
  // shortCurrency
  ShortCurrencyWithTarget,
  ShortCurrencyWithAxis,
  // currency
  CurrencyWithTarget,
  CurrencyWithAxis,
  // standardNumber
  StandardNumberWithTarget,
  StandardNumberWithAxis,
  // Custom d3: ,.1f
  CustomD3WithTarget,
  CustomD3WithAxis,
  // Custom d3: .0%
  PercentageWithTarget,
  PercentageWithAxis,
};

