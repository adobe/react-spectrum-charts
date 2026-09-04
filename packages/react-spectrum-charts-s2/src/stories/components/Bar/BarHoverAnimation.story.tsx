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

/* eslint-disable react/prop-types -- story args are typed via StoryFn generics, not React propTypes */
import { ComponentProps, ReactElement } from 'react';

import { StoryFn } from '@storybook/react';

import { AnimationType, GROUP_DATA, MARK_ID } from '@spectrum-charts/constants';
import { ChartData, Datum, SpectrumColor } from '@spectrum-charts/vega-spec-builder-s2';

import { Chart } from '../../../Chart';
import { Axis, Bar, ChartInspect, ChartPopover, Legend } from '../../../components';
import useChartProps from '../../../hooks/useChartProps';
import { bindWithProps } from '../../../test-utils';
import { BarProps } from '../../../types';
import { barSeriesData, barSubSeriesData, generateMockDataForTrellis } from './data';

// ┌───────────────────────────┬──────────────────────────────────────────────────┬────────────────────────────────────────────────┐
// │           Story           │                      Trigger                      │                   Match rule                    │
// ├───────────────────────────┼──────────────────────────────────────────────────┼────────────────────────────────────────────────┤
// │      StackedPointHover     │       <ChartInspect> — hover a single segment     │ hoveredMatch (per-bar, not per-series/stack)    │
// ├───────────────────────────┼──────────────────────────────────────────────────┼────────────────────────────────────────────────┤
// │    StackedDimensionHover   │ <ChartInspect> — hover the dimension-hover-area   │ dimensionHoverMatch (drives axis-label hover too)│
// ├───────────────────────────┼──────────────────────────────────────────────────┼────────────────────────────────────────────────┤
// │      StackedLegendHover    │  <Legend highlight /> — hover a legend entry      │      injected legendHoverMatch (per series)     │
// ├───────────────────────────┼──────────────────────────────────────────────────┼────────────────────────────────────────────────┤
// │  StackedControlledHighlight│         highlightedSeries chart prop              │           controlledSeriesMatch (per series)    │
// ├───────────────────────────┼──────────────────────────────────────────────────┼────────────────────────────────────────────────┤
// │  StackedPopoverSelection   │     <ChartPopover> — click a bar to select        │             popoverMatch (per-bar)              │
// ├───────────────────────────┼──────────────────────────────────────────────────┼────────────────────────────────────────────────┤
// │ DodgedStackedPointHover    │ <ChartInspect> — hover one dual-facet segment      │ hoveredMatch (composite id includes both facets)│
// ├───────────────────────────┼──────────────────────────────────────────────────┼────────────────────────────────────────────────┤
// │ DodgedStackedLegendHover   │  <Legend highlight /> — hover a legend entry      │ legendHoverMatch (series aggregate across facets)│
// ├───────────────────────────┼──────────────────────────────────────────────────┼────────────────────────────────────────────────┤
// │      TrellisPointHover     │       <ChartInspect> — hover a single bar         │  hoveredMatch (per-bar, unique across trellis)  │
// └───────────────────────────┴──────────────────────────────────────────────────┴────────────────────────────────────────────────┘

/** Showcases the bar hover-animation system across every interaction that can emphasize a series. */
export default {
  title: 'React Spectrum Charts 2/Bar/Features/Hover Animation',
  component: Bar,
  argTypes: {
    animations: {
      control: 'boolean',
      description: 'Chart-level master kill switch for all animations.',
    },
    animationTypes: {
      control: { type: 'check' },
      options: ['hover'],
      description: "Which animation types are enabled (only 'hover' is relevant to this story group).",
    },
  },
  args: { animations: true, animationTypes: ['hover'] },
};

type HoverAnimationArgs = ComponentProps<typeof Bar> & { animations?: boolean; animationTypes?: AnimationType[] };

const colors: SpectrumColor[] = ['categorical-100', 'categorical-200', 'categorical-300', 'categorical-400'];

// Mirrors DodgedBar.story.tsx's `DodgedStacked` -- each primary facet (operatingSystem) gets its own
// pair of shades, one per secondary facet (version), rather than one flat palette across both facets.
const dualFacetColors: SpectrumColor[][] = [
  ['categorical-700', 'categorical-1000'],
  ['categorical-400', 'categorical-500'],
  ['categorical-300', 'categorical-1100'],
];

