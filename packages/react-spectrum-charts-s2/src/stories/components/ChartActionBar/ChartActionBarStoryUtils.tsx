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

import { ActionButton, Text } from '@react-spectrum/s2';
import { action } from 'storybook/actions';
import { StoryFn } from '@storybook/react';

import { Datum } from '@spectrum-charts/vega-spec-builder-s2';

import { Chart } from '../../../Chart';
import { Axis, ChartActionBar, Legend, Line } from '../../../components';
import useChartProps from '../../../hooks/useChartProps';
import { ChartProps } from '../../../types';
import { workspaceTrendsDataWithVisiblePoints } from '../../data/data';

const defaultChartProps: ChartProps = {
  data: workspaceTrendsDataWithVisiblePoints,
  minWidth: 400,
  maxWidth: 800,
  height: 400,
};

export const ActionBarLineStory: StoryFn<typeof ChartActionBar> = (args): ReactElement => {
  const chartProps = useChartProps(defaultChartProps);
  return (
    <Chart {...chartProps}>
      <Axis position="bottom" baseline ticks labelFormat="time" title="Day" />
      <Axis position="left" grid title="Events" />
      <Line color="series" dimension="datetime" metric="value" name="line0" scaleType="time" staticPoint="staticPoint">
        <ChartActionBar {...args} />
      </Line>
      <Legend highlight />
    </Chart>
  );
};

export const actionButton = (key: string, label: string, icon: ReactElement, datum: Datum, close: () => void) => (
  <ActionButton
    key={key}
    isQuiet
    onPress={() => {
      action(`ChartActionBar:${key}`)(datum);
      close();
    }}
  >
    {icon}
    <Text>{label}</Text>
  </ActionButton>
);
