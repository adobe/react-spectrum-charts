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
import { Axis, Legend, Line, LineDirectLabel } from '../../../../components/index.js';
import useChartProps from '../../../../hooks/useChartProps.js';
import { bindWithProps } from '../../../../test-utils/index.js';
import { visitsByChannelData } from '../../lineData.js';
import { setArgTypes, setControls } from '../../lineStoryUtils.js';

export default {
  title: 'React Spectrum Charts 2/Line/Features/Direct Label',
  component: LineDirectLabel,
};

const DirectLabelStory: StoryFn<typeof LineDirectLabel> = (args): ReactElement => {
  const chartProps = useChartProps({ data: visitsByChannelData, minWidth: 400, maxWidth: 800, height: 400 });
  return (
    <Chart {...chartProps}>
      <Axis position="left" grid title="Visits" />
      <Axis position="bottom" labelFormat="time" baseline ticks />
      <Line dimension="datetime" metric="visits" color="channel">
        <LineDirectLabel {...args} />
      </Line>
      <Legend highlight />
    </Chart>
  );
};

const Basic = bindWithProps(DirectLabelStory);
Basic.args = {};
setControls(Basic, []);

const Value = bindWithProps(DirectLabelStory);
Value.args = { value: 'series' };
setControls(Value, ['value']);
setArgTypes(Value, { value: { control: 'inline-radio', options: ['last', 'average', 'series'] } });

const Position = bindWithProps(DirectLabelStory);
Position.args = { position: 'start' };
setControls(Position, ['position']);
setArgTypes(Position, { position: { control: 'inline-radio', options: ['start', 'end'] } });

const Format = bindWithProps(DirectLabelStory);
Format.args = { format: '.2s' };
setControls(Format, ['format']);

const Prefix = bindWithProps(DirectLabelStory);
Prefix.args = { prefix: 'Last: ' };
setControls(Prefix, ['prefix']);

const ExcludeSeries = bindWithProps(DirectLabelStory);
ExcludeSeries.args = { excludeSeries: ['Social'] };
setControls(ExcludeSeries, ['excludeSeries']);

const FontSize = bindWithProps(DirectLabelStory);
FontSize.args = { fontSize: 16 };
setControls(FontSize, ['fontSize']);

export { Basic, Value, Position, Format, Prefix, ExcludeSeries, FontSize };