const defaultArgs: BarProps = {
  dimension: 'browser',
  order: 'order',
  color: 'operatingSystem',
};

const dialogContent = (datum: Datum): ReactElement => (
  <div>
    <div>Operating system: {datum.operatingSystem}</div>
    <div>Browser: {datum.browser}</div>
    <div>Downloads: {datum.value}</div>
  </div>
);

/** Per-segment breakdown for the dimension-area tooltip, mirroring `SharedBarStories.tsx`'s `DimensionAreaStory`. */
const dimensionAreaDialogContent = (datum: Datum): ReactElement => (
  <>
    <div style={{ fontWeight: 'bold' }}>{datum.browser} Downloads</div>
    {datum[GROUP_DATA]?.map((d) => (
      <div key={d[MARK_ID]}>
        {d.operatingSystem}: {d.value}
      </div>
    ))}
  </>
);

/** Point hover — hovering one segment/bar fades every other segment/bar independently, not the whole stack/group it's in. */
const createPointHoverStory = (data: ChartData[], storyColors: SpectrumColor[] | SpectrumColor[][]): StoryFn<HoverAnimationArgs> => {
  const PointHoverStory: StoryFn<HoverAnimationArgs> = ({ animations, animationTypes, ...args }): ReactElement => {
    const chartProps = useChartProps({
      data,
      colors: storyColors,
      width: 800,
      height: 600,
      animations,
      animationTypes,
    });
    return (
      <Chart {...chartProps}>
        <Axis position="bottom" baseline title="Browser" />
        <Axis position="left" grid title="Downloads" />
        <Bar {...args}>
          <ChartInspect>{dialogContent}</ChartInspect>
        </Bar>
        <Legend title="Operating system" />
      </Chart>
    );
  };
  return PointHoverStory;
};

const PointHoverStory = createPointHoverStory(barSeriesData, colors);
const DualFacetPointHoverStory = createPointHoverStory(barSubSeriesData, dualFacetColors);

/** Dimension-area hover — hovering the padding around a stack (or an axis label) fades every OTHER dimension value, independent of the per-bar hoveredMatch rule. The dimensionArea inspect is its own `<ChartInspect>` rendering the per-segment breakdown via `GROUP_DATA`, matching `SharedBarStories.tsx`'s `DimensionAreaStory` rather than reusing the item-level dialog. */
const StackedDimensionHoverStory: StoryFn<HoverAnimationArgs> = ({
  animations,
  animationTypes,
  ...args
}): ReactElement => {
  const chartProps = useChartProps({ data: barSeriesData, colors, width: 800, height: 600, animations, animationTypes });
  return (
    <Chart {...chartProps}>
      <Axis position="bottom" baseline title="Browser" />
      <Axis position="left" grid title="Downloads" />
      <Bar {...args}>
        <ChartInspect>{dialogContent}</ChartInspect>
        <ChartInspect targets={['dimensionArea']}>{dimensionAreaDialogContent}</ChartInspect>
      </Bar>
      <Legend title="Operating system" highlight />
    </Chart>
  );
};

/** Legend hover — hovering a legend entry emphasizes every bar of that series, across every stack/group. Shared by the single-facet and dual-facet variants (`data`/`color`/`colors` differ). */
const createLegendHoverStory = (
  data: ChartData[],
  storyColors: SpectrumColor[] | SpectrumColor[][]
): StoryFn<HoverAnimationArgs> => {
  const LegendHoverStory: StoryFn<HoverAnimationArgs> = ({ animations, animationTypes, ...args }): ReactElement => {
    const chartProps = useChartProps({
      data,
      colors: storyColors,
      width: 800,
      height: 600,
      animations,
      animationTypes,
    });
    return (
      <Chart {...chartProps}>
        <Axis position="bottom" baseline title="Browser" />
        <Axis position="left" grid title="Downloads" />
        <Bar {...args} />
        <Legend title="Operating system" highlight />
      </Chart>
    );
  };
  return LegendHoverStory;
};

