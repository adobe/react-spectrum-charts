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
import useChartProps from '../../../hooks/useChartProps';
import { Donut, SegmentLabel } from '../../../pre-alpha';
import { bindWithProps } from '../../../test-utils';
import { ChartProps } from '../../../types';
import { basicDonutData } from '../../../stories/components/Donut/data';

export default {
  title: 'React Spectrum Charts 2/Pre-Alpha/Donut/Tests/SegmentLabel Variants',
  component: SegmentLabel,
};


const defaultChartProps: ChartProps = { data: basicDonutData, width: 350, height: 350 };

const SegmentLabelStory: StoryFn<typeof SegmentLabel> = (args): ReactElement => {
  const chartProps = useChartProps(defaultChartProps);

  return (
    <Chart {...chartProps}>
      <Donut metric="count" color="browser">
        <SegmentLabel {...args} />
      </Donut>
    </Chart>
  );
};

const Basic = bindWithProps(SegmentLabelStory);
Basic.args = { labelKey: 'browser' };

const Percent = bindWithProps(SegmentLabelStory);
Percent.args = { percent: true, value: false };

const Value = bindWithProps(SegmentLabelStory);
Value.args = { value: true };

const ValueFormat = bindWithProps(SegmentLabelStory);
ValueFormat.args = { value: true, valueFormat: 'shortNumber' };

export { Basic, Percent, Value, ValueFormat };
