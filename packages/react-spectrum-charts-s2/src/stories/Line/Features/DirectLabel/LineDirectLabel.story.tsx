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

import { CHART_SIZE_BREAKPOINTS } from '@spectrum-charts/constants';

import { Chart } from '../../../../Chart';
import { Axis, ChartInspect, Legend, Line, LineDirectLabel } from '../../../../components';
import useChartProps from '../../../../hooks/useChartProps';
import { workspaceTrendsData } from '../../../../stories/data/data';
import { CHART_SIZE_THRESHOLDS, ResizableChart } from '../../../../stories/storyUtils';
import { bindWithProps } from '../../../../test-utils';
import { ChartProps } from '../../../../types';

// Same as workspaceTrendsData but with "Add Line viz" adjusted to end at the same
// y position as "Add Bar viz" (users ~3500 vs 3493), so its line terminates behind
// the "Add Bar viz" label — a targeted test for highlight foreground behavior.
const labelCollisionData = workspaceTrendsData.map((d) =>
  d.series === 'Add Line viz' && d.datetime === 1668409200000 ? { ...d, users: 3500 } : d
);

export default {
  title: 'React Spectrum Charts 2/Line/Features/Direct Label',
  component: LineDirectLabel,
  argTypes: {
    value: {
      control: { type: 'select' },
      options: ['last', 'average', 'series'],
    },
    position: {
      control: { type: 'select' },
      options: ['start', 'end'],
    },
    fontSize: { control: { type: 'number' } },
  },
};

const defaultChartProps: ChartProps = { data: workspaceTrendsData, minWidth: 100, maxWidth: 1000, height: 400, backgroundColor: 'gray-50' };

// TEMPLATES

const LineDirectLabelStory: StoryFn<typeof LineDirectLabel> = (args): ReactElement => {
  const chartProps = useChartProps(defaultChartProps);
  return (
    <Chart {...chartProps} debug>
      <Axis position="left" grid title="Users" />
      <Axis position="bottom" labelFormat="time" baseline ticks />
      <Line dimension="datetime" metric="users" color="series" scaleType="time">
        <LineDirectLabel {...args} />
      </Line>
      <Legend highlight />
    </Chart>
  );
};

const LineDirectLabelWithInspectStory: StoryFn<typeof LineDirectLabel> = (args): ReactElement => {
  const chartProps = useChartProps(defaultChartProps);
  return (
    <Chart {...chartProps} debug>
      <Axis position="left" grid title="Users" />
      <Axis position="bottom" labelFormat="time" baseline ticks />
      <Line dimension="datetime" metric="users" color="series" scaleType="time">
        <LineDirectLabel {...args} />
        <ChartInspect>{(datum: Record<string, string>) => <div>{datum.users}</div>}</ChartInspect>
      </Line>
      <Legend highlight />
    </Chart>
  );
};

const LineDirectLabelControlledHighlightStory: StoryFn<typeof LineDirectLabel> = (args): ReactElement => {
  const chartProps = useChartProps({ ...defaultChartProps, highlightedSeries: 'Add Freeform table' });
  return (
    <Chart {...chartProps} debug>
      <Axis position="left" grid title="Users" />
      <Axis position="bottom" labelFormat="time" baseline ticks />
      <Line dimension="datetime" metric="users" color="series" scaleType="time">
        <LineDirectLabel {...args} />
        <ChartInspect>{(datum: Record<string, string>) => <div>{datum.users}</div>}</ChartInspect>
      </Line>
      <Legend highlight />
    </Chart>
  );
};

const LineDirectLabelLabelCollisionStory: StoryFn<typeof LineDirectLabel> = (args): ReactElement => {
  const chartProps = useChartProps({ ...defaultChartProps, data: labelCollisionData });
  return (
    <Chart {...chartProps} debug>
      <Axis position="left" grid title="Users" />
      <Axis position="bottom" labelFormat="time" baseline ticks />
      <Line dimension="datetime" metric="users" color="series" scaleType="time">
        <LineDirectLabel {...args} />
        <ChartInspect>{(datum: Record<string, string>) => <div>{datum.users}</div>}</ChartInspect>
      </Line>
      <Legend highlight />
    </Chart>
  );
};

const DirectLabelSizeScalingStory: StoryFn<typeof LineDirectLabel> = (args): ReactElement => {
  const chartProps = useChartProps(defaultChartProps);
  return (
    <ResizableChart
      chartHeight={400}
      thresholds={CHART_SIZE_THRESHOLDS}
      renderLabel={(width) => {
        let currentSize = 'L';
        if (width < CHART_SIZE_BREAKPOINTS.M) currentSize = 'S';
        else if (width < CHART_SIZE_BREAKPOINTS.L) currentSize = 'M';
        return <>Width: <strong>{Math.round(width)}px</strong> — Size tier: <strong>{currentSize}</strong></>;
      }}
    >
      <Chart {...chartProps} data={workspaceTrendsData} width="auto" height={400} debug>
        <Axis position="left" grid title="Users" />
        <Axis position="bottom" labelFormat="time" baseline ticks />
        <Line dimension="datetime" metric="users" color="series" scaleType="time">
          <LineDirectLabel value="series" {...args} />
        </Line>
        <Legend highlight />
      </Chart>
    </ResizableChart>
  );
};

const DirectLabelSizeScaling = DirectLabelSizeScalingStory;

const DirectLabelDefault = bindWithProps(LineDirectLabelStory);
DirectLabelDefault.args = { value: 'series' };

const DirectLabelValueLast = bindWithProps(LineDirectLabelStory);
DirectLabelValueLast.args = { value: 'last' };

const DirectLabelValueAverage = bindWithProps(LineDirectLabelStory);
DirectLabelValueAverage.args = { value: 'average' };

const DirectLabelWithInspect = bindWithProps(LineDirectLabelWithInspectStory);
DirectLabelWithInspect.args = { value: 'series' };

const DirectLabelControlledHighlight = bindWithProps(LineDirectLabelControlledHighlightStory);
DirectLabelControlledHighlight.args = { value: 'last' };

const DirectLabelPositionStart = bindWithProps(LineDirectLabelStory);
DirectLabelPositionStart.args = { value: 'series', position: 'start' };

const DirectLabelLabelCollision = bindWithProps(LineDirectLabelLabelCollisionStory);
DirectLabelLabelCollision.args = { value: 'series', excludeSeries: ['Add Line viz'] };

export {
  DirectLabelDefault,
  DirectLabelValueLast,
  DirectLabelValueAverage,
  DirectLabelPositionStart,
  DirectLabelWithInspect,
  DirectLabelControlledHighlight,
  DirectLabelLabelCollision,
  DirectLabelSizeScaling,
};
