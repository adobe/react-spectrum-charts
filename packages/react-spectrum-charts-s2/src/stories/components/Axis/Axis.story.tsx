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
import { Axis } from '../../../components';
import { bindWithProps } from '../../../test-utils';
import {
  BrandHealthStory,
  BrowserBarStory,
  ConversionRateStory,
  SessionsStory,
  TimeAxisStory,
  controls,
  horizontalPositionArgType,
  verticalPositionArgType,
} from './axisStoryTemplates';

export default {
  title: 'React Spectrum Charts 2/Axis/Features',
  component: Axis,
  argTypes: verticalPositionArgType,
};

const Basic = bindWithProps(SessionsStory);
Basic.args = { position: 'left', grid: true, title: 'Sessions', numberFormat: 'shortNumber' };
Object.assign(Basic, controls());

const VerticalPosition = bindWithProps(SessionsStory);
VerticalPosition.args = { position: 'right', grid: true, title: 'Sessions', numberFormat: 'shortNumber' };
Object.assign(VerticalPosition, controls('position'));

const HorizontalPosition = bindWithProps(TimeAxisStory);
HorizontalPosition.args = { position: 'top', baseline: true, labelFormat: 'time', granularity: 'month' };
Object.assign(HorizontalPosition, controls('position'), { argTypes: horizontalPositionArgType });

const Title = bindWithProps(ConversionRateStory);
Title.args = {
  position: 'left',
  grid: true,
  labelFormat: 'percentage',
  title: ['Conversion rate', '(orders ÷ sessions)'],
};
Object.assign(Title, controls('title'));

const Grid = bindWithProps(SessionsStory);
Grid.args = { position: 'left', grid: true, title: 'Sessions', numberFormat: 'shortNumber' };
Object.assign(Grid, controls('grid'));

const Baseline = bindWithProps(BrowserBarStory);
Baseline.args = { position: 'bottom', baseline: true, title: 'Browser' };
Object.assign(Baseline, controls('baseline'));

// Draws the bottom baseline at the benchmark value of 100 instead of at the bottom of the chart.
const BaselineOffset = bindWithProps(BrandHealthStory);
BaselineOffset.args = {
  position: 'bottom',
  baseline: true,
  baselineOffset: 100,
  labelFormat: 'time',
  granularity: 'month',
};
Object.assign(BaselineOffset, controls('baselineOffset'));

const Ticks = bindWithProps(TimeAxisStory);
Ticks.args = { position: 'bottom', baseline: true, ticks: true, labelFormat: 'time', granularity: 'month' };
Object.assign(Ticks, controls('ticks'));

const Range = bindWithProps(ConversionRateStory);
Range.args = { position: 'left', grid: true, labelFormat: 'percentage', title: 'Conversion rate', range: [0, 0.08] };
Object.assign(Range, controls('range'));

export { Basic, VerticalPosition, HorizontalPosition, Title, Grid, Baseline, BaselineOffset, Ticks, Range };
