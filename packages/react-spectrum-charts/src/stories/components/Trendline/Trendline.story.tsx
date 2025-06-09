/*
 * Copyright 2023 Adobe. All rights reserved.
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

import { TRENDLINE_VALUE } from '@spectrum-charts/constants';
import { Datum } from '@spectrum-charts/vega-spec-builder';

import { Chart } from '../../../Chart';
import { Axis, Bar, ChartPopover, ChartTooltip, Legend, Line, Scatter, Title, Trendline } from '../../../components';
import useChartProps from '../../../hooks/useChartProps';
import { workspaceTrendsData } from '../../../stories/data/data';
import { characterData } from '../../../stories/data/marioKartData';
import { bindWithProps } from '../../../test-utils/bindWithProps';
import { ChartProps } from '../../../types';
import { barSeriesData } from '../Bar/data';

export default {
  title: 'RSC/Trendline',
  component: Trendline,
  argTypes: {
    lineType: {
      control: 'select',
      options: ['solid', 'dashed', 'dotted', 'dotDash', 'shortDash', 'longDash', 'twoDash'],
    },
    lineWidth: {
      control: 'inline-radio',
      options: ['XS', 'S', 'M', 'L', 'XL'],
    },
    method: {
      control: 'select',
      options: [
        'average',
        'exponential',
        'linear',
        'logarithmic',
        'median',
        'movingAverage-2',
        'movingAverage-3',
        'movingAverage-4',
        'movingAverage-5',
        'movingAverage-6',
        'movingAverage-7',
        'polynomial-1',
        'polynomial-2',
        'polynomial-3',
        'polynomial-4',
        'polynomial-5',
        'polynomial-6',
        'power',
        'quadratic',
      ],
    },
  },
};

const defaultChartProps: ChartProps = { data: workspaceTrendsData, minWidth: 400, maxWidth: 800, height: 400 };

const TrendlineStory: StoryFn<typeof Trendline> = (args): ReactElement => {
  const chartProps = useChartProps(defaultChartProps);
  return (
    <Chart {...chartProps}>
      <Axis position="left" grid title="Users" />
      <Axis position="bottom" labelFormat="time" baseline ticks />
      <Line color="series">
        <Trendline {...args} />
      </Line>
      <Legend lineWidth={{ value: 0 }} highlight />
    </Chart>
  );
};

const TrendlineWithDialogsStory: StoryFn<typeof Trendline> = (args): ReactElement => {
  const chartProps = useChartProps(defaultChartProps);
  return (
    <Chart {...chartProps}>
      <Axis position="left" grid title="Users" />
      <Axis position="bottom" labelFormat="time" baseline ticks />
      <Line color="series">
        <Trendline {...args}>
          <ChartTooltip>
            {(item: Datum) => (
              <>
                <div>Trendline value: {item[TRENDLINE_VALUE]}</div>
                <div>Line value: {item.value}</div>
              </>
            )}
          </ChartTooltip>
          <ChartPopover>
            {(item) => (
              <>
                <div>Trendline value: {item[TRENDLINE_VALUE]}</div>
                <div>Line value: {item.value}</div>
              </>
            )}
          </ChartPopover>
        </Trendline>
      </Line>
      <Legend lineWidth={{ value: 0 }} highlight />
    </Chart>
  );
};

const TrendlineWithDialogsOnParentStory: StoryFn<typeof Trendline> = (args): ReactElement => {
  const chartProps = useChartProps(defaultChartProps);
  return (
    <Chart {...chartProps}>
      <Axis position="left" grid title="Users" />
      <Axis position="bottom" labelFormat="time" baseline ticks />
      <Line color="series">
        <ChartTooltip>
          {(item) => (
            <>
              <div>Trendline value: {item[TRENDLINE_VALUE]}</div>
              <div>Line value: {item.value}</div>
            </>
          )}
        </ChartTooltip>
        <ChartPopover>
          {(item) => (
            <>
              <div>Trendline value: {item[TRENDLINE_VALUE]}</div>
              <div>Line value: {item.value}</div>
            </>
          )}
        </ChartPopover>
        <Trendline {...args} />
      </Line>
      <Legend lineWidth={{ value: 0 }} highlight />
    </Chart>
  );
};

const ScatterStory: StoryFn<typeof Trendline> = (args): ReactElement => {
  const chartProps = useChartProps({ data: characterData, height: 500, width: 500, lineWidths: [1, 2, 3] });

  return (
    <Chart {...chartProps}>
      <Axis position="bottom" grid ticks baseline title="Speed (normal)" />
      <Axis position="left" grid ticks baseline title="Handling (normal)" />
      <Scatter color="weightClass" dimension="speedNormal" metric="handlingNormal">
        <Trendline {...args} />
      </Scatter>
      <Legend title="Weight class" highlight position="right" />
      <Title text="Mario Kart 8 Character Data" />
    </Chart>
  );
};

const BarStory: StoryFn<typeof Trendline> = (args): ReactElement => {
  const chartProps = useChartProps({ data: barSeriesData, height: 500, width: 500 });

  return (
    <Chart {...chartProps}>
      <Axis position="bottom" baseline title="Browser" />
      <Axis position="left" grid ticks title="Downloads" />
      <Bar dimension="browser" metric="value" color="operatingSystem" type="dodged">
        <Trendline {...args} />
      </Bar>
      <Legend title="Operating System" highlight position="right" />
    </Chart>
  );
};

const excludeSeriesData = [
  { datetime: 1667890800000, point: 1, value: 3738, users: 477, series: 'Add Fallout', excludeFromTrendline: true },
  { datetime: 1667977200000, point: 2, value: 2704, users: 481, series: 'Add Fallout', excludeFromTrendline: true },
  { datetime: 1668063600000, point: 3, value: 1730, users: 483, series: 'Add Fallout', excludeFromTrendline: true },
  { datetime: 1668150000000, point: 4, value: 465, users: 310, series: 'Add Fallout', excludeFromTrendline: true },
  { datetime: 1668236400000, point: 5, value: 31, users: 18, series: 'Add Fallout', excludeFromTrendline: true },
  { datetime: 1668322800000, point: 8, value: 108, users: 70, series: 'Add Fallout', excludeFromTrendline: true },
  { datetime: 1668409200000, point: 12, value: 648, users: 438, series: 'Add Fallout', excludeFromTrendline: true },
  { datetime: 1667890800000, point: 4, value: 12208, users: 5253, series: 'Add Freeform table' },
  { datetime: 1667977200000, point: 5, value: 11309, users: 5103, series: 'Add Freeform table' },
  { datetime: 1668063600000, point: 17, value: 11099, users: 5047, series: 'Add Freeform table' },
  { datetime: 1668150000000, point: 20, value: 7243, users: 3386, series: 'Add Freeform table' },
  { datetime: 1668236400000, point: 21, value: 395, users: 205, series: 'Add Freeform table' },
  { datetime: 1668322800000, point: 22, value: 1606, users: 790, series: 'Add Freeform table' },
  { datetime: 1668409200000, point: 25, value: 10932, users: 4913, series: 'Add Freeform table' },
];

const ExcludeSeriesTrendlineStory: StoryFn<typeof Trendline> = (args): ReactElement => {
  const chartProps = useChartProps({
    ...defaultChartProps,
    data: excludeSeriesData,
    colors: ['gray-300', 'seafoam-500'],
  });
  return (
    <Chart {...chartProps}>
      <Axis position="left" grid title="Users" />
      <Axis position="bottom" labelFormat="time" baseline ticks />
      <Line color="series">
        <Trendline {...args} />
      </Line>
      <Legend lineWidth={{ value: 0 }} highlight />
    </Chart>
  );
};

const Basic = bindWithProps(TrendlineStory);
Basic.args = {
  method: 'linear',
  lineType: 'dashed',
  lineWidth: 'S',
};

const DimensionExtent = bindWithProps(TrendlineWithDialogsStory);
DimensionExtent.args = {
  method: 'linear',
  lineType: 'dashed',
  lineWidth: 'S',
  highlightRawPoint: true,
  dimensionExtent: ['domain', 'domain'],
};

const DimensionRange = bindWithProps(TrendlineWithDialogsStory);
DimensionRange.args = {
  method: 'linear',
  lineType: 'dashed',
  lineWidth: 'S',
  highlightRawPoint: true,
  dimensionRange: [1668063600000, null],
};

const DisplayOnHover = bindWithProps(TrendlineStory);
DisplayOnHover.args = {
  displayOnHover: true,
  method: 'linear',
  lineType: 'solid',
  lineWidth: 'S',
  color: 'gray-600',
};

const Orientation = bindWithProps(ScatterStory);
Orientation.args = {
  orientation: 'vertical',
  method: 'average',
  lineType: 'solid',
  lineWidth: 'XS',
  dimensionExtent: ['domain', 'domain'],
};

const TooltipAndPopover = bindWithProps(TrendlineWithDialogsStory);
TooltipAndPopover.args = {
  highlightRawPoint: true,
};

const TooltipAndPopoverOnParentLine = bindWithProps(TrendlineWithDialogsOnParentStory);
TooltipAndPopoverOnParentLine.args = {
  method: 'linear',
  lineType: 'dashed',
  lineWidth: 'S',
};

const BarChart = bindWithProps(BarStory);
BarChart.args = {
  method: 'average',
  lineType: 'dashed',
  dimensionExtent: ['domain', 'domain'],
};

const ExcludeSeriesFromTrendline = bindWithProps(ExcludeSeriesTrendlineStory);
ExcludeSeriesFromTrendline.args = {
  method: 'linear',
  lineType: 'dashed',
  lineWidth: 'S',
  excludeDataKeys: ['excludeFromTrendline'],
};

export {
  BarChart,
  Basic,
  DimensionExtent,
  DimensionRange,
  DisplayOnHover,
  ExcludeSeriesFromTrendline,
  Orientation,
  TooltipAndPopover,
  TooltipAndPopoverOnParentLine,
};
