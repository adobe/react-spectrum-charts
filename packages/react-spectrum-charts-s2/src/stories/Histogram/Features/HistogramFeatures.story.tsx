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
import { ReactElement, useState } from 'react';

import { StoryFn } from '@storybook/react';

import { ActionButton } from '@react-spectrum/s2';
import {
  Datum,
  HistogramCellColors,
  HistogramDrawInEffect,
  HistogramLayout,
} from '@spectrum-charts/vega-spec-builder-s2';

import { Chart } from '../../../Chart.js';
import { Axis, ChartInspect, ChartPopover, Legend } from '../../../components/index.js';
import useChartProps from '../../../hooks/useChartProps.js';
import { Histogram } from '../../../lab/index.js';
import { customerAgeBands, customerAgeData, responseTimeData } from '../../../storyShared/Histogram/data.js';
import { bindWithProps } from '../../../test-utils/index.js';
import { AxisProps, ChartProps, HistogramProps } from '../../../types/index.js';

export default {
  title: 'React Spectrum Charts 2/Lab/Histogram/Features',
  tags: ['lab'],
  component: Histogram,
};

const defaultChartProps: ChartProps = { data: responseTimeData, height: 400, width: 600 };
const defaultArgs: HistogramProps = { metric: 'responseTime' };

const layoutOptions: HistogramLayout[] = ['stacked', 'overlaid', 'dodged'];
const drawInEffectArgType = { control: 'inline-radio', options: ['grow', 'sweep', 'fade'] };
const cellColorOptions: HistogramCellColors[] = [
  'sequentialCerulean9',
  'sequentialMagma9',
  'sequentialViridis9',
  'sequentialForest9',
  'sequentialRose9',
];

interface HistogramStoryOptions {
  chartProps?: Partial<ChartProps>;
  bottomTitle?: string;
  bottomAxis?: Omit<AxisProps, 'position'>;
  leftAxis?: Omit<AxisProps, 'position'>;
  legendTitle?: string;
}

/**
 * Creates a histogram story template with bottom and left axes and an optional legend.
 * @param options
 * @returns StoryFn<HistogramProps>
 */
const createStory = ({
  chartProps: overrides,
  bottomTitle,
  bottomAxis = { baseline: true, ticks: true },
  leftAxis = { grid: true },
  legendTitle,
}: HistogramStoryOptions) => {
  const HistogramStory: StoryFn<HistogramProps> = (args): ReactElement => {
    const chartProps = useChartProps({ ...defaultChartProps, ...overrides });
    return (
      // remounting on a new draw-in effect replays the animation
      <Chart key={args.drawInEffect} {...chartProps}>
        <Axis position="bottom" title={bottomTitle} {...bottomAxis} />
        <Axis position="left" {...leftAxis} />
        <Histogram {...args} />
        {legendTitle ? <Legend position="right" title={legendTitle} /> : null}
      </Chart>
    );
  };
  return HistogramStory;
};

const ResponseTimeStory = createStory({ bottomTitle: 'Response time (ms)' });
const RegionStory = createStory({ bottomTitle: 'Response time (ms)', legendTitle: 'Region' });
const PercentStory = createStory({
  bottomTitle: 'Response time (ms)',
  leftAxis: { grid: true, labelFormat: 'percentage' },
});
const TwoDimensionalStory = createStory({
  bottomTitle: 'Response time (ms)',
  leftAxis: { grid: true, title: 'Payload (KB)' },
});
const AgeDensityStory = createStory({ chartProps: { data: customerAgeData }, bottomTitle: 'Customer age' });
const AgeStory = createStory({
  chartProps: { data: customerAgeData },
  bottomTitle: 'Customer age',
  leftAxis: { grid: true, labelFormat: 'percentage' },
});
// horizontal bins run up the left axis, so the count axis is at the bottom
const HorizontalStory = createStory({
  bottomAxis: { baseline: true, grid: true },
  leftAxis: { ticks: true, title: 'Response time (ms)' },
  legendTitle: 'Region',
});

const binContent = (datum: Datum) => (
  <div>
    {datum.binStart}–{datum.binEnd} ms: {datum.count} requests
  </div>
);