const LegendHoverStory = createLegendHoverStory(barSeriesData, colors);
const DualFacetLegendHoverStory = createLegendHoverStory(barSubSeriesData, dualFacetColors);

/** Controlled highlight — an external `highlightedSeries` chart prop emphasizes a series (the `controlledSeriesMatch` rule). */
const StackedControlledHighlightStory: StoryFn<HoverAnimationArgs> = ({
  animations,
  animationTypes,
  ...args
}): ReactElement => {
  const chartProps = useChartProps({
    data: barSeriesData,
    colors,
    width: 800,
    height: 600,
    highlightedSeries: 'Windows',
    animations,
    animationTypes,
  });
  return (
    <Chart {...chartProps}>
      <Axis position="bottom" baseline title="Browser" />
      <Axis position="left" grid title="Downloads" />
      <Bar {...args} />
      <Legend title="Operating system" />
    </Chart>
  );
};

/** Popover selection — clicking a bar selects it (the `popoverMatch` rule) and keeps it emphasized per-bar, not per-series. */
const StackedPopoverSelectionStory: StoryFn<HoverAnimationArgs> = ({
  animations,
  animationTypes,
  ...args
}): ReactElement => {
  const chartProps = useChartProps({ data: barSeriesData, colors, width: 800, height: 600, animations, animationTypes });
  return (
    <Chart {...chartProps}>
      <Axis position="bottom" baseline title="Browser" />
      <Axis position="left" grid title="Downloads" />
      <Bar {...args}>
        <ChartInspect>{dialogContent}</ChartInspect>
        <ChartPopover width={200}>{dialogContent}</ChartPopover>
      </Bar>
      <Legend title="Operating system" />
    </Chart>
  );
};

/** Trellis variant — the same browser+operatingSystem bar can repeat across trellis panels, so the composite identity must include the trellis facet or animation would collide across panels. */
const TrellisPointHoverStory: StoryFn<HoverAnimationArgs> = ({ animations, animationTypes, ...args }): ReactElement => {
  const chartProps = useChartProps({
    data: generateMockDataForTrellis({
      property1: ['All users', 'Roku', 'Chromecast'],
      property2: ['A. Sign up', 'B. Watch a video'],
      property3: ['1-5 times', '6-10 times', '11-15 times'],
      propertyNames: ['segment', 'event', 'bucket'],
      randomizeSteps: false,
      orderBy: 'bucket',
    }),
    width: 800,
    height: 800,
    animations,
    animationTypes,
  });
  return (
    <Chart {...chartProps}>
      <Axis position="left" title="Users, Count" grid />
      <Axis position="bottom" title="Platform" baseline />
      <Bar {...args}>
        <ChartInspect>{dialogContent}</ChartInspect>
      </Bar>
      <Legend />
    </Chart>
  );
};

export const StackedPointHover = bindWithProps(PointHoverStory);
StackedPointHover.args = { ...defaultArgs };

export const StackedDimensionHover = bindWithProps(StackedDimensionHoverStory);
StackedDimensionHover.args = { ...defaultArgs };

export const StackedLegendHover = bindWithProps(LegendHoverStory);
StackedLegendHover.args = { ...defaultArgs };

export const StackedControlledHighlight = bindWithProps(StackedControlledHighlightStory);
StackedControlledHighlight.args = { ...defaultArgs };

export const StackedPopoverSelection = bindWithProps(StackedPopoverSelectionStory);
StackedPopoverSelection.args = { ...defaultArgs };

const dodgedStackedArgs: BarProps = {
  type: 'dodged',
  dimension: 'browser',
  color: ['operatingSystem', 'version'],
};

export const DodgedStackedPointHover = bindWithProps(DualFacetPointHoverStory);
DodgedStackedPointHover.args = { ...dodgedStackedArgs };

export const DodgedStackedLegendHover = bindWithProps(DualFacetLegendHoverStory);
DodgedStackedLegendHover.args = { ...dodgedStackedArgs };

export const TrellisPointHover = bindWithProps(TrellisPointHoverStory);
TrellisPointHover.args = {
  type: 'stacked',
  dimension: 'segment',
  color: 'bucket',
  order: 'order',
  trellis: 'event',
  trellisOrientation: 'horizontal',
};
