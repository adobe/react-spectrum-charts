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

import { categorical12 } from '@spectrum-charts/themes';

import { Chart } from '../../../Chart';
import { Axis, ChartTooltip, Legend, Scatter, ScatterPath, Trendline, TrendlineAnnotation } from '../../../components';
import useChartProps from '../../../hooks/useChartProps';
import { bindWithProps } from '../../../test-utils';
import { TrendlineProps } from '../../../types';
import {
  basicFeatureMatrixData,
  multipleSegmentFeatureMatrixData,
  timeCompareFeatureMatrixData,
  topEventsFeatureMatrixData,
} from './data';

export default {
  title: 'RSC/Chart/Examples',
  component: Chart,
};

const trendlineProps: TrendlineProps = {
  method: 'median',
  lineWidth: 'XS',
  lineType: 'solid',
  dimensionExtent: ['domain', 'domain'],
};

const FeatureMatrixStory: StoryFn<typeof Chart> = (args): ReactElement => {
  const chartProps = useChartProps(args);

  return (
    <Chart {...chartProps}>
      <Axis position="bottom" ticks grid title="Percentage of daily users (DAU)" labelFormat="percentage" />
      <Axis position="left" ticks grid title="Average number of times per day" />
      <Scatter dimension="dauPercent" metric="countAvg" color="segment">
        <Trendline {...trendlineProps} color="gray-900" orientation="horizontal">
          <TrendlineAnnotation prefix="Median times" numberFormat=".3" />
        </Trendline>
        <Trendline {...trendlineProps} color="gray-900" orientation="vertical">
          <TrendlineAnnotation prefix="Median %DAU" numberFormat=".2%" />
        </Trendline>
      </Scatter>
      <Legend position="bottom" highlight />
    </Chart>
  );
};

const MultipleSegmentFeatureMatrixStory: StoryFn<typeof Chart> = (args): ReactElement => {
  const chartProps = useChartProps(args);

  return (
    <Chart {...chartProps}>
      <Axis position="bottom" grid title="Percentage of daily users (DAU)" labelFormat="percentage" />
      <Axis position="left" grid title="Average number of times per day" />
      <Scatter dimension="dauPercent" metric="countAvg" color="segment">
        <Trendline {...trendlineProps} displayOnHover orientation="horizontal">
          <TrendlineAnnotation prefix="Median times" numberFormat=".3" />
        </Trendline>
        <Trendline {...trendlineProps} displayOnHover orientation="vertical">
          <TrendlineAnnotation prefix="Median %DAU" numberFormat=".2%" />
        </Trendline>
      </Scatter>
      <Legend position="bottom" highlight />
    </Chart>
  );
};

const TimeCompareFeatureMatrixStory: StoryFn<typeof Chart> = (args): ReactElement => {
  const chartProps = useChartProps(args);

  return (
    <Chart {...chartProps}>
      <Axis position="bottom" grid title="Percentage of daily users (DAU)" labelFormat="percentage" />
      <Axis position="left" grid title="Average number of times per day" />
      <Scatter
        dimension="dauPercent"
        metric="countAvg"
        color="segment"
        lineType="period"
        opacity="period"
        lineWidth={{ value: 1 }}
      >
        <ChartTooltip highlightBy={['event', 'segment']} />
        <Trendline {...trendlineProps} displayOnHover orientation="horizontal">
          <TrendlineAnnotation prefix="Median times" numberFormat=".3" />
        </Trendline>
        <Trendline {...trendlineProps} displayOnHover orientation="vertical">
          <TrendlineAnnotation prefix="Median %DAU" numberFormat=".2%" />
        </Trendline>
        <ScatterPath groupBy={['event', 'segment']} pathWidth="pathWidth" opacity={0.2} />
      </Scatter>
      <Legend position="bottom" highlight />
    </Chart>
  );
};

const EventOverlayFeatureMatrixStory: StoryFn<typeof Chart> = (args): ReactElement => {
  const chartProps = useChartProps(args);

  return (
    <Chart {...chartProps}>
      <Axis position="bottom" grid title="Percentage of daily users (DAU)" labelFormat="percentage" />
      <Axis position="left" grid title="Average number of times per day" />
      <Scatter dimension="dauPercent" metric="countAvg" color="segment" opacity="segment">
        <ChartTooltip excludeDataKeys={['isTopItem']} />
        <Trendline {...trendlineProps} excludeDataKeys={['isTopItem']} displayOnHover orientation="horizontal">
          <TrendlineAnnotation prefix="Median times" numberFormat=".3" />
        </Trendline>
        <Trendline {...trendlineProps} excludeDataKeys={['isTopItem']} displayOnHover orientation="vertical">
          <TrendlineAnnotation prefix="Median %DAU" numberFormat=".2%" dimensionValue="start" />
        </Trendline>
        <Trendline
          {...trendlineProps}
          excludeDataKeys={['isSegmentData']}
          orientation="horizontal"
          color="gray-700"
          opacity={0.7}
        >
          <TrendlineAnnotation prefix="Top events median times" numberFormat=".3" />
        </Trendline>
        <Trendline
          {...trendlineProps}
          excludeDataKeys={['isSegmentData']}
          orientation="vertical"
          color="gray-700"
          opacity={0.7}
        >
          <TrendlineAnnotation prefix="Top events median %DAU" numberFormat=".2%" />
        </Trendline>
      </Scatter>
      <Legend position="bottom" highlight hiddenEntries={['top-events-overlay']} />
    </Chart>
  );
};

const FeatureMatrix = bindWithProps(FeatureMatrixStory);
FeatureMatrix.args = {
  width: 'auto',
  maxWidth: 850,
  height: 500,
  data: basicFeatureMatrixData,
};

const MultipleSegmentFeatureMatrix = bindWithProps(MultipleSegmentFeatureMatrixStory);
MultipleSegmentFeatureMatrix.args = {
  width: 'auto',
  maxWidth: 850,
  height: 500,
  data: multipleSegmentFeatureMatrixData,
};

const TimeCompareFeatureMatrix = bindWithProps(TimeCompareFeatureMatrixStory);
TimeCompareFeatureMatrix.args = {
  width: 'auto',
  maxWidth: 850,
  height: 500,
  lineTypes: ['dotted', 'solid'],
  opacities: [0.5, 1],
  symbolSizes: [1, 'M'],
  data: timeCompareFeatureMatrixData,
};

const EventOverlayFeatureMatrix = bindWithProps(EventOverlayFeatureMatrixStory);
EventOverlayFeatureMatrix.args = {
  width: 'auto',
  maxWidth: 850,
  height: 500,
  colors: ['gray-400', ...categorical12],
  opacities: [0.5, 1, 1, 1],
  data: topEventsFeatureMatrixData,
};

export { FeatureMatrix, MultipleSegmentFeatureMatrix, TimeCompareFeatureMatrix, EventOverlayFeatureMatrix };
