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
import { Axis, Bar, ChartInspect, Line } from '../../../components';
import useChartProps from '../../../hooks/useChartProps';
import { Combo } from '../../../pre-alpha';
import { peopleAdoptionComboData, peopleTotalComboData } from '../../../storyShared/data/data';
import { formatTimestamp } from '../../../storyShared/storyUtils';
import { bindWithProps } from '../../../test-utils';
import { ChartProps, ComboProps } from '../../../types';

export default {
  title: 'React Spectrum Charts 2/Pre-Alpha/Combo/Features',
  component: Combo,
};

// Combo children use static colors, so there is no color facet for a Legend
// orders and visits share a comparable scale, so both marks plot against a single shared axis
const ordersAndVisitsComboData = [
  { datetime: 1667890800000, orders: 42, visits: 58 },
  { datetime: 1667977200000, orders: 55, visits: 63 },
  { datetime: 1668063600000, orders: 61, visits: 70 },
  { datetime: 1668150000000, orders: 48, visits: 66 },
  { datetime: 1668236400000, orders: 70, visits: 82 },
  { datetime: 1668322800000, orders: 65, visits: 90 },
  { datetime: 1668409200000, orders: 58, visits: 75 },
];

const defaultChartProps: ChartProps = { data: ordersAndVisitsComboData, minWidth: 400, maxWidth: 800, height: 400 };
const defaultArgs: ComboProps = { name: 'combo0', dimension: 'datetime' };

const BasicStory: StoryFn<ComboProps> = (args): ReactElement => {
  const chartProps = useChartProps(defaultChartProps);
  return (
    <Chart {...chartProps}>
      <Axis position="left" title="Count" grid />
      <Axis position="bottom" labelFormat="time" baseline ticks />
      <Combo {...args}>
        <Bar metric="orders" />
        <Line metric="visits" color={{ value: 'categorical-200' }} scaleType="point" />
      </Combo>
    </Chart>
  );
};

// each child mark targets its own named axis via metricAxis, rather than sharing one y-scale
const MetricAxisStory: StoryFn<ComboProps> = (args): ReactElement => {
  const chartProps = useChartProps({ ...defaultChartProps, data: peopleTotalComboData });
  return (
    <Chart {...chartProps}>
      <Axis position="left" name="people" title="People" grid />
      <Axis position="right" name="total" title="Total" />
      <Axis position="bottom" labelFormat="time" baseline ticks />
      <Combo {...args}>
        <Bar metric="people" metricAxis="people" />
        <Line metric="total" metricAxis="total" color={{ value: 'categorical-200' }} scaleType="point" />
      </Combo>
    </Chart>
  );
};

// each child mark gets its own independent ChartInspect content
const ChartInspectComboStory: StoryFn<ComboProps> = (args): ReactElement => {
  const chartProps = useChartProps({ ...defaultChartProps, data: peopleAdoptionComboData });
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

const Basic = bindWithProps(BasicStory);
Basic.args = { ...defaultArgs };
Object.assign(Basic, { parameters: { controls: { include: [] } } });

const MetricAxis = bindWithProps(MetricAxisStory);
MetricAxis.args = { ...defaultArgs };
Object.assign(MetricAxis, { parameters: { controls: { include: [] } } });

const ChartInspectStory = bindWithProps(ChartInspectComboStory);
ChartInspectStory.args = { ...defaultArgs };
Object.assign(ChartInspectStory, { parameters: { controls: { include: [] } } });

export { Basic, MetricAxis, ChartInspectStory as ChartInspect };
