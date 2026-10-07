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
import { Axis, ChartInspect, Legend } from '../../../../components';
import useChartProps from '../../../../hooks/useChartProps';
import { Scatter, Trendline } from '../../../../pre-alpha';
import { bindWithProps } from '../../../../test-utils';
import { ChartProps, TrendlineProps } from '../../../../types';
import { characterData } from '../../../data/marioKartData';

export default {
  title: 'React Spectrum Charts 2/Pre-Alpha/Scatter/Features/Trendline',
  component: Trendline,
};

const defaultChartProps: ChartProps = { data: characterData, height: 450, width: 600 };

// flags the slowest light character so ExcludeDataKeys can leave it out of the fit
const flaggedCharacterData = characterData.map((datum) => ({
  ...datum,
  excludeFromTrend: datum.firstCharacter === 'Baby Peach',
}));

const trendlineInspectContent = (item: Datum) => (
  <div>
    <div>Trendline value: {Number(item[TRENDLINE_VALUE]).toFixed(2)}</div>
    <div>Handling (normal): {item.handlingNormal}</div>
  </div>
);

const TrendlineStory: StoryFn<TrendlineProps> = (args): ReactElement => {
  const chartProps = useChartProps(defaultChartProps);
  return (
    <Chart {...chartProps}>
      <Axis position="bottom" grid ticks baseline title="Speed (normal)" />
      <Axis position="left" grid ticks baseline title="Handling (normal)" />
      <Scatter color="weightClass" dimension="speedNormal" metric="handlingNormal">
        <Trendline {...args} />
      </Scatter>
      <Legend title="Weight class" highlight position="right" />
    </Chart>
  );
};

const FlaggedTrendlineStory: StoryFn<TrendlineProps> = (args): ReactElement => {
  const chartProps = useChartProps({ ...defaultChartProps, data: flaggedCharacterData });
  return (
    <Chart {...chartProps}>
      <Axis position="bottom" grid ticks baseline title="Speed (normal)" />
      <Axis position="left" grid ticks baseline title="Handling (normal)" />
      <Scatter color="weightClass" dimension="speedNormal" metric="handlingNormal">
        <Trendline {...args} />
      </Scatter>
      <Legend title="Weight class" highlight position="right" />
    </Chart>
  );
};

const TrendlineInspectStory: StoryFn<TrendlineProps> = (args): ReactElement => {
  const chartProps = useChartProps(defaultChartProps);
  return (
    <Chart {...chartProps}>
      <Axis position="bottom" grid ticks baseline title="Speed (normal)" />
      <Axis position="left" grid ticks baseline title="Handling (normal)" />
      <Scatter color="weightClass" dimension="speedNormal" metric="handlingNormal">
        <Trendline {...args}>
          <ChartInspect>{trendlineInspectContent}</ChartInspect>
        </Trendline>
      </Scatter>
      <Legend title="Weight class" highlight position="right" />
    </Chart>
  );
};

const Basic = bindWithProps(TrendlineStory);
Basic.args = {};
Object.assign(Basic, { parameters: { controls: { include: [] } } });

const Color = bindWithProps(TrendlineStory);
Color.args = { color: 'gray-700' };
Object.assign(Color, { parameters: { controls: { include: ['color'] } } });

const DimensionExtent = bindWithProps(TrendlineStory);
DimensionExtent.args = { dimensionExtent: ['domain', 'domain'] };
Object.assign(DimensionExtent, { parameters: { controls: { include: ['dimensionExtent'] } } });

const DimensionRange = bindWithProps(TrendlineStory);
DimensionRange.args = { dimensionRange: [2.5, 4.5] };
Object.assign(DimensionRange, { parameters: { controls: { include: ['dimensionRange'] } } });

const DisplayOnHover = bindWithProps(TrendlineStory);
DisplayOnHover.args = { displayOnHover: true };
Object.assign(DisplayOnHover, { parameters: { controls: { include: ['displayOnHover'] } } });

const ExcludeDataKeys = bindWithProps(FlaggedTrendlineStory);
ExcludeDataKeys.args = { excludeDataKeys: ['excludeFromTrend'] };
Object.assign(ExcludeDataKeys, { parameters: { controls: { include: ['excludeDataKeys'] } } });

// only applies to moving-average methods
const HidePartialWindows = bindWithProps(TrendlineStory);
HidePartialWindows.args = { method: 'movingAverage-3', hidePartialWindows: true };
Object.assign(HidePartialWindows, { parameters: { controls: { include: ['hidePartialWindows'] } } });

// needs a ChartInspect on the trendline to have a hovered point to highlight
const HighlightRawPoint = bindWithProps(TrendlineInspectStory);
HighlightRawPoint.args = { highlightRawPoint: true };
Object.assign(HighlightRawPoint, { parameters: { controls: { include: ['highlightRawPoint'] } } });

const LineType = bindWithProps(TrendlineStory);
LineType.args = { lineType: 'dotted' };
Object.assign(LineType, { parameters: { controls: { include: ['lineType'] } } });

const LineWidth = bindWithProps(TrendlineStory);
LineWidth.args = { lineWidth: 'L' };
Object.assign(LineWidth, { parameters: { controls: { include: ['lineWidth'] } } });

const Method = bindWithProps(TrendlineStory);
Method.args = { method: 'quadratic' };
Object.assign(Method, { parameters: { controls: { include: ['method'] } } });
Object.assign(Method, {
  argTypes: {
    method: {
      control: 'select',
      options: ['linear', 'quadratic', 'exponential', 'logarithmic', 'power', 'average', 'median', 'movingAverage-3'],
    },
  },
});

const Opacity = bindWithProps(TrendlineStory);
Opacity.args = { opacity: 0.4 };
Object.assign(Opacity, { parameters: { controls: { include: ['opacity'] } } });

const Orientation = bindWithProps(TrendlineStory);
Orientation.args = { orientation: 'vertical' };
Object.assign(Orientation, { parameters: { controls: { include: ['orientation'] } } });

const ChartInspectStory = bindWithProps(TrendlineInspectStory);
ChartInspectStory.args = {};
Object.assign(ChartInspectStory, { parameters: { controls: { include: [] } } });

export {
  Basic,
  Color,
  DimensionExtent,
  DimensionRange,
  DisplayOnHover,
  ExcludeDataKeys,
  HidePartialWindows,
  HighlightRawPoint,
  LineType,
  LineWidth,
  Method,
  Opacity,
  Orientation,
  ChartInspectStory as ChartInspect,
};
