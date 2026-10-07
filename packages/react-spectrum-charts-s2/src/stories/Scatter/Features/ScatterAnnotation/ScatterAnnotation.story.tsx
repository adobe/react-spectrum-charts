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
import { Axis, Legend } from '../../../../components/index.js';
import useChartProps from '../../../../hooks/useChartProps.js';
import { Scatter, ScatterAnnotation } from '../../../../pre-alpha/index.js';
import { bindWithProps } from '../../../../test-utils/index.js';
import { ScatterAnnotationProps } from '../../../../types/index.js';
import { characterData } from '../../../data/marioKartData.js';

export default {
  title: 'React Spectrum Charts 2/Pre-Alpha/Scatter/Features/Scatter Annotation',
  component: ScatterAnnotation,
};

const ScatterAnnotationStory: StoryFn<ScatterAnnotationProps> = (args): ReactElement => {
  const chartProps = useChartProps({ data: characterData, height: 450, width: 600 });
  return (
    <Chart {...chartProps}>
      <Axis position="bottom" grid ticks baseline title="Speed (normal)" />
      <Axis position="left" grid ticks baseline title="Handling (normal)" />
      <Scatter dimension="speedNormal" metric="handlingNormal" color="weightClass">
        <ScatterAnnotation {...args} />
      </Scatter>
      <Legend highlight position="right" title="Weight class" />
    </Chart>
  );
};

// textKey is required, so it is part of the basic example
const Basic = bindWithProps(ScatterAnnotationStory);
Basic.args = { textKey: 'firstCharacter' };
Object.assign(Basic, { parameters: { controls: { include: ['textKey'] } } });

const Anchor = bindWithProps(ScatterAnnotationStory);
Anchor.args = { textKey: 'firstCharacter', anchor: 'top' };
Object.assign(Anchor, { parameters: { controls: { include: ['anchor'] } } });
Object.assign(Anchor, { argTypes: { anchor: { control: 'select', options: ['top', 'bottom', 'left', 'right'] } } });

export { Basic, Anchor };
