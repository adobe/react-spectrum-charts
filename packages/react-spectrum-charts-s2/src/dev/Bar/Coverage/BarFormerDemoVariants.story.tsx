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
import { Axis, AxisThumbnail, Bar, BarDirectLabel, ChartInspect, Legend, Title } from '../../../components';
import useChartProps from '../../../hooks/useChartProps';
import {
  barDataWithSeries,
  divergingConversionRateDataLongLabelsWithDirection,
  mixedAcquisitionData,
  negativeBarSeriesData,
} from '../../../storyShared/components/Bar/data';
import { bindWithProps } from '../../../test-utils';
import { BarDirectLabelProps, BarProps } from '../../../types';

export default {
  title: 'React Spectrum Charts 2/Bar/Coverage/Former Demo Variants',
  component: Bar,
};

const AxisLabelHighlightStory: StoryFn<typeof Bar> = (args): ReactElement => {
  const chartProps = useChartProps({ data: barDataWithSeries, width: 640, height: 420 });
  return (
    <Chart {...chartProps}>
      <Axis position={args.orientation === 'horizontal' ? 'left' : 'bottom'} baseline title="Browser" />
      <Axis position={args.orientation === 'horizontal' ? 'bottom' : 'left'} grid title="Downloads" />
      <Bar {...args}>
        <ChartInspect>
          {(datum) => (
            <div>
              {datum.browser}: {datum.downloads}
            </div>
          )}
        </ChartInspect>
      </Bar>
      <Legend title="Metric" />
    </Chart>
  );
};

const HorizontalDirectLabelStory: StoryFn<BarDirectLabelProps> = (args): ReactElement => {
  const chartProps = useChartProps({ data: mixedAcquisitionData, width: 640, height: 420 });
  return (
    <Chart {...chartProps}>
      <Axis position="left" baseline title="Acquisition channel" />
      <Axis position="bottom" grid title="Sign-ups" />
      <Bar dimension="channel" metric="signups" color="series" orientation="horizontal">
        <BarDirectLabel {...args} />
      </Bar>
      <Legend title="Metric" />
    </Chart>
  );
};

const thumbnails = ['/chrome.png', '/firefox.png', '/safari.png', '/edge.png', '/explorer.png'];

const divergingConversionRateDataWithThumbnails = divergingConversionRateDataLongLabelsWithDirection.map(
  (datum, index) => ({
    ...datum,
    thumbnail: thumbnails[index % thumbnails.length],
  })
);

const DivergingThumbnailStory: StoryFn<typeof Bar> = (args): ReactElement => {
  const isHorizontal = args.orientation === 'horizontal';
  const chartProps = useChartProps({ data: divergingConversionRateDataWithThumbnails, width: 760, height: 440 });
  return (
    <Chart {...chartProps}>
      <Title text="Campaign conversion change with long labels and thumbnails" fontSize={16} />
      <Axis position={isHorizontal ? 'left' : 'bottom'} baseline title="Channel">
        <AxisThumbnail urlKey="thumbnail" />
      </Axis>
      <Axis position={isHorizontal ? 'bottom' : 'left'} grid labelFormat="percentage" title="Conversion rate change" />
      <Bar {...args} diverging />
      <Legend title="Change direction" />
    </Chart>
  );
};

const NegativeStackStory: StoryFn<typeof Bar> = (args): ReactElement => {
  const chartProps = useChartProps({ data: negativeBarSeriesData, width: 720, height: 460 });
  return (
    <Chart {...chartProps}>
      <Axis position={args.orientation === 'horizontal' ? 'left' : 'bottom'} baseline title="Browser" />
      <Axis position={args.orientation === 'horizontal' ? 'bottom' : 'left'} grid title="Downloads" />
      <Bar {...args} />
      <Legend title="Operating system" />
    </Chart>
  );
};

// Hovering an axis label highlights the matching bar, same as hovering the bar itself.
export const AxisLabelHighlight = bindWithProps(AxisLabelHighlightStory);
AxisLabelHighlight.args = { dimension: 'browser', metric: 'downloads', color: 'series' } as BarProps;

export const DirectLabelHorizontal = bindWithProps(HorizontalDirectLabelStory);
DirectLabelHorizontal.args = { position: 'end-outside' } as BarDirectLabelProps;

export const DivergingWithThumbnails = bindWithProps(DivergingThumbnailStory);
DivergingWithThumbnails.args = {
  dimension: 'channel',
  metric: 'changeRate',
  orientation: 'horizontal',
  color: 'changeDirection',
} as BarProps;

export const NegativeStack = bindWithProps(NegativeStackStory);
NegativeStack.args = { dimension: 'browser', order: 'order', color: 'operatingSystem' } as BarProps;
