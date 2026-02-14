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

import { GROUP_DATA } from '@spectrum-charts/constants';
import { Datum } from '@spectrum-charts/vega-spec-builder-s2';

import { Chart } from '../../../Chart';
import { Axis, Bar, ChartTooltip } from '../../../components';
import useChartProps from '../../../hooks/useChartProps';
import { bindWithProps } from '../../../test-utils';
import { BarProps } from '../../../types';
import { barData, barDataWithUTC } from './data';

export default {
  title: 'RSC/Bar',
  component: Bar,
};

const BarStoryWithUTCData: StoryFn<typeof Bar> = (args): ReactElement => {
  const chartProps = useChartProps({ data: barDataWithUTC, width: 600, height: 600 });
  return (
    <Chart {...chartProps}>
      <Axis
        position={args.orientation === 'horizontal' ? 'left' : 'bottom'}
        labelFormat="time"
        granularity="day"
        baseline
        title="Browser"
      />
      <Axis position={args.orientation === 'horizontal' ? 'bottom' : 'left'} grid title="Downloads" />
      <Bar {...args} />
    </Chart>
  );
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

  const chartProps = useChartProps({ data: barData, width: 600, height: 600 });
  return (
    <div>
      <div data-testid="hover-info">
        {isHovering && hoveredData ? (
          <div data-testid="hover-data">{JSON.stringify(hoveredData, null, 2)}</div>
        ) : (
          <div data-testid="no-hover">No bar hovered</div>
        )}
      </div>
      <Chart {...chartProps}>
        <Axis position={args.orientation === 'horizontal' ? 'left' : 'bottom'} baseline title="Browser" />
        <Axis position={args.orientation === 'horizontal' ? 'bottom' : 'left'} grid title="Downloads" />
        <Bar {...args} onMouseOver={controlledMouseOver} onMouseOut={controlledMouseOut} />
      </Chart>
    </div>
  );
};

const BarStory: StoryFn<typeof Bar> = (args): ReactElement => {
  const chartProps = useChartProps({ data: barData, width: 600, height: 600 });
  return (
    <Chart {...chartProps}>
      <Axis position={args.orientation === 'horizontal' ? 'left' : 'bottom'} baseline title="Browser" />
      <Axis position={args.orientation === 'horizontal' ? 'bottom' : 'left'} grid title="Downloads" />
      <Bar {...args} />
    </Chart>
  );
};

const BarWithTooltipStory: StoryFn<typeof Bar> = (args): ReactElement => {
  const chartProps = useChartProps({ data: barData, width: 600, height: 600 });
  return (
    <Chart {...chartProps}>
      <Axis position={args.orientation === 'horizontal' ? 'left' : 'bottom'} baseline title="Browser" />
      <Axis position={args.orientation === 'horizontal' ? 'bottom' : 'left'} grid title="Downloads" />
      <Bar {...args}>
        <ChartTooltip>
          {(datum) => {
            return (
              <div>
                {datum.browser}: {datum.downloads}
              </div>
            );
          }}
        </ChartTooltip>
      </Bar>
    </Chart>
  );
};

const BarDimensionAreaStory: StoryFn<typeof Bar> = (args): ReactElement => {
  const chartProps = useChartProps({ data: barData, width: 600, height: 600 });
  return (
    <Chart {...chartProps}>
      <Axis position={args.orientation === 'horizontal' ? 'left' : 'bottom'} baseline title="Browser" />
      <Axis position={args.orientation === 'horizontal' ? 'bottom' : 'left'} grid title="Downloads" />
      <Bar {...args}>
        <ChartTooltip targets={['item', 'dimensionArea']}>
          {(datum) => {
            const d = datum[GROUP_DATA]?.[0] ?? datum;
            return (
              <div>
                {d.browser}: {d.downloads}
              </div>
            );
          }}
        </ChartTooltip>
      </Bar>
    </Chart>
  );
};

const defaultProps: BarProps = {
  dimension: 'browser',
  metric: 'downloads',
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

const Opacity = bindWithProps(BarStory);
Opacity.args = {
  ...defaultProps,
  opacity: { value: 0.75 },
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

const OnClick = bindWithProps(BarStory);
OnClick.args = {
  dimension: 'browser',
  metric: 'downloads',
  onClick: (datum) => {
    console.log('datum:', datum);
  },
};

const OnMouseInputs = bindWithProps(OnMouseInputsStory);
OnMouseInputs.args = {
  dimension: 'browser',
  metric: 'downloads',
};

const BarWithUTCDatetimeFormat = bindWithProps(BarStoryWithUTCData);
BarWithUTCDatetimeFormat.args = {
  ...defaultProps,
  dimension: 'browser',
  metric: 'downloads',
  color: 'dataset_id',
  dimensionDataType: 'time',
};

const WithTooltip = bindWithProps(BarWithTooltipStory);
WithTooltip.args = {
  ...defaultProps,
};

const TooltipOnDimensionArea = bindWithProps(BarDimensionAreaStory);
TooltipOnDimensionArea.args = {
  ...defaultProps,
};

export {
  BarWithUTCDatetimeFormat,
  Basic,
  HasSquareCorners,
  Horizontal,
  LineType,
  OnClick,
  OnMouseInputs,
  Opacity,
  PaddingRatio,
  TooltipOnDimensionArea,
  WithTooltip,
};
