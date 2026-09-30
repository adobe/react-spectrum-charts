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

import { action } from 'storybook/actions';
import { StoryFn } from '@storybook/react';

import { Datum } from '@spectrum-charts/vega-spec-builder-s2';

import { Chart } from '../../../Chart';
import { Axis, Bar, ChartInspect, Legend } from '../../../components';
import useChartProps from '../../../hooks/useChartProps';
import { bindWithProps } from '../../../test-utils';
import { BarProps } from '../../../types';
import { acquisitionChannelData, barDataWithSeries } from './data';

export default {
  title: 'React Spectrum Charts 2/Bar/Features',
  component: Bar,
  parameters: {
    controls: {
      include: ['orientation', 'opacity', 'lineType', 'lineWidth', 'paddingRatio', 'hasSquareCorners'],
    },
  },
};

const OnMouseInputsStory: StoryFn<typeof Bar> = (args): ReactElement => {
  const [hoveredData, setHoveredData] = useState<Datum | null>(null);
  const [isHovering, setIsHovering] = useState(false);

  const controlledMouseOver = (datum: Datum) => {
    if (!isHovering) {
      setHoveredData(datum);
      setIsHovering(true);
    }
  };
  const controlledMouseOut = () => {
    if (isHovering) {
      setIsHovering(false);
    }
  };

  const chartProps = useChartProps({ data: barDataWithSeries, width: 640, height: 420 });
  return (
    <div>
      <div data-testid="hover-info" style={{ marginBottom: 8 }}>
        {isHovering && hoveredData ? (
          <div data-testid="hover-data">
            Previewing {hoveredData.browser}: {Number(hoveredData.downloads).toLocaleString()} downloads
          </div>
        ) : (
          <div data-testid="no-hover">Hover a browser to preview its downloads.</div>
        )}
      </div>
      <Chart {...chartProps}>
        <Axis position={args.orientation === 'horizontal' ? 'left' : 'bottom'} baseline title="Browser" />
        <Axis position={args.orientation === 'horizontal' ? 'bottom' : 'left'} grid title="Downloads" />
        <Bar {...args} onMouseOver={controlledMouseOver} onMouseOut={controlledMouseOut} />
        <Legend title="Metric" />
      </Chart>
    </div>
  );
};

const BarStory: StoryFn<typeof Bar> = (args): ReactElement => {
  const chartProps = useChartProps({ data: acquisitionChannelData, width: 640, height: 420 });
  return (
    <Chart {...chartProps}>
      <Axis position={args.orientation === 'horizontal' ? 'left' : 'bottom'} baseline title="Acquisition channel" />
      <Axis position={args.orientation === 'horizontal' ? 'bottom' : 'left'} grid title="Sign-ups" />
      <Bar {...args} />
      <Legend title="Metric" />
    </Chart>
  );
};

const CallbackBarStory: StoryFn<typeof Bar> = (args): ReactElement => {
  const chartProps = useChartProps({ data: barDataWithSeries, width: 640, height: 420 });
  return (
    <Chart {...chartProps}>
      <Axis position={args.orientation === 'horizontal' ? 'left' : 'bottom'} baseline title="Browser" />
      <Axis position={args.orientation === 'horizontal' ? 'bottom' : 'left'} grid title="Downloads" />
      <Bar {...args} />
      <Legend title="Metric" />
    </Chart>
  );
};

const BarWithInspectStory: StoryFn<typeof Bar> = (args): ReactElement => {
  const chartProps = useChartProps({ data: barDataWithSeries, width: 640, height: 420 });
  return (
    <Chart {...chartProps}>
      <Axis position={args.orientation === 'horizontal' ? 'left' : 'bottom'} baseline title="Browser" />
      <Axis position={args.orientation === 'horizontal' ? 'bottom' : 'left'} grid title="Downloads" />
      <Bar {...args}>
        <ChartInspect>
          {(datum) => {
            return (
              <div>
                {datum.browser}: {datum.downloads}
              </div>
            );
          }}
        </ChartInspect>
      </Bar>
      <Legend title="Metric" />
    </Chart>
  );
};

const defaultProps: BarProps = {
  dimension: 'channel',
  metric: 'signups',
  color: 'series',
  onClick: undefined,
};

const callbackProps: BarProps = {
  dimension: 'browser',
  metric: 'downloads',
  color: 'series',
  onClick: undefined,
};

const Basic = bindWithProps(BarStory);
Basic.args = {
  ...defaultProps,
};

const Horizontal = bindWithProps(BarStory);
Horizontal.args = {
  ...defaultProps,
  orientation: 'horizontal',
};

const LineType = bindWithProps(BarStory);
LineType.args = {
  ...defaultProps,
  opacity: { value: 0.75 },
  lineType: { value: 'dashed' },
  lineWidth: 2,
};

const PaddingRatio = bindWithProps(BarStory);
PaddingRatio.args = {
  ...defaultProps,
  paddingRatio: 0.2,
};

const HasSquareCorners = bindWithProps(BarStory);
HasSquareCorners.args = {
  ...defaultProps,
  hasSquareCorners: true,
};

const OnClick = bindWithProps(CallbackBarStory);
OnClick.args = {
  ...callbackProps,
  onClick: action('onClick'),
};

const OnMouseInputs = bindWithProps(OnMouseInputsStory);
OnMouseInputs.args = {
  ...callbackProps,
};

const WithInspect = bindWithProps(BarWithInspectStory);
WithInspect.args = {
  ...callbackProps,
};

// Hovering an axis label highlights the matching bar, same as hovering the bar itself.
const AxisLabelHighlight = bindWithProps(BarWithInspectStory);
AxisLabelHighlight.args = {
  ...callbackProps,
};

export {
  Basic,
  HasSquareCorners,
  Horizontal,
  LineType,
  OnClick,
  OnMouseInputs,
  PaddingRatio,
  AxisLabelHighlight,
  WithInspect,
};
