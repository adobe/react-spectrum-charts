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
  // `buildSpec`'s default resolves to the Spectrum 1 palette (a shared S2-wide gap, not Sankey-specific)
  // -- point this story at real Spectrum 2 tokens explicitly instead.
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
        {/* 14px matches DIRECT_LABEL_FONT_SIZE_S -- reuses Line's font-size option, not a Sankey-specific size. */}
        <Sankey fontSize={14} {...sankeyProps} />
      </Chart>
    );
  };
  return SankeyStory;
};

const SankeyStory = makeSankeyStory(basicSankeyData);

// shared by node and link inspects/popovers -- branches on datum shape since both layers share one set of children
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

// Right-click is just `rightClick` on the same ChartPopover every mark uses (see ChartPopover.story.tsx) --
// generic click/contextmenu wiring, no sankey-specific code needed. This proves it for both layers.
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

// Closest analog to the canonical Kibana/Elastic Sankey example -- one source column fanning into
// one destination column, no re-branching.
const TwoColumnFlow = bindWithProps(makeSankeyStory(twoColumnSankeyData));
TwoColumnFlow.args = {};

// Simplest possible Sankey: one unbranched path, narrowing step to step (100 -> 80 -> 60).
const SingleChain = bindWithProps(makeSankeyStory(singleChainSankeyData));
SingleChain.args = {};

// Clean 3-column flow (traffic source -> device -> outcome) that branches and merges at each step.
const ThreeColumnFlow = bindWithProps(makeSankeyStory(threeColumnSankeyData));
ThreeColumnFlow.args = {};

// Approximates Analysis Workspace's Flow visualization: a "*"-prefixed root node, comma-formatted
// counts under each name, and "+N more" long-tail nodes. Uses the built-in s2Categorical16 palette
// (next size up from the other stories' s2Categorical12).
const workspaceFlowColors: ChartProps['colors'] = 's2Categorical16';
const WorkspaceFlowExample = bindWithProps(makeSankeyStory(workspaceFlowSankeyData, workspaceFlowColors));
// Workspace grows its canvas to fit the data instead of a fixed height; <Chart> only supports fixed
// height, so 650px approximates the room Workspace would give this data.
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