const Basic = bindWithProps(ResponseTimeStory);
Basic.args = { ...defaultArgs };
Object.assign(Basic, { parameters: { controls: { include: [] } } });

const BinCount = bindWithProps(ResponseTimeStory);
BinCount.args = { ...defaultArgs, binCount: 30 };
Object.assign(BinCount, { parameters: { controls: { include: ['binCount'] } } });

const BinSize = bindWithProps(ResponseTimeStory);
BinSize.args = { ...defaultArgs, binSize: 25 };
Object.assign(BinSize, { parameters: { controls: { include: ['binSize'] } } });

// bins start on 75, 175, 275 and so on instead of round hundreds
const BinAnchor = bindWithProps(ResponseTimeStory);
BinAnchor.args = { ...defaultArgs, binSize: 100, binAnchor: 75 };
Object.assign(BinAnchor, { parameters: { controls: { include: ['binAnchor', 'binSize'] } } });

// requests slower than 800 ms fall outside the extent and are left out
const Extent = bindWithProps(ResponseTimeStory);
Extent.args = { ...defaultArgs, extent: [0, 800], binSize: 50 };
Object.assign(Extent, { parameters: { controls: { include: ['extent'] } } });

const BinEdges = bindWithProps(AgeStory);
BinEdges.args = { metric: 'age', binEdges: customerAgeBands, yValue: 'percent' };
Object.assign(BinEdges, { parameters: { controls: { include: ['binEdges'] } } });

// bar heights are the total payload of the requests in each bin
const Weight = bindWithProps(ResponseTimeStory);
Weight.args = { ...defaultArgs, weight: 'payloadKb', binSize: 50 };
Object.assign(Weight, {
  parameters: { controls: { include: ['weight'] } },
  argTypes: { weight: { control: 'select', options: [undefined, 'payloadKb'] } },
});

const Color = bindWithProps(RegionStory);
Color.args = { ...defaultArgs, color: 'region', binSize: 50 };
Object.assign(Color, { parameters: { controls: { include: [] } } });

const Layout = bindWithProps(RegionStory);
Layout.args = { ...defaultArgs, color: 'region', layout: 'overlaid', binSize: 50 };
Object.assign(Layout, {
  parameters: { controls: { include: ['layout'] } },
  argTypes: { layout: { control: 'radio', options: layoutOptions } },
});

const Dodged = bindWithProps(RegionStory);
Dodged.args = {
  ...defaultArgs,
  color: 'region',
  layout: 'dodged',
  binSize: 100,
  extent: [0, 1000],
  drawInEffect: 'grow',
};
Object.assign(Dodged, {
  parameters: { controls: { include: ['layout', 'drawInEffect'] } },
  argTypes: { layout: { control: 'radio', options: layoutOptions }, drawInEffect: drawInEffectArgType },
});

const Horizontal = bindWithProps(HorizontalStory);
Horizontal.args = {
  ...defaultArgs,
  orientation: 'horizontal',
  color: 'region',
  binSize: 50,
  extent: [0, 1000],
  drawInEffect: 'grow',
};
Object.assign(Horizontal, {
  parameters: { controls: { include: ['orientation', 'layout', 'drawInEffect'] } },
  argTypes: {
    orientation: { control: 'inline-radio', options: ['vertical', 'horizontal'] },
    layout: { control: 'radio', options: layoutOptions },
    drawInEffect: drawInEffectArgType,
  },
});

const Percent = bindWithProps(PercentStory);
Percent.args = { ...defaultArgs, yValue: 'percent' };
Object.assign(Percent, { parameters: { controls: { include: [] } } });

// density divides each bin's share by its width, so uneven bins stay comparable
const Density = bindWithProps(AgeDensityStory);
Density.args = { metric: 'age', binEdges: customerAgeBands, yValue: 'density' };
Object.assign(Density, { parameters: { controls: { include: [] } } });

const DensityCurve = bindWithProps(AgeDensityStory);
DensityCurve.args = { metric: 'age', binSize: 4, densityCurve: true };
Object.assign(DensityCurve, {
  parameters: { controls: { include: ['densityCurve', 'yValue', 'cumulative'] } },
  argTypes: { yValue: { control: 'inline-radio', options: ['count', 'percent', 'density'] } },
});

