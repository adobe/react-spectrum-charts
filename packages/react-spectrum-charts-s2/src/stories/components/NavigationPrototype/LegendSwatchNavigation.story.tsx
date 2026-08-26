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
import { Axis, Bar, Legend } from '../../../components';
import useChartProps from '../../../hooks/useChartProps';
import { barData } from '../Bar/data';

export default {
  title: 'React Spectrum Charts 2/NavigationPrototype/Features/Legend Swatch Navigation',
};

/**
 * Legend navigation via bolding + focus ring around swatch. With `accessibleNavigation`, the
 * data-navigator exposes a legend region. Tab into the chart, press Enter, then use ← / → to
 * move through legend entries. Each focused entry draws a 20px-padded focus ring around its swatch
 * and the label is bolded. The chart dims non-focused entries via `FOCUSED_SERIES` when `highlight`
 * is enabled.
 */
const LegendSwatchNavigationStory: StoryFn = (): ReactElement => {
  const chartProps = useChartProps({ data: barData, width: 600, height: 600, accessibleNavigation: true });
  return (
    <Chart {...chartProps}>
      <Axis position="bottom" baseline title="Browser" />
      <Axis position="left" grid title="Downloads" />
      <Bar dimension="browser" metric="downloads" color="browser" />
      <Legend title="Browser" color="browser" highlight />
    </Chart>
  );
};

export const LegendSwatchNavigation = LegendSwatchNavigationStory.bind({});
