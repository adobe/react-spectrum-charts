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
import { Axis, Legend } from '../../../components';
import useChartProps from '../../../hooks/useChartProps';
import { Scatter } from '../../../pre-alpha';
import { bindWithProps } from '../../../test-utils';
import { ScatterProps } from '../../../types';
import { characterData } from '../../../stories/data/marioKartData';

export default { title: 'React Spectrum Charts 2/Pre-Alpha/Scatter/Playground', component: Scatter };

const ScatterPlaygroundStory: StoryFn<typeof Scatter> = (args): ReactElement => {
  const chartProps = useChartProps({ data: characterData, height: 360, maxWidth: 640 });
  return (
    <Chart {...chartProps}>
      <Axis position="bottom" grid />
      <Axis position="left" grid />
      <Scatter {...args} />
      <Legend color="series" />
    </Chart>
  );
};

export const Playground = bindWithProps(ScatterPlaygroundStory);
Playground.args = { dimension: 'speedNormal', metric: 'handlingNormal', color: 'weightClass' } satisfies ScatterProps;