const Cumulative = bindWithProps(PercentStory);
Cumulative.args = { ...defaultArgs, cumulative: true, yValue: 'percent', binSize: 50 };
Object.assign(Cumulative, { parameters: { controls: { include: ['cumulative'] } } });

const TwoDimensional = bindWithProps(TwoDimensionalStory);
TwoDimensional.args = { ...defaultArgs, yMetric: 'payloadKb', binSize: 50, yBinSize: 10, drawInEffect: 'grow' };
Object.assign(TwoDimensional, {
  argTypes: { drawInEffect: drawInEffectArgType },
  parameters: { controls: { include: ['yBinSize', 'yBinCount', 'yExtent', 'drawInEffect'] } },
});

const CellColors = bindWithProps(TwoDimensionalStory);
CellColors.args = {
  ...defaultArgs,
  yMetric: 'payloadKb',
  binSize: 50,
  yBinSize: 10,
  cellColors: 'sequentialMagma9',
  cellLegend: true,
  cellLegendTitle: 'Requests',
};
Object.assign(CellColors, {
  argTypes: { cellColors: { control: 'select', options: cellColorOptions } },
  parameters: { controls: { include: ['cellColors', 'cellLegend', 'cellLegendTitle'] } },
});

const Tooltip = bindWithProps(ResponseTimeStory);
Tooltip.args = { ...defaultArgs, binSize: 50, children: <ChartInspect>{binContent}</ChartInspect> };
Object.assign(Tooltip, { parameters: { controls: { include: [] } } });

const ChartPopoverStory = bindWithProps(ResponseTimeStory);
ChartPopoverStory.args = {
  ...defaultArgs,
  binSize: 50,
  children: <ChartPopover width="auto">{binContent}</ChartPopover>,
};
Object.assign(ChartPopoverStory, { parameters: { controls: { include: [] } } });

const animationCharts: { effect: HistogramDrawInEffect; twoDimensional?: boolean }[] = [
  { effect: 'grow' },
  { effect: 'sweep' },
  { effect: 'fade' },
  { effect: 'grow', twoDimensional: true },
];

/** One small chart per draw-in effect, remounted together by Replay. */
const AnimationChart = ({ effect, twoDimensional }: { effect: HistogramDrawInEffect; twoDimensional?: boolean }) => {
  const chartProps = useChartProps({ data: responseTimeData, height: 260, width: 380 });
  return (
    <Chart {...chartProps}>
      <Axis position="bottom" baseline ticks title="Response time (ms)" />
      <Axis position="left" grid title={twoDimensional ? 'Payload (KB)' : undefined} />
      <Histogram
        metric="responseTime"
        binSize={50}
        drawInEffect={effect}
        {...(twoDimensional ? { yMetric: 'payloadKb', yBinSize: 10 } : {})}
      />
    </Chart>
  );
};

const AnimationsStory: StoryFn<HistogramProps> = (): ReactElement => {
  const [run, setRun] = useState(0);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'flex-start' }}>
      <ActionButton onPress={() => setRun((count) => count + 1)}>Replay</ActionButton>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 380px)', gap: 24 }}>
        {animationCharts.map(({ effect, twoDimensional }) => (
          <figure key={`${effect}-${twoDimensional ? '2d' : '1d'}-${run}`} style={{ margin: 0 }}>
            <figcaption style={{ fontFamily: 'sans-serif', marginBlockEnd: 8 }}>
              <code>{`drawInEffect="${effect}"`}</code> {twoDimensional ? '(2D)' : ''}
            </figcaption>
            <AnimationChart effect={effect} twoDimensional={twoDimensional} />
          </figure>
        ))}
      </div>
    </div>
  );
};

// draw-in plays on mount, so Replay remounts every chart
const Animations = bindWithProps(AnimationsStory);
Animations.args = {};
Object.assign(Animations, { parameters: { controls: { include: [] } } });

export {
  Basic,
  Horizontal,
  BinCount,
  BinSize,
  BinAnchor,
  Extent,
  BinEdges,
  Weight,
  Color,
  Layout,
  Dodged,
  Percent,
  Density,
  DensityCurve,
  Cumulative,
  TwoDimensional,
  CellColors,
  Tooltip,
  ChartPopoverStory as ChartPopover,
  Animations,
};
