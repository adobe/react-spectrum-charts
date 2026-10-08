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
/* eslint-disable react/prop-types -- story args are typed via StoryFn generics */
import { ComponentProps, ReactElement } from 'react';

import { StoryFn } from '@storybook/react';

import { Chart } from '../../../../Chart.js';
import { ChartInspect, ChartPopover, Legend } from '../../../../components/index.js';
import useChartProps from '../../../../hooks/useChartProps.js';
import { Donut, DonutSummary, SegmentLabel } from '../../../../pre-alpha/index.js';
import { basicDonutData, booleanDonutData, sliveredDonutData } from '../../../../storyShared/Donut/data.js';
import { bindWithProps } from '../../../../test-utils/index.js';
import { ChartProps } from '../../../../types/index.js';

type DrawInAnimationArgs = ComponentProps<typeof Donut> &
  Pick<ChartProps, 'animations' | 'animationTypes'> & {
    data?: ChartProps['data'];
    labelStyle?: 'none' | 'direct' | 'advanced';
  };

export default {
  title: 'React Spectrum Charts 2/Pre-Alpha/Donut/Features/DrawInAnimation',
  component: Donut,
  argTypes: {
    animations: { control: 'boolean' },
    animationTypes: { control: { type: 'check' }, options: ['hover', 'drawIn'] },
    data: { control: false },
    labelStyle: {
      control: 'select',
      description: 'Labels fade in linearly over 50ms once their own slice finishes drawing.',
      options: ['none', 'direct', 'advanced'],
    },
  },
  args: { animations: true, animationTypes: ['hover', 'drawIn'] },
};

const defaultChartProps = { data: basicDonutData, width: 500, height: 500 };
const defaultArgs = { color: 'browser', metric: 'count' };

const DrawInStory: StoryFn<DrawInAnimationArgs> = ({
  animations,
  animationTypes,
  data,
  labelStyle = 'none',
  ...args
}): ReactElement => {
  const chartProps = useChartProps({
    ...defaultChartProps,
    data: data ?? (args.isBoolean ? booleanDonutData : basicDonutData),
  });
  const isAdvancedLabel = labelStyle === 'advanced';
  return (
    <Chart {...chartProps} animations={animations} animationTypes={animationTypes}>
      <Donut {...args}>
        <DonutSummary label="Visitors" />
        {labelStyle !== 'none' && (
          <SegmentLabel value={!isAdvancedLabel} percent swatch={isAdvancedLabel} showValueRow={isAdvancedLabel} />
        )}
      </Donut>
    </Chart>
  );
};

const WithHoverStory: StoryFn<DrawInAnimationArgs> = ({
  animations,
  animationTypes,
  data,
  labelStyle = 'direct',
  ...args
}): ReactElement => {
  const chartProps = useChartProps({
    ...defaultChartProps,
    width: 600,
    data: data ?? (args.isBoolean ? booleanDonutData : basicDonutData),
  });
  const isAdvancedLabel = labelStyle === 'advanced';
  return (
    <Chart {...chartProps} animations={animations} animationTypes={animationTypes}>
      <Donut {...args}>
        {labelStyle !== 'none' && (
          <SegmentLabel
            value={!isAdvancedLabel}
            percent={isAdvancedLabel}
            swatch={isAdvancedLabel}
            showValueRow={isAdvancedLabel}
          />
        )}
        <ChartInspect />
        <ChartPopover width="auto" />
      </Donut>
      <Legend highlight isToggleable />
    </Chart>
  );
};

const Circle = bindWithProps(DrawInStory);
Circle.args = { ...defaultArgs };

const Pie = bindWithProps(DrawInStory);
Pie.args = { ...defaultArgs, holeRatio: 0 };

const Semicircle = bindWithProps(DrawInStory);
Semicircle.args = { ...defaultArgs, variant: 'semicircle' };

const BooleanDonut = bindWithProps(DrawInStory);
BooleanDonut.args = { color: 'id', metric: 'value', isBoolean: true };

const DirectLabels = bindWithProps(DrawInStory);
DirectLabels.args = { ...defaultArgs, labelStyle: 'direct' };

const AdvancedLabels = bindWithProps(DrawInStory);
AdvancedLabels.args = { ...defaultArgs, labelStyle: 'advanced' };

const SmallSlices = bindWithProps(DrawInStory);
SmallSlices.args = { ...defaultArgs, data: sliveredDonutData, labelStyle: 'advanced' };

const WithHover = bindWithProps(WithHoverStory);
WithHover.args = { ...defaultArgs };

export { AdvancedLabels, BooleanDonut, Circle, DirectLabels, Pie, Semicircle, SmallSlices, WithHover };
