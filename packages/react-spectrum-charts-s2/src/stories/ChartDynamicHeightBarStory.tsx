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
import React, { ReactElement } from 'react';

import { StoryFn } from '@storybook/react';

import { View } from '@adobe/react-spectrum';

import { Chart } from '../Chart';
import { Axis, Bar } from '../components';
import useChartProps from '../hooks/useChartProps';

export const ChartDynamicHeightBarStory: StoryFn<typeof Chart> = (args): ReactElement => {
  const props = useChartProps(args);
  return (
    <View
      backgroundColor="gray-50"
      overflow="auto"
      minHeight={100}
      maxHeight={1200}
      height={600}
      borderColor="gray-200"
      borderWidth="thin"
      UNSAFE_style={{
        resize: 'vertical',
      }}
    >
      <Chart {...props}>
        <Axis position="bottom" baseline />
        <Axis position="left" grid />
        <Bar dimension="x" metric="y" color="series" />
      </Chart>
    </View>
  );
};


