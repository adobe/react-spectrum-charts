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
import { Axis, AxisThumbnail, Bar, BarDirectLabel, Legend, Title } from '../../../components';
import useChartProps from '../../../hooks/useChartProps';
import { bindWithProps } from '../../../test-utils';
import { BarProps } from '../../../types';
import { divergingConversionRateDataLongLabelsWithDirection, divergingConversionRateDataWithDirection } from './data';

export default {
  title: 'React Spectrum Charts 2/Bar/Features/Diverging',
  component: Bar,
  parameters: {
    controls: {
      include: ['orientation'],
    },
  },
};

const thumbnails = ['/chrome.png', '/firefox.png', '/safari.png', '/edge.png', '/explorer.png'];

const divergingConversionRateDataWithThumbnails = divergingConversionRateDataLongLabelsWithDirection.map((datum, index) => ({
  ...datum,
  thumbnail: thumbnails[index % thumbnails.length],
}));

const DivergingStory: StoryFn<typeof Bar> = (args): ReactElement => {
  const isHorizontal = args.orientation === 'horizontal';
  const chartProps = useChartProps({ data: divergingConversionRateDataWithDirection, width: 700, height: 400 });
  return (
    <Chart {...chartProps}>
      <Title text="Campaign conversion change by channel" fontSize={16} />
      <Axis position={isHorizontal ? 'left' : 'bottom'} baseline title="Channel" />
      <Axis position={isHorizontal ? 'bottom' : 'left'} grid labelFormat="percentage" title="Conversion rate change" />
      <Bar {...args} diverging>
        <BarDirectLabel position={isHorizontal ? 'start' : 'end-outside'} format="percentage" />
      </Bar>
      <Legend title="Change direction" />
    </Chart>
  );
};

const ThumbnailStory: StoryFn<typeof Bar> = (args): ReactElement => {
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

const defaultProps: BarProps = {
  dimension: 'channel',
  metric: 'changeRate',
  orientation: 'horizontal',
  color: 'changeDirection',
};

const Basic = bindWithProps(DivergingStory);
Basic.args = {
  ...defaultProps,
};

const WithThumbnails = bindWithProps(ThumbnailStory);
WithThumbnails.args = {
  ...defaultProps,
};

export { Basic, WithThumbnails };
