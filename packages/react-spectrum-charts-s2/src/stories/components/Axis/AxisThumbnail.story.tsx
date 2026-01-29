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

import { Content, View } from '@adobe/react-spectrum';
import { Datum } from '@spectrum-charts/vega-spec-builder-s2';

import { Chart } from '../../../Chart';
import { Axis, AxisThumbnail, Bar, ChartPopover, ChartTooltip } from '../../../components';
import useChartProps from '../../../hooks/useChartProps';
import { bindWithProps } from '../../../test-utils';
import { AxisThumbnailProps } from '../../../types';
import { barData } from '../Bar/data';
import { browserData as chartPopoverData } from '../../data/data';

export default {
  title: 'RSC/Axis/AxisThumbnail',
  component: AxisThumbnail,
  parameters: {
    controls: {
      exclude: ['orientation', 'width'],
    },
  },
};

const thumbnails = ['/chrome.png', '/firefox.png', '/safari.png', '/edge.png', '/explorer.png'];

const data = barData.map((datum, index) => ({
  ...datum,
  thumbnail: thumbnails[index],
}));

type StoryArgs = AxisThumbnailProps & {
  orientation: 'vertical' | 'horizontal';
  width?: number;
};

const AxisThumbnailStory: StoryFn<StoryArgs> = (args): ReactElement => {
  const { orientation, width, ...axisThumbnailProps } = args;
  const chartProps = useChartProps({ data, width: width || 'auto', height: '100%', padding: 2 });

  return (
    <View
      backgroundColor="gray-50"
      overflow="hidden"
      width={800}
      minWidth={150}
      maxWidth={1200}
      height={400}
      minHeight={150}
      maxHeight={800}
      borderColor="gray-200"
      borderWidth="thin"
      padding={16}
      UNSAFE_style={{
        resize: 'both',
      }}
    >
      <Chart {...chartProps}>
        <Bar orientation={orientation} dimension="browser" metric="downloads" />
        <Axis position={orientation === 'horizontal' ? 'left' : 'bottom'} baseline>
          <AxisThumbnail {...axisThumbnailProps} />
        </Axis>
      </Chart>
    </View>
  );
};

const Basic = bindWithProps(AxisThumbnailStory);
Basic.args = {
  urlKey: 'thumbnail',
  orientation: 'vertical',
};

const YAxis = bindWithProps(AxisThumbnailStory);
YAxis.args = {
  urlKey: 'thumbnail',
  orientation: 'horizontal',
};

const dialogContent = (datum: Datum) => (
  <Content>
    <div>Operating system: {datum.series}</div>
    <div>Browser: {datum.category}</div>
    <div>Users: {datum.value}</div>
  </Content>
);

const chartPopoverCategoryThumbnails: Record<string, string> = {
  Chrome: '/chrome.png',
  Firefox: '/firefox.png',
  Safari: '/safari.png',
  Edge: '/edge.png',
  Explorer: '/explorer.png',
};

const chartPopoverDataWithThumbnails = chartPopoverData.map((d) => ({
  ...d,
  thumbnail: chartPopoverCategoryThumbnails[d.category] ?? '/chrome.png',
}));

const ChartPopoverSvgStory: StoryFn<typeof ChartPopover> = (args): ReactElement => {
  const chartProps = useChartProps({ data: chartPopoverDataWithThumbnails, renderer: 'svg', width: 600 });
  return (
    <Chart {...chartProps}>
      <Bar color="series">
        <ChartTooltip>{dialogContent}</ChartTooltip>
        <ChartPopover {...args} />
      </Bar>
      <Axis position="bottom" baseline>
        <AxisThumbnail urlKey="thumbnail" />
      </Axis>
    </Chart>
  );
};

const Popover = bindWithProps(ChartPopoverSvgStory);
Popover.args = { children: dialogContent, width: 'auto' };
Popover.storyName = 'Popover';

export { Basic, YAxis, Popover };
