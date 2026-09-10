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
import { Donut, DonutSummary } from '../../../../pre-alpha';
import { bindWithProps } from '../../../../test-utils';

export default {
  title: 'React Spectrum Charts 2/Donut/Features/Donut Summary',
  component: DonutSummary,
};

const data = [
  { count: 10390, browser: 'Chrome' },
  { count: 8281, browser: 'Firefox' },
  { count: 7045, browser: 'Safari' },
];

const PositiveDeltaStory: StoryFn = (): ReactElement => {
  const chartProps = useChartProps({ data, width: 200, height: 200 });
  return (
    <Chart {...chartProps}>
      <Donut metric="count" color="browser">
        <DonutSummary label="Visitors" delta={0.025} />
      </Donut>
    </Chart>
  );
};

const NegativeDeltaStory: StoryFn = (): ReactElement => {
  const chartProps = useChartProps({ data, width: 200, height: 200 });
  return (
    <Chart {...chartProps}>
      <Donut metric="count" color="browser">
        <DonutSummary label="Visitors" delta={-0.074} />
      </Donut>
    </Chart>
  );
};

// no label - delta stacks directly below the value
const NoLabelDeltaStory: StoryFn = (): ReactElement => {
  const chartProps = useChartProps({ data, width: 200, height: 200 });
  return (
    <Chart {...chartProps}>
      <Donut metric="count" color="browser">
        <DonutSummary delta={0.025} />
      </Donut>
    </Chart>
  );
};

// hideValue - label becomes the anchor line, with delta stacked directly below it
const HideValueDeltaStory: StoryFn = (): ReactElement => {
  const chartProps = useChartProps({ data, width: 200, height: 200 });
  return (
    <Chart {...chartProps}>
      <Donut metric="count" color="browser">
        <DonutSummary hideValue label="Visitors" delta={0.025} />
      </Donut>
    </Chart>
  );
};

const PositiveDelta = bindWithProps(PositiveDeltaStory);
const NegativeDelta = bindWithProps(NegativeDeltaStory);
const NoLabelDelta = bindWithProps(NoLabelDeltaStory);
const HideValueDelta = bindWithProps(HideValueDeltaStory);

export { PositiveDelta, NegativeDelta, NoLabelDelta, HideValueDelta };
