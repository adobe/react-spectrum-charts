/*
 * Copyright 2024 Adobe. All rights reserved.
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

import User from '@spectrum-icons/workflow/User';

import { Chart } from '../../../Chart';
import { Line } from '../../../components';
import useChartProps from '../../../hooks/useChartProps';
import { BigNumber } from '../../../rc';
import { bindWithProps } from '../../../test-utils/bindWithProps';
import { simpleSparklineData as data } from '../../data/data';

export default {
  title: 'RSC/BigNumber',
  component: BigNumber,
};

const BigNumberSmallStory: StoryFn<typeof BigNumber> = (args): ReactElement => {
  const chartProps = useChartProps({
    data: data,
    width: 200,
    height: 200,
  });
  return (
    <Chart {...chartProps}>
      <BigNumber {...args} />
    </Chart>
  );
};

const BigNumberMediumStory: StoryFn<typeof BigNumber> = (args): ReactElement => {
  const chartProps = useChartProps({
    data: data,
    width: 350,
    height: 350,
  });
  return (
    <Chart {...chartProps}>
      <BigNumber {...args} />
    </Chart>
  );
};

const BigNumberLargeStory: StoryFn<typeof BigNumber> = (args): ReactElement => {
  const chartProps = useChartProps({
    data: data,
    width: 500,
    height: 500,
  });
  return (
    <Chart {...chartProps}>
      <BigNumber {...args} />
    </Chart>
  );
};

const UndefinedDataStory: StoryFn<typeof BigNumber> = (args): ReactElement => {
  const chartProps = useChartProps({
    data: [],
    width: 200,
    height: 100,
  });
  return (
    <Chart {...chartProps}>
      <BigNumber {...args} />
    </Chart>
  );
};

const CurrencyFormatStory: StoryFn<typeof BigNumber> = (args): ReactElement => {
  const chartProps = useChartProps({
    data: [{ value: 255.56 }],
    width: 200,
    height: 100,
    locale: 'de-DE',
  });
  return (
    <Chart {...chartProps}>
      <BigNumber {...args} />
    </Chart>
  );
};

const PercentageFormatStory: StoryFn<typeof BigNumber> = (args): ReactElement => {
  const chartProps = useChartProps({
    data: [{ value: 0.25 }],
    width: 200,
    height: 100,
  });
  return (
    <Chart {...chartProps}>
      <BigNumber {...args} />
    </Chart>
  );
};

const CompactFormatStory: StoryFn<typeof BigNumber> = (args): ReactElement => {
  const chartProps = useChartProps({
    data: [{ value: 12300000 }],
    width: 100,
    height: 200,
  });
  return (
    <Chart {...chartProps}>
      <BigNumber {...args} />
    </Chart>
  );
};

const BasicHorizontal = bindWithProps(BigNumberLargeStory);
BasicHorizontal.args = {
  children: undefined,
  dataKey: 'x',
  orientation: 'horizontal',
  label: 'Visitors',
};

const BasicVertical = bindWithProps(BigNumberLargeStory);
BasicVertical.args = {
  children: undefined,
  dataKey: 'x',
  orientation: 'vertical',
  label: 'Visitors',
};

const IconHorizontal = bindWithProps(BigNumberLargeStory);
IconHorizontal.args = {
  dataKey: 'x',
  icon: <User data-testid="icon-user" />,
  children: undefined,
  orientation: 'horizontal',
  label: 'Visitors',
};

const IconVertical = bindWithProps(BigNumberLargeStory);
IconVertical.args = {
  dataKey: 'x',
  icon: <User data-testid="icon-user" />,
  children: undefined,
  orientation: 'vertical',
  label: 'Visitors',
};

const SparklineHorizontal = bindWithProps(BigNumberLargeStory);
SparklineHorizontal.args = {
  dataKey: 'x',
  children: <Line dimension="x" metric="y" scaleType="linear" />,
  orientation: 'horizontal',
  label: 'Visitors',
};

const SparklineVertical = bindWithProps(BigNumberLargeStory);
SparklineVertical.args = {
  dataKey: 'x',
  children: <Line dimension="x" metric="y" scaleType="linear" />,
  orientation: 'vertical',
  label: 'Visitors',
};

const SparklineAndIconHorizontal = bindWithProps(BigNumberLargeStory);
SparklineAndIconHorizontal.args = {
  dataKey: 'x',
  children: <Line key="line" dimension="x" metric="y" scaleType="linear" />,
  icon: <User key="icon" data-testid="icon-user" />,
  orientation: 'horizontal',
  label: 'Visitors',
};

const SparklineAndIconVertical = bindWithProps(BigNumberLargeStory);
SparklineAndIconVertical.args = {
  dataKey: 'x',
  children: <Line key="line" dimension="x" metric="y" scaleType="linear" />,
  icon: <User key="icon" data-testid="icon-user" />,
  orientation: 'vertical',
  label: 'Visitors',
};

const SparklineMethodLast = bindWithProps(BigNumberLargeStory);
SparklineMethodLast.args = {
  dataKey: 'y',
  children: [<Line key="line" dimension="x" metric="y" scaleType="linear" />],
  orientation: 'vertical',
  label: 'Visitors',
};

const SparklineMethodSum = bindWithProps(BigNumberLargeStory);
SparklineMethodSum.args = {
  dataKey: 'y',
  children: [<Line key="line" dimension="x" metric="y" scaleType="linear" />],
  orientation: 'vertical',
  label: 'Visitors',
  method: 'sum',
};

const SparklineMethodAverage = bindWithProps(BigNumberLargeStory);
SparklineMethodAverage.args = {
  dataKey: 'y',
  children: [<Line key="line" dimension="x" metric="y" scaleType="linear" />],
  orientation: 'vertical',
  label: 'Visitors',
  method: 'avg',
};

const CurrencyFormat = bindWithProps(CurrencyFormatStory);
CurrencyFormat.args = {
  children: undefined,
  dataKey: 'value',
  orientation: 'horizontal',
  label: 'Ad Spend',
  numberFormat: '$,.2f',
};

const PercentageFormat = bindWithProps(PercentageFormatStory);
PercentageFormat.args = {
  children: undefined,
  dataKey: 'value',
  orientation: 'horizontal',
  label: 'Capacity',
  numberType: 'percentage',
};

const CompactFormat = bindWithProps(CompactFormatStory);
CompactFormat.args = {
  children: undefined,
  dataKey: 'value',
  orientation: 'horizontal',
  label: 'Requests',
  numberFormat: '.3s',
};

const UndefinedData = bindWithProps(UndefinedDataStory);
UndefinedData.args = {
  children: undefined,
  orientation: 'horizontal',
  dataKey: 'test',
  label: 'Visitors',
};

const SparklineAndIconHorizontalSmall = bindWithProps(BigNumberSmallStory);
SparklineAndIconHorizontalSmall.args = {
  dataKey: 'x',
  children: <Line key="line" dimension="x" metric="y" scaleType="linear" />,
  icon: <User key="icon" data-testid="icon-user" />,
  orientation: 'horizontal',
  label: 'Visitors',
};

const SparklineAndIconHorizontalMedium = bindWithProps(BigNumberMediumStory);
SparklineAndIconHorizontalMedium.args = {
  dataKey: 'x',
  children: <Line key="line" dimension="x" metric="y" scaleType="linear" />,
  icon: <User key="icon" data-testid="icon-user" />,
  orientation: 'horizontal',
  label: 'Visitors',
};

export {
  BasicHorizontal,
  BasicVertical,
  IconHorizontal,
  IconVertical,
  SparklineHorizontal,
  SparklineVertical,
  SparklineAndIconHorizontal,
  SparklineAndIconVertical,
  SparklineMethodLast,
  SparklineMethodSum,
  SparklineMethodAverage,
  CurrencyFormat,
  CompactFormat,
  PercentageFormat,
  UndefinedData,
  SparklineAndIconHorizontalSmall,
  SparklineAndIconHorizontalMedium,
};
