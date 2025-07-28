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

import { View } from '@adobe/react-spectrum';

import { Chart } from '../../../Chart';
import useChartProps from '../../../hooks/useChartProps';
import { Donut, DonutSummary } from '../../../rc';
import { bindWithProps } from '../../../test-utils';
import { ChartProps, DonutSummaryProps } from '../../../types';
import { basicDonutData } from '../Donut/data';

export default {
  title: 'RSC/Donut/DonutSummary',
  component: DonutSummary,
};

const defaultChartProps: ChartProps = {
  data: basicDonutData,
  width: 350,
  height: 350,
};

const DonutStory: StoryFn<DonutSummaryProps & { width?: number; height?: number }> = (args): ReactElement => {
  const { width, height, ...donutSummaryProps } = args;
  const chartProps = useChartProps({ ...defaultChartProps, width: width ?? 350, height: height ?? 350 });
  return (
    <Chart {...chartProps}>
      <Donut metric="count" color="browser">
        <DonutSummary {...donutSummaryProps} />
      </Donut>
    </Chart>
  );
};

const ResponsiveStory: StoryFn<typeof DonutSummary> = (args): ReactElement => {
  const chartProps = useChartProps({ ...defaultChartProps, width: '100%', height: '100%' });
  return (
    <View
      backgroundColor="gray-50"
      padding="size-600"
      overflow="auto"
      minHeight={50}
      maxHeight={600}
      width={600}
      height={200}
      UNSAFE_style={{
        resize: 'vertical',
      }}
    >
      <Chart {...chartProps} minHeight={50}>
        <Donut metric="count" color="browser">
          <DonutSummary {...args} />
        </Donut>
      </Chart>
    </View>
  );
};

const Basic = bindWithProps(DonutStory);
Basic.args = {
  label: 'Visitors',
  numberFormat: 'shortNumber',
};

const NoLabel = bindWithProps(DonutStory);
NoLabel.args = {};

const NumberFormat = bindWithProps(DonutStory);
NumberFormat.args = {
  numberFormat: 'standardNumber',
  label: 'Visitors',
};

const Responsive = bindWithProps(ResponsiveStory);
Responsive.args = {
  label: 'Visitors',
};

export { Basic, NoLabel, NumberFormat, Responsive };
