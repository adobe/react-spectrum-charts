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
import { Axis, Bar, Legend } from '../../../../components/index.js';
import useChartProps from '../../../../hooks/useChartProps.js';
import { acquisitionGoalData } from '../../../../storyShared/components/Bar/data.js';
import { BarStory, defaultProps } from '../barStoryTemplates.js';
import { bindStory } from '../storyUtils.js';

export default {
  title: 'React Spectrum Charts 2/Bar/Features/Styling',
  component: Bar,
};

const ColorOverrideStory: StoryFn<typeof Bar> = (args): ReactElement => {
  // Chart colors mirror the data's statusColor values so the legend matches the overridden fills.
  const chartProps = useChartProps({
    data: acquisitionGoalData,
    colors: ['#0d7a55', '#d7373f'],
    width: 640,
    height: 400,
  });
  return (
    <Chart {...chartProps}>
      <Axis position="bottom" baseline title="Acquisition channel" />
      <Axis position="left" grid title="Sign-ups" />
      <Bar {...args} />
      <Legend title="Goal status" />
    </Chart>
  );
};

const HasSquareCorners = bindStory(BarStory);
HasSquareCorners.args = { ...defaultProps, hasSquareCorners: true };
HasSquareCorners.parameters = { controls: { include: ['hasSquareCorners'] } };

// Bar borders share the fill color, so a reduced opacity is needed to see the border style.
const LineType = bindStory(BarStory);
LineType.args = { ...defaultProps, lineType: { value: 'dashed' }, lineWidth: 2, opacity: { value: 0.5 } };
LineType.parameters = { controls: { include: ['lineType'] } };

// Bar borders share the fill color, so a reduced opacity is needed to see the border width.
const LineWidth = bindStory(BarStory);
LineWidth.args = { ...defaultProps, lineWidth: 4, opacity: { value: 0.5 } };
LineWidth.parameters = { controls: { include: ['lineWidth'] } };

const Opacity = bindStory(BarStory);
Opacity.args = { ...defaultProps, opacity: { value: 0.6 } };
Opacity.parameters = { controls: { include: ['opacity'] } };

const ColorOverride = bindStory(ColorOverrideStory);
ColorOverride.args = { ...defaultProps, color: 'status', colorOverride: 'statusColor' };
ColorOverride.parameters = { controls: { include: ['colorOverride'] } };

export { HasSquareCorners, LineType, LineWidth, Opacity, ColorOverride };
