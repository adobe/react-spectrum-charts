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

import { Chart } from '../../../../Chart.js';
import { Legend } from '../../../../components/index.js';
import useChartProps from '../../../../hooks/useChartProps.js';
import { Donut, SegmentLabel } from '../../../../pre-alpha/index.js';
import { basicDonutData, browserVendorDonutData } from '../../../../storyShared/Donut/data.js';
import { bindWithProps } from '../../../../test-utils/index.js';
import { SegmentLabelProps } from '../../../../types/index.js';

export default {
  title: 'React Spectrum Charts 2/Pre-Alpha/Donut/Features/Segment Label',
  component: SegmentLabel,
};

const SegmentLabelStory: StoryFn<SegmentLabelProps> = (args): ReactElement => {
  const chartProps = useChartProps({ data: basicDonutData, width: 560, height: 420 });
  return (
    <Chart {...chartProps}>
      <Donut metric="count" color="browser">
        <SegmentLabel {...args} />
      </Donut>
      <Legend title="Browsers" position="right" highlight />
    </Chart>
  );
};

const LabelKeyStory: StoryFn<SegmentLabelProps> = (args): ReactElement => {
  const chartProps = useChartProps({ data: browserVendorDonutData, width: 600, height: 420 });
  return (
    <Chart {...chartProps}>
      <Donut metric="count" color="browser">
        <SegmentLabel {...args} />
      </Donut>
      <Legend title="Browsers" position="right" highlight />
    </Chart>
  );
};

// one label style for emphasized segments and a lighter one for the rest
const LabelModeStory: StoryFn<SegmentLabelProps> = (args): ReactElement => {
  const chartProps = useChartProps({ data: basicDonutData, width: 560, height: 420 });
  return (
    <Chart {...chartProps}>
      <Donut metric="count" color="browser" emphasizedItems={['Chrome']}>
        <SegmentLabel {...args} />
        <SegmentLabel labelMode="deemphasized" value={false} percent />
      </Donut>
      <Legend title="Browsers" position="right" highlight />
    </Chart>
  );
};

const Basic = bindWithProps(SegmentLabelStory);
Basic.args = {};
Object.assign(Basic, { parameters: { controls: { include: [] } } });

const LabelKey = bindWithProps(LabelKeyStory);
LabelKey.args = { labelKey: 'browserName' };
Object.assign(LabelKey, { parameters: { controls: { include: ['labelKey'] } } });

const LabelMode = bindWithProps(LabelModeStory);
LabelMode.args = { labelMode: 'emphasized', swatch: true, showValueRow: true, percent: true, value: false };
Object.assign(LabelMode, { parameters: { controls: { include: ['labelMode'] } } });

const Percent = bindWithProps(SegmentLabelStory);
Percent.args = { percent: true };
Object.assign(Percent, { parameters: { controls: { include: ['percent'] } } });

const PercentFormat = bindWithProps(SegmentLabelStory);
PercentFormat.args = { percent: true, value: false, percentFormat: '.1%' };
Object.assign(PercentFormat, { parameters: { controls: { include: ['percentFormat'] } } });

// the total is appended to the value row, so showValueRow is required
const ShowTotal = bindWithProps(SegmentLabelStory);
ShowTotal.args = { showValueRow: true, showTotal: true, valueFormat: 'shortNumber' };
Object.assign(ShowTotal, { parameters: { controls: { include: ['showTotal'] } } });

const ShowValueRow = bindWithProps(SegmentLabelStory);
ShowValueRow.args = { showValueRow: true, percent: true };
Object.assign(ShowValueRow, { parameters: { controls: { include: ['showValueRow'] } } });

const Swatch = bindWithProps(SegmentLabelStory);
Swatch.args = { swatch: true };
Object.assign(Swatch, { parameters: { controls: { include: ['swatch'] } } });

// value is on by default, so this story turns it off
const Value = bindWithProps(SegmentLabelStory);
Value.args = { value: false };
Object.assign(Value, { parameters: { controls: { include: ['value'] } } });

const ValueFormat = bindWithProps(SegmentLabelStory);
ValueFormat.args = { valueFormat: 'shortNumber' };
Object.assign(ValueFormat, { parameters: { controls: { include: ['valueFormat'] } } });
Object.assign(ValueFormat, {
  argTypes: {
    valueFormat: { control: 'select', options: ['shortNumber', 'standardNumber', ',.0f', 'currency'] },
  },
});

export { Basic, LabelKey, LabelMode, Percent, PercentFormat, ShowTotal, ShowValueRow, Swatch, Value, ValueFormat };
