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
import { Donut, DonutSummary } from '../../../../pre-alpha/index.js';
import { basicDonutData } from '../../../../storyShared/Donut/data.js';
import { bindWithProps } from '../../../../test-utils/index.js';
import { DonutSummaryProps } from '../../../../types/index.js';

export default {
  title: 'React Spectrum Charts 2/Pre-Alpha/Donut/Features/Donut Summary',
  component: DonutSummary,
};

const DonutSummaryStory: StoryFn<DonutSummaryProps> = (args): ReactElement => {
  const chartProps = useChartProps({ data: basicDonutData, width: 460, height: 350 });
  return (
    <Chart {...chartProps}>
      <Donut metric="count" color="browser">
        <DonutSummary {...args} />
      </Donut>
      <Legend title="Browsers" position="right" highlight />
    </Chart>
  );
};

const Basic = bindWithProps(DonutSummaryStory);
Basic.args = {};
Object.assign(Basic, { parameters: { controls: { include: [] } } });

const Label = bindWithProps(DonutSummaryStory);
Label.args = { label: 'Visitors' };
Object.assign(Label, { parameters: { controls: { include: ['label'] } } });

const NumberFormat = bindWithProps(DonutSummaryStory);
NumberFormat.args = { label: 'Visitors', numberFormat: 'shortNumber' };
Object.assign(NumberFormat, { parameters: { controls: { include: ['numberFormat'] } } });
Object.assign(NumberFormat, {
  argTypes: {
    numberFormat: { control: 'select', options: ['shortNumber', 'standardNumber', ',.0f', ',.2f'] },
  },
});

const HideValue = bindWithProps(DonutSummaryStory);
HideValue.args = { label: 'Visitors', hideValue: true };
Object.assign(HideValue, { parameters: { controls: { include: ['hideValue'] } } });

const Delta = bindWithProps(DonutSummaryStory);
Delta.args = { label: 'Visitors', delta: 0.025 };
Object.assign(Delta, { parameters: { controls: { include: ['delta'] } } });

export { Basic, Label, NumberFormat, HideValue, Delta };
