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

import { ChartColors, Datum } from '@spectrum-charts/vega-spec-builder-s2';

import { Chart } from '../../../Chart.js';
import { Axis, ChartInspect, ChartPopover, Legend } from '../../../components/index.js';
import useChartProps from '../../../hooks/useChartProps.js';
import { Scatter } from '../../../pre-alpha/index.js';
import { bindWithProps } from '../../../test-utils/index.js';
import { ChartProps, ScatterProps } from '../../../types/index.js';
import { characterData, overlappingPointsData } from '../../data/marioKartData.js';
import { releaseBugReportsData } from '../scatterData.js';

export default {
  title: 'React Spectrum Charts 2/Pre-Alpha/Scatter/Features',
  component: Scatter,
};

const defaultChartProps: ChartProps = { data: characterData, height: 450, width: 600 };
const defaultArgs: ScatterProps = { dimension: 'speedNormal', metric: 'handlingNormal', color: 'weightClass' };

const ScatterStory: StoryFn<ScatterProps> = (args): ReactElement => {
  const chartProps = useChartProps(defaultChartProps);
  return (
    <Chart {...chartProps}>
      <Axis position="bottom" grid ticks baseline title="Speed (normal)" />
      <Axis position="left" grid ticks baseline title="Handling (normal)" />
      <Scatter {...args} />
      <Legend highlight position="right" title="Weight class" />
    </Chart>
  );
};

const OverlappingStory: StoryFn<ScatterProps> = (args): ReactElement => {
  const chartProps = useChartProps({ ...defaultChartProps, data: overlappingPointsData });
  return (
    <Chart {...chartProps}>
      <Axis position="bottom" grid ticks baseline title="Speed (normal)" />
      <Axis position="left" grid ticks baseline title="Handling (normal)" />
      <Scatter {...args} />
      <Legend highlight position="right" title="Weight class" />
    </Chart>
  );
};

// the left axis range cuts off the top points, which clip then hides at the plot edge
const ClipStory: StoryFn<ScatterProps> = (args): ReactElement => {
  const chartProps = useChartProps(defaultChartProps);
  return (
    <Chart {...chartProps}>
      <Axis position="bottom" grid ticks baseline title="Speed (normal)" />
      <Axis position="left" grid ticks baseline title="Handling (normal)" range={[0, 4.5]} />
      <Scatter {...args} />
      <Legend highlight position="right" title="Weight class" />
    </Chart>
  );
};

const WeightStory: StoryFn<ScatterProps> = (args): ReactElement => {
  const colors: ChartColors = args.colorScaleType === 'linear' ? 'sequentialViridis5' : 'categorical16';
  const chartProps = useChartProps({ ...defaultChartProps, colors });
  return (
    <Chart {...chartProps}>
      <Axis position="bottom" grid ticks baseline title="Speed (normal)" />
      <Axis position="left" grid ticks baseline title="Handling (normal)" />
      <Scatter {...args} />
      <Legend position="right" title="Weight" />
    </Chart>
  );
};

const ReleaseStory: StoryFn<ScatterProps> = (args): ReactElement => {
  const chartProps = useChartProps({ ...defaultChartProps, data: releaseBugReportsData });
  return (
    <Chart {...chartProps}>
      <Axis position="bottom" grid ticks baseline labelFormat="time" title="Release date" />
      <Axis position="left" grid ticks baseline title="Bug reports (first week)" />
      <Scatter {...args} />
      <Legend highlight position="right" title="Platform" />
    </Chart>
  );
};

const characterDialogContent = (datum: Datum) => (
  <div>
    <div>{(datum.character as string[]).join(', ')}</div>
    <div>Speed (normal): {datum.speedNormal}</div>
    <div>Handling (normal): {datum.handlingNormal}</div>
  </div>
);

const Basic = bindWithProps(ScatterStory);
Basic.args = { ...defaultArgs };
Object.assign(Basic, { parameters: { controls: { include: [] } } });

// light mode multiplies overlapping points by default; normal draws each point opaquely on top
const Blend = bindWithProps(OverlappingStory);
Blend.args = { ...defaultArgs, blend: 'normal' };
Object.assign(Blend, { parameters: { controls: { include: ['blend'] } } });
Object.assign(Blend, {
  argTypes: { blend: { control: 'select', options: ['normal', 'multiply', 'screen', 'darken'] } },
});

const Clip = bindWithProps(ClipStory);
Clip.args = { ...defaultArgs, clip: true };
Object.assign(Clip, { parameters: { controls: { include: ['clip'] } } });

const ColorScaleType = bindWithProps(WeightStory);
ColorScaleType.args = { ...defaultArgs, color: 'weight', colorScaleType: 'linear' };
Object.assign(ColorScaleType, { parameters: { controls: { include: ['colorScaleType'] } } });

const DimensionScaleType = bindWithProps(ReleaseStory);
DimensionScaleType.args = {
  dimension: 'datetime',
  metric: 'bugReports',
  color: 'platform',
  dimensionScaleType: 'time',
};
Object.assign(DimensionScaleType, { parameters: { controls: { include: ['dimensionScaleType'] } } });

// scatter points have no outline by default, so lineWidth is needed to see the line type
const LineType = bindWithProps(ScatterStory);
LineType.args = { ...defaultArgs, lineType: { value: 'dotted' }, lineWidth: { value: 'S' }, opacity: { value: 0.6 } };
Object.assign(LineType, { parameters: { controls: { include: ['lineType'] } } });

const LineWidth = bindWithProps(ScatterStory);
LineWidth.args = { ...defaultArgs, lineWidth: { value: 'M' }, opacity: { value: 0.6 } };
Object.assign(LineWidth, { parameters: { controls: { include: ['lineWidth'] } } });

const Opacity = bindWithProps(ScatterStory);
Opacity.args = { ...defaultArgs, opacity: { value: 0.5 } };
Object.assign(Opacity, { parameters: { controls: { include: ['opacity'] } } });

const Size = bindWithProps(ScatterStory);
Size.args = { ...defaultArgs, size: 'weight' };
Object.assign(Size, { parameters: { controls: { include: ['size'] } } });

// scatter points have no outline by default, so lineWidth is needed to see the stroke
const Stroke = bindWithProps(ScatterStory);
Stroke.args = { ...defaultArgs, stroke: { value: 'gray-900' }, lineWidth: { value: 'S' } };
Object.assign(Stroke, { parameters: { controls: { include: ['stroke'] } } });

const ChartInspectStory = bindWithProps(ScatterStory);
ChartInspectStory.args = { ...defaultArgs, children: <ChartInspect>{characterDialogContent}</ChartInspect> };
Object.assign(ChartInspectStory, { parameters: { controls: { include: [] } } });

const ChartPopoverStory = bindWithProps(ScatterStory);
ChartPopoverStory.args = {
  ...defaultArgs,
  children: <ChartPopover width="auto">{characterDialogContent}</ChartPopover>,
};
Object.assign(ChartPopoverStory, { parameters: { controls: { include: [] } } });

export {
  Basic,
  Blend,
  Clip,
  ColorScaleType,
  DimensionScaleType,
  LineType,
  LineWidth,
  Opacity,
  Size,
  Stroke,
  ChartInspectStory as ChartInspect,
  ChartPopoverStory as ChartPopover,
};
