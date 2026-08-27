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

import { Datum } from '@spectrum-charts/vega-spec-builder-s2';

import { Chart } from '../../../Chart';
import { ChartInspect, ChartPopover } from '../../../components';
import useChartProps from '../../../hooks/useChartProps';
import { Sankey } from '../../../pre-alpha';
import { bindWithProps } from '../../../test-utils';
import { ChartProps, SankeyProps } from '../../../types';
import {
  basicSankeyData,
  singleChainSankeyData,
  threeColumnSankeyData,
  twoColumnSankeyData,
  workspaceFlowSankeyData,
} from './data';

export default {
  title: 'React Spectrum Charts 2/Pre-Alpha/Sankey/Features',
  component: Sankey,
};

const defaultChartProps: ChartProps = {
  data: basicSankeyData,
  width: 500,
  height: 350,
  // `buildSpec`'s own default (`'categorical12'`) resolves to the Spectrum *1* categorical palette
  // (see packages/themes/src/categoricalColorPalette.ts) -- every S2 mark shares that default today
  // (e.g. Donut's own stories don't override it either), so this isn't a Sankey-specific issue, but
  // it's worth pointing this story at the real Spectrum 2 tokens explicitly rather than reproducing it.
  colors: 's2Categorical12',
};

// factory so each story can point at its own dataset (and, optionally, its own color scale) while
// sharing the same chart shell/args wiring
const makeSankeyStory = (
  data: ChartProps['data'],
  colors?: ChartProps['colors']
): StoryFn<SankeyProps & { width?: number; height?: number }> => {
  const SankeyStory: StoryFn<SankeyProps & { width?: number; height?: number }> = (args): ReactElement => {
    const { width, height, ...sankeyProps } = args;
    const chartProps = useChartProps({
      ...defaultChartProps,
      ...(colors ? { colors } : {}),
      data,
      width: width ?? 500,
      height: height ?? 350,
    });
    return (
      <Chart {...chartProps}>
        {/* 14px matches DIRECT_LABEL_FONT_SIZE_S -- reusing Line's direct-label font-size option
            (getDirectLabelFontSizeProductionRule) rather than a Sankey-specific size. */}
        <Sankey fontSize={14} {...sankeyProps} />
      </Chart>
    );
  };
  return SankeyStory;
};

const SankeyStory = makeSankeyStory(basicSankeyData);

// content shared by the node and link inspects/popovers -- branches on the datum shape since both
// layers share a single set of interactive children (see sankeySpecBuilder.ts for why)
const dialogContent = (datum: Datum) => {
  if ('sourceId' in datum) {
    return (
      <div>
        <div>
          {String(datum.sourceId)} → {String(datum.targetId)}
        </div>
        <div>Value: {String(datum.value)}</div>
      </div>
    );
  }
  return (
    <div>
      <div>{String(datum.id)}</div>
      <div>Value: {String(datum.value)}</div>
    </div>
  );
};

const interactiveChildren = [
  <ChartInspect key={0}>{dialogContent}</ChartInspect>,
  <ChartPopover width="auto" key={1}>
    {dialogContent}
  </ChartPopover>,
];

// Right-click is just the `rightClick` prop on the same ChartPopover every other mark uses (see
// ChartPopover.story.tsx's own `RightClick` story) -- the click/contextmenu event wiring lives in
// useNewChartView.tsx/usePopovers.tsx, both generic over any mark's children, so Sankey gets it for
// free with no sankey-specific code. This story only proves that's true for both node and link marks.
const rightClickChildren = [
  <ChartPopover width="auto" rightClick key={0}>
    {dialogContent}
  </ChartPopover>,
];

const Basic = bindWithProps(SankeyStory);
Basic.args = {};

const NodeAndLinkInspect = bindWithProps(SankeyStory);
NodeAndLinkInspect.args = {
  children: interactiveChildren,
};

const RightClickInspect = bindWithProps(SankeyStory);
RightClickInspect.args = {
  children: rightClickChildren,
};

// Closest analog to the canonical Kibana/Elastic Sankey example -- a single source column fanning
// out into a single destination column, no re-branching. Good first story to look at.
const TwoColumnFlow = bindWithProps(makeSankeyStory(twoColumnSankeyData));
TwoColumnFlow.args = {};

// The simplest possible Sankey: one unbranched path, so it renders as a single band that narrows
// step to step (100 -> 80 -> 60) with nothing else in any column competing for space.
const SingleChain = bindWithProps(makeSankeyStory(singleChainSankeyData));
SingleChain.args = {};

// A clean 3-column flow (traffic source -> device -> outcome) where every column has multiple
// nodes, so it branches and merges at each step rather than narrowing to a single node anywhere.
const ThreeColumnFlow = bindWithProps(makeSankeyStory(threeColumnSankeyData));
ThreeColumnFlow.args = {};

// Approximates Analysis Workspace's own Flow visualization look: a "*"-prefixed root node, large
// comma-formatted path-view counts under each node name, and "+N more" long-tail aggregate nodes.
// Wider/taller than the other stories since Workspace's real node names run long. Uses the built-in
// s2Categorical16 palette (a real, designed S2 palette, like the shared s2Categorical12 the other
// stories use, just the next size up) rather than a hand-picked set of individual hue tokens.
const workspaceFlowColors: ChartProps['colors'] = 's2Categorical16';
const WorkspaceFlowExample = bindWithProps(makeSankeyStory(workspaceFlowSankeyData, workspaceFlowColors));
// Workspace's own Flow chart doesn't fit its data into a fixed height -- it grows the canvas to fit
// the data and lets the outer viewport scroll instead (CloudViz.js's `_measureChart`/`_sizeChart`).
// RSC's <Chart> only supports a fixed height, so 650px is an approximation of the room Workspace
// would actually give this data, rather than the tighter 450px used by the other stories.
WorkspaceFlowExample.args = { width: 900, height: 650 };

export {
  Basic,
  NodeAndLinkInspect,
  RightClickInspect,
  SingleChain,
  ThreeColumnFlow,
  TwoColumnFlow,
  WorkspaceFlowExample,
};
