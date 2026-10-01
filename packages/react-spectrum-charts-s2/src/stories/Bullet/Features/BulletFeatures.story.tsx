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

import { Datum } from '@spectrum-charts/vega-spec-builder-s2';

import { Chart } from '../../../Chart';
import { ChartInspect } from '../../../components';
import useChartProps from '../../../hooks/useChartProps';
import { Bullet } from '../../../pre-alpha';
import {
  customLabelBulletData,
  quarterlyKpiData,
  quarterlyKpiThresholdsData,
  regionalRevenueData,
} from '../../../storyShared/data/bulletData';
import { bindWithProps } from '../../../test-utils';
import { BulletProps, ChartProps } from '../../../types';

export default {
  title: 'React Spectrum Charts 2/Pre-Alpha/Bullet/Features',
  component: Bullet,
};

const defaultChartProps: ChartProps = { data: quarterlyKpiData, width: 560, height: 240 };
const defaultArgs: BulletProps = { metric: 'current', dimension: 'kpi', target: 'target' };

const BulletStory: StoryFn<BulletProps> = (args): ReactElement => {
  const rowDimensions = args.direction === 'row' ? { width: 760, height: 160 } : {};
  const chartProps = useChartProps({ ...defaultChartProps, ...rowDimensions });
  return (
    <Chart {...chartProps}>
      <Bullet {...args} />
    </Chart>
  );
};

const CustomLabelStory: StoryFn<BulletProps> = (args): ReactElement => {
  const chartProps = useChartProps({ ...defaultChartProps, data: customLabelBulletData });
  return (
    <Chart {...chartProps}>
      <Bullet {...args} />
    </Chart>
  );
};

const RevenueStory: StoryFn<BulletProps> = (args): ReactElement => {
  const chartProps = useChartProps({ ...defaultChartProps, data: regionalRevenueData });
  return (
    <Chart {...chartProps}>
      <Bullet {...args} />
    </Chart>
  );
};

const kpiInspectContent = (datum: Datum) => (
  <div>
    <div>{datum.kpi as string}</div>
    <div>Current: {(datum.current as number).toLocaleString()}</div>
    <div>Target: {(datum.target as number).toLocaleString()}</div>
  </div>
);

const Basic = bindWithProps(BulletStory);
Basic.args = { ...defaultArgs };
Object.assign(Basic, { parameters: { controls: { include: [] } } });

const Color = bindWithProps(BulletStory);
Color.args = { ...defaultArgs, color: 'purple-900' };
Object.assign(Color, { parameters: { controls: { include: ['color'] } } });

const Direction = bindWithProps(BulletStory);
Direction.args = { ...defaultArgs, direction: 'row' };
Object.assign(Direction, { parameters: { controls: { include: ['direction'] } } });

const LabelPosition = bindWithProps(BulletStory);
LabelPosition.args = { ...defaultArgs, labelPosition: 'side' };
Object.assign(LabelPosition, { parameters: { controls: { include: ['labelPosition'] } } });

// maxScaleValue only applies when scaleType is fixed or flexible
const MaxScaleValue = bindWithProps(BulletStory);
MaxScaleValue.args = { ...defaultArgs, scaleType: 'fixed', maxScaleValue: 2000 };
Object.assign(MaxScaleValue, { parameters: { controls: { include: ['maxScaleValue'] } } });

const MetricAxis = bindWithProps(BulletStory);
MetricAxis.args = { ...defaultArgs, metricAxis: true };
Object.assign(MetricAxis, { parameters: { controls: { include: ['metricAxis'] } } });

const MetricLabel = bindWithProps(CustomLabelStory);
MetricLabel.args = {
  metric: 'currentAmount',
  dimension: 'graphLabel',
  target: 'target',
  metricLabel: 'currentAmountLabel',
};
Object.assign(MetricLabel, { parameters: { controls: { include: ['metricLabel'] } } });

const NumberFormat = bindWithProps(RevenueStory);
NumberFormat.args = { metric: 'revenue', dimension: 'region', target: 'target', numberFormat: 'shortCurrency' };
Object.assign(NumberFormat, { parameters: { controls: { include: ['numberFormat'] } } });
Object.assign(NumberFormat, {
  argTypes: {
    numberFormat: { control: 'select', options: ['shortNumber', 'shortCurrency', 'currency', ',.1f', '.0%'] },
  },
});

// flexible uses maxScaleValue as the scale max until the data exceeds it
const ScaleType = bindWithProps(BulletStory);
ScaleType.args = { ...defaultArgs, scaleType: 'flexible', maxScaleValue: 2000 };
Object.assign(ScaleType, { parameters: { controls: { include: ['scaleType'] } } });

const ShowTarget = bindWithProps(BulletStory);
ShowTarget.args = { ...defaultArgs, showTarget: false };
Object.assign(ShowTarget, { parameters: { controls: { include: ['showTarget'] } } });

const ShowTargetValue = bindWithProps(BulletStory);
ShowTargetValue.args = { ...defaultArgs, showTargetValue: true };
Object.assign(ShowTargetValue, { parameters: { controls: { include: ['showTargetValue'] } } });

// targetLabel is only rendered when showTargetValue is on
const TargetLabel = bindWithProps(CustomLabelStory);
TargetLabel.args = {
  metric: 'currentAmount',
  dimension: 'graphLabel',
  target: 'target',
  targetLabel: 'targetLabel',
  showTargetValue: true,
};
Object.assign(TargetLabel, { parameters: { controls: { include: ['targetLabel'] } } });

const ThresholdBarColor = bindWithProps(BulletStory);
ThresholdBarColor.args = { ...defaultArgs, thresholds: quarterlyKpiThresholdsData, thresholdBarColor: true };
Object.assign(ThresholdBarColor, { parameters: { controls: { include: ['thresholdBarColor'] } } });

const Thresholds = bindWithProps(BulletStory);
Thresholds.args = { ...defaultArgs, thresholds: quarterlyKpiThresholdsData };
Object.assign(Thresholds, { parameters: { controls: { include: ['thresholds'] } } });

const Track = bindWithProps(BulletStory);
Track.args = { ...defaultArgs, track: true };
Object.assign(Track, { parameters: { controls: { include: ['track'] } } });

const ChartInspectStory = bindWithProps(BulletStory);
ChartInspectStory.args = { ...defaultArgs, children: <ChartInspect>{kpiInspectContent}</ChartInspect> };
Object.assign(ChartInspectStory, { parameters: { controls: { include: [] } } });

export {
  Basic,
  Color,
  Direction,
  LabelPosition,
  MaxScaleValue,
  MetricAxis,
  MetricLabel,
  NumberFormat,
  ScaleType,
  ShowTarget,
  ShowTargetValue,
  TargetLabel,
  ThresholdBarColor,
  Thresholds,
  Track,
  ChartInspectStory as ChartInspect,
};
