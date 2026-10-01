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

import { sequentialCerulean9 } from '@spectrum-charts/themes';
import { ChartColors } from '@spectrum-charts/vega-spec-builder-s2';

import { Chart } from '../../../Chart';
import { ChartInspect, ChartPopover, Legend } from '../../../components';
import useChartProps from '../../../hooks/useChartProps';
import { Donut, DonutSummary, SegmentLabel } from '../../../pre-alpha';
import {
  basicDonutData,
  surveyResponseDonutData,
  taskCompletionDonutData,
  zeroDonutData,
} from '../../../storyShared/Donut/data';
import { bindWithProps } from '../../../test-utils';
import { ChartProps, DonutProps } from '../../../types';

export default {
  title: 'React Spectrum Charts 2/Pre-Alpha/Donut/Features',
  component: Donut,
};

const defaultChartProps: ChartProps = { data: basicDonutData, width: 460, height: 350 };
const defaultArgs: DonutProps = { metric: 'count', color: 'browser' };

// darkest cerulean on strongest agreement; skips the near-white lightest steps
const surveyColors: ChartColors = [8, 6, 5, 4, 2].map((i) => sequentialCerulean9[i]);

const DonutStory: StoryFn<DonutProps> = (args): ReactElement => {
  const chartProps = useChartProps(defaultChartProps);
  return (
    <Chart {...chartProps}>
      <Donut {...args} />
      <Legend title="Browsers" position="right" highlight />
    </Chart>
  );
};

const EmptyStateStory: StoryFn<DonutProps> = (args): ReactElement => {
  const chartProps = useChartProps({ ...defaultChartProps, data: zeroDonutData });
  return (
    <Chart {...chartProps}>
      <Donut {...args} />
      <Legend title="Browsers" position="right" highlight />
    </Chart>
  );
};

// no Legend: the boolean track is not drawn from the color scale, so a legend would mislabel it
const CompletionStory: StoryFn<DonutProps> = (args): ReactElement => {
  const chartProps = useChartProps({ data: taskCompletionDonutData, width: 390, height: 300, colors: ['green-800'] });
  return (
    <Chart {...chartProps}>
      <Donut {...args}>
        <DonutSummary label="Completion" />
      </Donut>
    </Chart>
  );
};

const SemicircleStory: StoryFn<DonutProps> = (args): ReactElement => {
  const chartProps = useChartProps({ ...defaultChartProps, height: 260 });
  return (
    <Chart {...chartProps}>
      <Donut {...args}>
        <DonutSummary label="Visitors" numberFormat="shortNumber" />
      </Donut>
      <Legend title="Browsers" position="right" highlight />
    </Chart>
  );
};

const SurveyStory: StoryFn<DonutProps> = (args): ReactElement => {
  const chartProps = useChartProps({ data: surveyResponseDonutData, width: 460, height: 260, colors: surveyColors });
  return (
    <Chart {...chartProps}>
      <Donut {...args}>
        <DonutSummary label="Responses" />
      </Donut>
      <Legend title="Response" position="right" highlight />
    </Chart>
  );
};

const LabeledDonutStory: StoryFn<DonutProps> = (args): ReactElement => {
  const chartProps = useChartProps({ ...defaultChartProps, width: 560, height: 400 });
  return (
    <Chart {...chartProps}>
      <Donut {...args}>
        <SegmentLabel value valueFormat="shortNumber" />
      </Donut>
      <Legend title="Browsers" position="right" highlight />
    </Chart>
  );
};

const Basic = bindWithProps(DonutStory);
Basic.args = { ...defaultArgs };
Object.assign(Basic, { parameters: { controls: { include: [] } } });

// all metric values are 0, so the donut renders the empty state ring with 0 displayed in the center
const EmptyState = bindWithProps(EmptyStateStory);
EmptyState.args = {
  ...defaultArgs,
  holeRatio: 0.8,
  children: [<DonutSummary label="Visitors" key={0} />, <SegmentLabel percent value key={1} />],
};
Object.assign(EmptyState, { parameters: { controls: { include: [] } } });

const HoleRatio = bindWithProps(DonutStory);
HoleRatio.args = { ...defaultArgs, holeRatio: 0.5 };
Object.assign(HoleRatio, { parameters: { controls: { include: ['holeRatio'] } } });
Object.assign(HoleRatio, { argTypes: { holeRatio: { control: { type: 'range', min: 0, max: 0.95, step: 0.05 } } } });

// the first datum is shown as a percent in the summary and the second renders as the unfilled track
const IsBoolean = bindWithProps(CompletionStory);
IsBoolean.args = { metric: 'value', color: 'status', isBoolean: true };
Object.assign(IsBoolean, { parameters: { controls: { include: ['isBoolean'] } } });

const StartAngle = bindWithProps(DonutStory);
StartAngle.args = { ...defaultArgs, startAngle: Math.PI / 2 };
Object.assign(StartAngle, { parameters: { controls: { include: ['startAngle'] } } });
Object.assign(StartAngle, {
  argTypes: { startAngle: { control: { type: 'range', min: -Math.PI, max: Math.PI, step: Math.PI / 12 } } },
});

// semicircles sort by value by default; data order keeps the ordinal survey scale intact
const SortOrder = bindWithProps(SurveyStory);
SortOrder.args = { metric: 'count', color: 'response', variant: 'semicircle', sortOrder: 'data' };
Object.assign(SortOrder, { parameters: { controls: { include: ['sortOrder'] } } });

const Variant = bindWithProps(SemicircleStory);
Variant.args = { ...defaultArgs, variant: 'semicircle' };
Object.assign(Variant, { parameters: { controls: { include: ['variant'] } } });

const EmphasizedItems = bindWithProps(LabeledDonutStory);
EmphasizedItems.args = { ...defaultArgs, emphasizedItems: ['Chrome', 'Firefox'] };
Object.assign(EmphasizedItems, { parameters: { controls: { include: ['emphasizedItems'] } } });

const OtherItemColor = bindWithProps(LabeledDonutStory);
OtherItemColor.args = { ...defaultArgs, emphasizedItems: ['Chrome', 'Firefox'], otherItemColor: 'gray-300' };
Object.assign(OtherItemColor, { parameters: { controls: { include: ['otherItemColor'] } } });

const HideDeemphasizedLabels = bindWithProps(LabeledDonutStory);
HideDeemphasizedLabels.args = { ...defaultArgs, emphasizedItems: ['Chrome', 'Firefox'], hideDeemphasizedLabels: true };
Object.assign(HideDeemphasizedLabels, { parameters: { controls: { include: ['hideDeemphasizedLabels'] } } });

// default inspect content shows the swatch, series, and percent with value
const ChartInspectStory = bindWithProps(DonutStory);
ChartInspectStory.args = { ...defaultArgs, children: <ChartInspect /> };
Object.assign(ChartInspectStory, { parameters: { controls: { include: [] } } });

const ChartPopoverStory = bindWithProps(DonutStory);
ChartPopoverStory.args = { ...defaultArgs, children: <ChartPopover width="auto" /> };
Object.assign(ChartPopoverStory, { parameters: { controls: { include: [] } } });

export {
  Basic,
  EmptyState,
  HoleRatio,
  IsBoolean,
  StartAngle,
  SortOrder,
  Variant,
  EmphasizedItems,
  OtherItemColor,
  HideDeemphasizedLabels,
  ChartInspectStory as ChartInspect,
  ChartPopoverStory as ChartPopover,
};
