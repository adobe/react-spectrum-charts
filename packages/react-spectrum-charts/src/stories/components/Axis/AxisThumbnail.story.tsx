/*
 * Copyright 2025 Adobe. All rights reserved.
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
import { Axis, AxisThumbnail, Bar } from '../../../components';
import useChartProps from '../../../hooks/useChartProps';
import { bindWithProps } from '../../../test-utils';
import { barData } from '../Bar/data';

export default {
  title: 'RSC/Axis/AxisThumbnail',
  component: AxisThumbnail,
};

const data = barData.map((datum) => ({
  ...datum,
  thumbnail: 'https://vega.github.io/images/idl-logo.png',
}));

const AxisThumbnailStory: StoryFn<typeof AxisThumbnail> = (args): ReactElement => {
  const chartProps = useChartProps({ data, width: 600 });

  return (
    <Chart {...chartProps}>
      <Bar dimension="browser" metric="downloads" />
      <Axis position="bottom" baseline>
        <AxisThumbnail {...args} />
      </Axis>
    </Chart>
  );
};

const Basic = bindWithProps(AxisThumbnailStory);
Basic.args = {
  urlKey: 'thumbnail',
};

export { Basic };
