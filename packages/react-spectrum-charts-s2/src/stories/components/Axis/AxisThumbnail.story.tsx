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

import { Chart } from '../../../Chart.js';
import { Axis, AxisThumbnail, Bar, Legend } from '../../../components/index.js';
import useChartProps from '../../../hooks/useChartProps.js';
import { bindWithProps } from '../../../test-utils/index.js';
import { downloadsByBrowserData } from './axisStoryData.js';

export default {
  title: 'React Spectrum Charts 2/Axis/Features/Thumbnail',
  component: AxisThumbnail,
};

const controls = (...include: string[]) => ({ parameters: { controls: { include } } });

const BROWSER_ICONS: Record<string, string> = {
  Chrome: '/chrome.png',
  Safari: '/safari.png',
  Edge: '/edge.png',
  Firefox: '/firefox.png',
};

const browsers = downloadsByBrowserData.filter(({ browser }) => browser in BROWSER_ICONS);
const thumbnailData = browsers.map((datum) => ({ ...datum, thumbnail: BROWSER_ICONS[datum.browser] }));
const browserIconData = browsers.map((datum) => ({ ...datum, browserIcon: BROWSER_ICONS[datum.browser] }));

const AxisThumbnailStory: StoryFn<typeof AxisThumbnail> = (args): ReactElement => {
  const data = args.urlKey ? browserIconData : thumbnailData;
  const chartProps = useChartProps({ data, width: 700, height: 380 });
  return (
    <Chart {...chartProps}>
      <Axis position="left" grid title="Downloads" numberFormat="shortNumber" />
      <Axis position="bottom" baseline title="Browser">
        <AxisThumbnail {...args} />
      </Axis>
      <Bar dimension="browser" metric="downloads" color="os" />
      <Legend />
    </Chart>
  );
};

// Reads image URLs from the default `thumbnail` data field.
const Basic = bindWithProps(AxisThumbnailStory);
Basic.args = {};
Object.assign(Basic, controls());

// Image URLs live in a `browserIcon` data field instead of the default `thumbnail`.
const UrlKey = bindWithProps(AxisThumbnailStory);
UrlKey.args = { urlKey: 'browserIcon' };
Object.assign(UrlKey, controls('urlKey'));

export { Basic, UrlKey };
