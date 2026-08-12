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
import { Axis, Bar, ChartInspect, Line } from '../../../../components';
import useChartProps from '../../../../hooks/useChartProps';
import { Combo } from '../../../../pre-alpha';
import { formatTimestamp } from '../../../../stories/storyUtils';
import { bindWithProps } from '../../../../test-utils';
import { ChartProps, ComboProps } from '../../../../types';
import { peopleAdoptionComboData } from '../../../data/data';

export default {
  title: 'React Spectrum Charts 2/Combo/Features/Inspect',
  component: Combo,
};

const defaultChartProps: ChartProps = {
  data: peopleAdoptionComboData,
  minWidth: 400,
  maxWidth: 800,
  height: 400,
};

// each child mark gets its own independent ChartInspect content
const InspectStory: StoryFn<ComboProps> = (args): ReactElement => {
  const chartProps = useChartProps(defaultChartProps);
  return (
    <Chart {...chartProps}>
      <Axis position="left" title="People" grid />
      <Axis position="right" name="adoption" title="Adoption Rate" />
      <Axis position="bottom" labelFormat="time" baseline ticks />
      <Combo {...args}>
        <Bar metric="people">
          <ChartInspect>
            {(datum) => (
              <div>
                <div>{formatTimestamp(datum.datetime as number)}</div>
                <div>People: {datum.people}</div>
              </div>
            )}
          </ChartInspect>
        </Bar>
        <Line metric="adoptionRate" metricAxis="adoption" color={{ value: 'categorical-200' }} scaleType="point">
          <ChartInspect>
            {(datum) => (
              <div>
                <div>{formatTimestamp(datum.datetime as number)}</div>
                <div>Adoption Rate: {datum.adoptionRate}</div>
              </div>
            )}
          </ChartInspect>
        </Line>
      </Combo>
    </Chart>
  );
};

const Inspect = bindWithProps(InspectStory);
Inspect.args = {
  name: 'combo0',
  dimension: 'datetime',
};

export { Inspect };
