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
import { Axis, Legend } from '../../../../components';
import useChartProps from '../../../../hooks/useChartProps';
import { Scatter, ScatterPath } from '../../../../pre-alpha';
import { bindWithProps } from '../../../../test-utils';
import { ScatterPathProps } from '../../../../types';
import { productTrajectoryData } from '../../scatterData';

export default {
  title: 'React Spectrum Charts 2/Pre-Alpha/Scatter/Features/Scatter Path',
  component: ScatterPath,
};

// paths connect points in data order; groupBy defaults to the color facet
const trajectoryByPeriodData = productTrajectoryData.map((d) => ({ ...d, period: d.year < 2023 ? 'early' : 'late' }));

const ScatterPathStory: StoryFn<ScatterPathProps> = (args): ReactElement => {
  const chartProps = useChartProps({ data: trajectoryByPeriodData, height: 450, width: 600 });
  return (
    <Chart {...chartProps}>
      <Axis position="bottom" grid ticks baseline title="Market share (%)" />
      <Axis position="left" grid ticks baseline title="Year-over-year growth (%)" />
      <Scatter dimension="marketShare" metric="growth" color="product">
        <ScatterPath {...args} />
      </Scatter>
      <Legend highlight position="right" title="Product" />
    </Chart>
  );
};

const Basic = bindWithProps(ScatterPathStory);
Basic.args = {};
Object.assign(Basic, { parameters: { controls: { include: [] } } });

const Color = bindWithProps(ScatterPathStory);
Color.args = { color: 'gray-700' };
Object.assign(Color, { parameters: { controls: { include: ['color'] } } });

const GroupBy = bindWithProps(ScatterPathStory);
// splitting each product's trail into early (2021–22) and late (2023–24) segments
GroupBy.args = { groupBy: ['product', 'period'] };
Object.assign(GroupBy, { parameters: { controls: { include: ['groupBy'] } } });

const Opacity = bindWithProps(ScatterPathStory);
Opacity.args = { opacity: 0.2 };
Object.assign(Opacity, { parameters: { controls: { include: ['opacity'] } } });
Object.assign(Opacity, { argTypes: { opacity: { control: { type: 'range', min: 0, max: 1, step: 0.05 } } } });

// path width is scaled by year so each trail widens toward the most recent point
const PathWidth = bindWithProps(ScatterPathStory);
PathWidth.args = { pathWidth: 'year' };
Object.assign(PathWidth, { parameters: { controls: { include: ['pathWidth'] } } });

export { Basic, Color, GroupBy, Opacity, PathWidth };
