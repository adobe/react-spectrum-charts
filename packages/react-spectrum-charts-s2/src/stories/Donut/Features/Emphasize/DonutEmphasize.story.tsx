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

import { Chart } from '../../../../Chart';
import useChartProps from '../../../../hooks/useChartProps';
import { Donut, SegmentLabel } from '../../../../pre-alpha';
import { bindWithProps } from '../../../../test-utils';
import { basicDonutData } from '../../../components/Donut/data';

export default {
  title: 'React Spectrum Charts 2/Donut/Features/Emphasize',
  component: Donut,
};

const defaultChartProps = { data: basicDonutData, width: 400, height: 400 };

// non-emphasized segments render solid gray at full opacity (not a fade) - their labels stay fully
// visible and normally colored, unlike Line's primarySeries which suppresses non-primary labels
const BasicStory: StoryFn<typeof Donut> = (args): ReactElement => {
  const chartProps = useChartProps(defaultChartProps);
  return (
    <Chart {...chartProps}>
      <Donut metric="count" color="browser" {...args}>
        <SegmentLabel value valueFormat="shortNumber" />
      </Donut>
    </Chart>
  );
};

const Basic = bindWithProps(BasicStory);
Basic.args = { emphasizedItems: ['Chrome'] };

const Multi = bindWithProps(BasicStory);
Multi.args = { emphasizedItems: ['Chrome', 'Firefox'] };

export { Basic, Multi };
