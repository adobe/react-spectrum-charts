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

import { Chart } from '../../Chart';
import useChartProps from '../../hooks/useChartProps';
import { Donut, SegmentLabel } from '../../rc';
import { bindWithProps } from '../../test-utils';
import { ChartProps } from '../../types';
import { basicDonutData } from '../components/Donut/data';

export default {
  title: 'RSC/Chart/S2',
  component: SegmentLabel,
};

const defaultChartProps: ChartProps = {
  data: basicDonutData,
  width: 350,
  height: 350,
};

const S2Story: StoryFn<typeof SegmentLabel> = (args): ReactElement => {
  const chartProps = useChartProps({ ...defaultChartProps, s2: true });
  return (
    <Chart {...chartProps}>
      <Donut metric="count" color="browser">
        <SegmentLabel {...args} />
      </Donut>
    </Chart>
  );
};

const S2SegmentLabel = bindWithProps(S2Story);
S2SegmentLabel.args = {};

const S2SegmentLabelLabelKey = bindWithProps(S2Story);
S2SegmentLabelLabelKey.args = { labelKey: 'browser' };

const S2SegmentLabelPercent = bindWithProps(S2Story);
S2SegmentLabelPercent.args = { percent: true };

const S2SegmentLabelValue = bindWithProps(S2Story);
S2SegmentLabelValue.args = { value: true };

const S2SegmentLabelValueFormat = bindWithProps(S2Story);
S2SegmentLabelValueFormat.args = { value: true, valueFormat: 'shortNumber' };

const S2SegmentLabelSupreme = bindWithProps(S2Story);
S2SegmentLabelSupreme.args = { labelKey: 'browser', percent: true, value: true, valueFormat: 'shortNumber' };

export {
  S2SegmentLabel,
  S2SegmentLabelLabelKey,
  S2SegmentLabelPercent,
  S2SegmentLabelValue,
  S2SegmentLabelValueFormat,
  S2SegmentLabelSupreme,
};

