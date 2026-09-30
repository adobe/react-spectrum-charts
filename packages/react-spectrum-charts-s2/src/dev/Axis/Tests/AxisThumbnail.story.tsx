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
import { Axis, AxisThumbnail, Bar, ChartPopover, ChartInspect, Legend } from '../../../components';
import useChartProps from '../../../hooks/useChartProps';
import { bindWithProps } from '../../../test-utils';
import { AxisThumbnailProps } from '../../../types';
import { barData } from '../../../stories/components/Bar/data';
import { browserData as chartPopoverData } from '../../../stories/data/data';

export default {
  title: 'React Spectrum Charts 2/Axis/Tests/Thumbnail',
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
    <div style={{ overflow: 'hidden', width: 760, height: 360, padding: 16 }}>
      <Chart {...chartProps}>
        <Bar orientation={orientation} dimension="browser" metric="downloads" color="browser" />
        <Axis position={orientation === 'horizontal' ? 'left' : 'bottom'} baseline>
          <AxisThumbnail {...axisThumbnailProps} />
        </Axis>
        <Legend />
      </Chart>
    </div>
  );
};

const Basic = bindWithProps(AxisThumbnailStory);
Basic.args = {
  urlKey: 'thumbnail',
  orientation: 'vertical',
};
Object.assign(Basic, { parameters: { controls: { include: ['urlKey', 'orientation'] } } });

const YAxis = bindWithProps(AxisThumbnailStory);
YAxis.args = {
  urlKey: 'thumbnail',
  orientation: 'horizontal',
};

const dialogContent = (datum: Datum) => (
  <div>
    <div>Operating system: {datum.series}</div>
    <div>Browser: {datum.category}</div>
    <div>Users: {datum.value}</div>
  </div>
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
        <ChartInspect>{dialogContent}</ChartInspect>
        <ChartPopover {...args} />
      </Bar>
      <Axis position="bottom" baseline>
        <AxisThumbnail urlKey="thumbnail" />
      </Axis>
      <Legend />
    </Chart>
  );
};

const Popover = bindWithProps(ChartPopoverSvgStory);
Popover.args = { children: dialogContent, width: 'auto' };
Popover.storyName = 'Popover';
Object.assign(Popover, { parameters: { controls: { include: ['children', 'width'] } } });

export { Basic, YAxis, Popover };
