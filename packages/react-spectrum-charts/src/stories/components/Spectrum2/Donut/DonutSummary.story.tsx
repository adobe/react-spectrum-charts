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
import React, { ReactElement } from 'react';

import { StoryFn } from '@storybook/react';

import { Chart } from '../../../../Chart';
import useChartProps from '../../../../hooks/useChartProps';
import { Donut, DonutSummary } from '../../../../rc';
import { bindWithProps } from '../../../../test-utils';
import { ChartProps, DonutSummaryProps } from '../../../../types';
import { basicDonutData } from '../../Donut/data';

export default {
  title: 'RSC/Chart/Spectrum2/Donut/DonutSummary',
  component: DonutSummary,
};

const defaultChartProps: ChartProps = {
  data: basicDonutData,
  width: 350,
  height: 350,
};

const DonutSummaryStory: StoryFn<DonutSummaryProps & { width?: number; height?: number }> = (args): ReactElement => {
  const { width, height, ...donutSummaryProps } = args;
  const chartProps = useChartProps({ ...defaultChartProps, width: width ?? 350, height: height ?? 350 });
  return (
    <Chart {...chartProps} S2>
      <Donut metric="count" color="browser">
        <DonutSummary {...donutSummaryProps} />
      </Donut>
    </Chart>
  );
};

const Basic = bindWithProps(DonutSummaryStory);
Basic.args = {
  label: 'Visitors',
  numberFormat: 'shortNumber',
};

export { Basic };

