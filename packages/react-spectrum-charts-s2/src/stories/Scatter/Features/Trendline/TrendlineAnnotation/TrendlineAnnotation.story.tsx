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

import { Chart } from '../../../../../Chart';
import { Axis, Legend } from '../../../../../components';
import useChartProps from '../../../../../hooks/useChartProps';
import { Scatter, Trendline, TrendlineAnnotation } from '../../../../../pre-alpha';
import { bindWithProps } from '../../../../../test-utils';
import { TrendlineAnnotationProps } from '../../../../../types';
import { characterData } from '../../../../data/marioKartData';

export default {
  title: 'React Spectrum Charts 2/Pre-Alpha/Scatter/Features/Trendline/Trendline Annotation',
  component: TrendlineAnnotation,
};

// regression methods (including the default linear) fail with annotations, so median is used
const TrendlineAnnotationStory: StoryFn<TrendlineAnnotationProps> = (args): ReactElement => {
  const chartProps = useChartProps({ data: characterData, height: 450, width: 600 });
  return (
    <Chart {...chartProps}>
      <Axis position="bottom" grid ticks baseline title="Speed (normal)" />
      <Axis position="left" grid ticks baseline title="Handling (normal)" />
      <Scatter color="weightClass" dimension="speedNormal" metric="handlingNormal">
        <Trendline method="median" dimensionExtent={['domain', 'domain']} lineWidth="S">
          <TrendlineAnnotation {...args} />
        </Trendline>
      </Scatter>
      <Legend title="Weight class" highlight position="right" />
    </Chart>
  );
};

const Basic = bindWithProps(TrendlineAnnotationStory);
Basic.args = {};
Object.assign(Basic, { parameters: { controls: { include: [] } } });

const Badge = bindWithProps(TrendlineAnnotationStory);
Badge.args = { badge: true };
Object.assign(Badge, { parameters: { controls: { include: ['badge'] } } });

const DimensionValue = bindWithProps(TrendlineAnnotationStory);
DimensionValue.args = { dimensionValue: 'start' };
Object.assign(DimensionValue, { parameters: { controls: { include: ['dimensionValue'] } } });

const NumberFormat = bindWithProps(TrendlineAnnotationStory);
NumberFormat.args = { numberFormat: '.2f' };
Object.assign(NumberFormat, { parameters: { controls: { include: ['numberFormat'] } } });

const Prefix = bindWithProps(TrendlineAnnotationStory);
Prefix.args = { prefix: 'Handling:' };
Object.assign(Prefix, { parameters: { controls: { include: ['prefix'] } } });

export { Basic, Badge, DimensionValue, NumberFormat, Prefix };
