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

import { TRENDLINE_VALUE } from '@spectrum-charts/constants';
import { Datum } from '@spectrum-charts/vega-spec-builder-s2';

import { Chart } from '../../../../Chart';
import { Axis, ChartInspect, Legend, Title } from '../../../../components';
import useChartProps from '../../../../hooks/useChartProps';
import { Scatter, Trendline } from '../../../../pre-alpha';
import { bindWithProps } from '../../../../test-utils';
import { ChartProps } from '../../../../types';
import { characterData } from '../../../data/marioKartData';

export default {
  title: 'React Spectrum Charts 2/Pre-Alpha/Scatter/Features/Trendline',
  component: Trendline,
};

const defaultChartProps: ChartProps = { data: characterData, height: 500, width: 500 };

const TrendlineStory: StoryFn<typeof Trendline> = (args): ReactElement => {
  const chartProps = useChartProps(defaultChartProps);
  return (
    <Chart {...chartProps}>
      <Axis position="bottom" grid ticks baseline title="Speed (normal)" />
      <Axis position="left" grid ticks baseline title="Handling (normal)" />
      <Scatter color="weightClass" dimension="speedNormal" metric="handlingNormal">
        <Trendline {...args} />
      </Scatter>
      <Legend title="Weight class" highlight position="right" />
      <Title text="Mario Kart 8 Character Data" />
    </Chart>
  );
};

const TrendlineWithInspectStory: StoryFn<typeof Trendline> = (args): ReactElement => {
  const chartProps = useChartProps(defaultChartProps);
  return (
    <Chart {...chartProps}>
      <Axis position="bottom" grid ticks baseline title="Speed (normal)" />
      <Axis position="left" grid ticks baseline title="Handling (normal)" />
      <Scatter color="weightClass" dimension="speedNormal" metric="handlingNormal">
        <Trendline {...args}>
          <ChartInspect>
            {(item: Datum) => (
              <div>
                <div>Trendline value: {item[TRENDLINE_VALUE]}</div>
                <div>Handling (normal): {item.handlingNormal}</div>
              </div>
            )}
          </ChartInspect>
        </Trendline>
      </Scatter>
      <Legend title="Weight class" highlight position="right" />
      <Title text="Mario Kart 8 Character Data" />
    </Chart>
  );
};

const Basic = bindWithProps(TrendlineStory);
Basic.args = {
  method: 'linear',
  lineType: 'dashed',
  lineWidth: 'S',
};

// orientation is only supported on scatter plots
const Orientation = bindWithProps(TrendlineStory);
Orientation.args = {
  orientation: 'vertical',
  method: 'average',
  lineType: 'solid',
  lineWidth: 'XS',
  dimensionExtent: ['domain', 'domain'],
};

const Inspect = bindWithProps(TrendlineWithInspectStory);
Inspect.args = {
  method: 'linear',
  lineType: 'dashed',
  lineWidth: 'S',
  highlightRawPoint: true,
};

export { Basic, Inspect, Orientation };
