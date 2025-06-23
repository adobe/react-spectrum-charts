/*
 * Copyright 2023 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
import React, { ReactElement, createElement, useState } from 'react';

import { StoryFn } from '@storybook/react';

import { Datum } from '@spectrum-charts/vega-spec-builder';

import { Annotation } from '../../../components/Annotation';
import useChartProps from '../../../hooks/useChartProps';
import { Axis, Bar, BarProps, Chart } from '../../../index';
import { bindWithProps } from '../../../test-utils';
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

const WithAnnotation = bindWithProps(BarStory);
WithAnnotation.args = {
  ...defaultProps,
  children: createElement(Annotation, { textKey: 'percentLabel' }),
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

export {
  Basic,
  Horizontal,
  LineType,
  Opacity,
  PaddingRatio,
  WithAnnotation,
  HasSquareCorners,
  OnClick,
  OnMouseInputs,
  BarWithUTCDatetimeFormat,
};
