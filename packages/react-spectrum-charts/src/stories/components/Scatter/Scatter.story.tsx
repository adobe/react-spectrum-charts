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
import { ReactElement, ReactNode, useState } from 'react';

import { StoryFn } from '@storybook/react';

import { Content, Flex } from '@adobe/react-spectrum';
import { COLOR_SCALE, LINE_TYPE_SCALE, OPACITY_SCALE } from '@spectrum-charts/constants';
import { ChartColors, Datum } from '@spectrum-charts/vega-spec-builder';

import { Chart } from '../../../Chart';
import { Axis, ChartPopover, ChartTooltip, Legend, Scatter, Title } from '../../../components';
import useChartProps from '../../../hooks/useChartProps';
import { characterData, overlappingPointsData } from '../../../stories/data/marioKartData';
import { bindWithProps } from '../../../test-utils';
import { ChartProps, LegendProps, ScatterProps } from '../../../types';

const marioDataKeys = [
  ...Object.keys(characterData[0])
    .filter((key) => key !== 'character')
    .sort((a, b) => {
      if (a < b) {
        return -1;
      }
      if (a > b) {
        return 1;
      }
      return 0;
    }),
  undefined,
];

export default {
  title: 'RSC/Scatter',
  component: Scatter,
  argTypes: {
    dimension: {
      control: 'select',
      options: marioDataKeys,
    },
    metric: {
      control: 'select',
      options: marioDataKeys,
    },
    color: {
      control: 'select',
      options: marioDataKeys,
    },
    size: {
      control: 'select',
      options: marioDataKeys.filter((key) => key !== 'weightClass'),
    },
    blend: {
      control: 'select',
      options: [undefined, 'normal', 'multiply', 'screen', 'overlay'],
    },
  },
};

type MarioDataKey = keyof (typeof characterData)[0];

const marioKeyTitle: Record<Exclude<MarioDataKey, 'character' | 'firstCharacter'>, string> = {
  weightClass: 'Weight class',
  speedNormal: 'Speed (normal)',
  speedAntigravity: 'Speed (antigravity)',
  speedWater: 'Speed (water)',
  speedAir: 'Speed (air)',
  acceleration: 'Acceleration',
  weight: 'Weight',
  handlingNormal: 'Handling (normal)',
  handlingAntigravity: 'Handling (antigravity)',
  handlingWater: 'Handling (water)',
  handlingAir: 'Handling (air)',
  grip: 'Grip',
  miniTurbo: 'Mini-turbo',
};

const defaultChartProps: ChartProps = { data: characterData, height: 500, width: 500, lineWidths: [1, 2, 3] };

const getLegendProps = (args: ScatterProps): LegendProps => {
  const facets = [COLOR_SCALE, LINE_TYPE_SCALE, OPACITY_SCALE, 'size'];
  const legendKey = args[facets.find((key) => args[key] !== undefined) ?? COLOR_SCALE];
  const legendProps: LegendProps = {
    position: 'right',
    title: marioKeyTitle[legendKey],
  };
  if (typeof args.opacity === 'object') {
    legendProps.opacity = args.opacity;
  }
  return legendProps;
};


const OnMouseInputsStory: StoryFn<typeof Scatter> = (args): ReactElement => {
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

  const colors: ChartColors = args.colorScaleType === 'linear' ? 'sequentialViridis5' : 'categorical16';
  const chartProps = useChartProps({ ...defaultChartProps, colors });
  const legendProps = getLegendProps(args);

  return (
    <div>
      <div data-testid="hover-info">
        {isHovering && hoveredData ? (
          <div data-testid="hover-data" style={{ minHeight: '5rem' }}>{JSON.stringify(hoveredData, null, 2)}</div>
        ) : (
          <div 
            data-testid="no-hover"
            style={{ minHeight: '5rem' }}
          >No point hovered</div>
        )}
      </div>
      <Chart {...chartProps}>
        <Axis position="bottom" grid ticks baseline title={marioKeyTitle[args.dimension as MarioDataKey]} />
        <Axis position="left" grid ticks baseline title={marioKeyTitle[args.metric as MarioDataKey]} />
        <Scatter {...args} onMouseOver={controlledMouseOver} onMouseOut={controlledMouseOut} />
        <Legend {...legendProps} highlight />
        <Title text="Mario Kart 8 Character Data" />
      </Chart>
    </div>
  );
};

const ScatterStory: StoryFn<typeof Scatter> = (args): ReactElement => {
  const colors: ChartColors = args.colorScaleType === 'linear' ? 'sequentialViridis5' : 'categorical16';
  const chartProps = useChartProps({ ...defaultChartProps, colors });
  const legendProps = getLegendProps(args);

  return (
    <Chart {...chartProps}>
      <Axis position="bottom" grid ticks baseline title={marioKeyTitle[args.dimension as MarioDataKey]} />
      <Axis position="left" grid ticks baseline title={marioKeyTitle[args.metric as MarioDataKey]} />
      <Scatter {...args} />
      <Legend {...legendProps} highlight />
      <Title text="Mario Kart 8 Character Data" />
    </Chart>
  );
};

const ScatterSizeStory: StoryFn<typeof Scatter> = (args): ReactElement => {
  const colors: ChartColors = args.colorScaleType === 'linear' ? 'sequentialViridis5' : 'categorical16';
  const chartProps = useChartProps({ ...defaultChartProps, colors });
  const legendProps = getLegendProps(args);

  return (
    <Chart {...chartProps} symbolSizes={[6, 40]}>
      <Axis position="bottom" grid ticks baseline title={marioKeyTitle[args.dimension as MarioDataKey]} />
      <Axis position="left" grid ticks baseline title={marioKeyTitle[args.metric as MarioDataKey]} />
      <Scatter {...args} />
      <Legend {...legendProps} highlight />
      <Title text="Mario Kart 8 Character Data" />
    </Chart>
  );
};

const dialog = (item: Datum): ReactNode => {
  return (
    <Content>
      <Flex direction="column">
        <div style={{ fontWeight: 'bold' }}>{(item.character as string[]).join(', ')}</div>
        <div>
          {marioKeyTitle.speedNormal}: {item.speedNormal}
        </div>
        <div>
          {marioKeyTitle.handlingNormal}: {item.handlingNormal}
        </div>
      </Flex>
    </Content>
  );
};

const Basic = bindWithProps(ScatterStory);
Basic.args = {
  dimension: 'speedNormal',
  metric: 'handlingNormal',
};

const Color = bindWithProps(ScatterStory);
Color.args = {
  color: 'weightClass',
  dimension: 'speedNormal',
  metric: 'handlingNormal',
};

const ColorScaleType = bindWithProps(ScatterStory);
ColorScaleType.args = {
  color: 'weight',
  colorScaleType: 'linear',
  dimension: 'speedNormal',
  metric: 'handlingNormal',
};

const LineType = bindWithProps(ScatterStory);
LineType.args = {
  lineType: 'weightClass',
  lineWidth: { value: 2 },
  opacity: { value: 0.5 },
  dimension: 'speedNormal',
  metric: 'handlingNormal',
};

const OnMouseInputs = bindWithProps(OnMouseInputsStory);
OnMouseInputs.args = {
  dimension: 'speedNormal',
  metric: 'handlingNormal',
  children: [
    <ChartPopover key="1" width="auto"/>
  ],
};

const Opacity = bindWithProps(ScatterStory);
Opacity.args = {
  opacity: 'weightClass',
  dimension: 'speedNormal',
  metric: 'handlingNormal',
};

const Popover = bindWithProps(ScatterStory);
Popover.args = {
  color: 'weightClass',
  dimension: 'speedNormal',
  metric: 'handlingNormal',
  children: [
    <ChartTooltip key="0">{dialog}</ChartTooltip>,
    <ChartPopover key="1" width="auto">
      {dialog}
    </ChartPopover>,
  ],
};

const Size = bindWithProps(ScatterSizeStory);
Size.args = {
  size: 'weight',
  dimension: 'speedNormal',
  metric: 'handlingNormal',
  clip: true,
};

const Tooltip = bindWithProps(ScatterStory);
Tooltip.args = {
  color: 'weightClass',
  dimension: 'speedNormal',
  metric: 'handlingNormal',
  children: <ChartTooltip>{dialog}</ChartTooltip>,
};

const Stroke = bindWithProps(ScatterStory);
Stroke.args = {
  color: 'weightClass',
  stroke: { value: 'gray-800' },
  lineWidth: { value: 2 },
  dimension: 'speedNormal',
  metric: 'handlingNormal',
};

const OverlappingPointsStory: StoryFn<typeof Scatter> = (args): ReactElement => {
  const chartProps = useChartProps({ data: overlappingPointsData, height: 500, width: 500, colors: 'categorical6' });
  const legendProps = getLegendProps(args);

  return (
    <Chart {...chartProps}>
      <Axis position="bottom" grid ticks baseline title={marioKeyTitle[args.dimension as MarioDataKey]} />
      <Axis position="left" grid ticks baseline title={marioKeyTitle[args.metric as MarioDataKey]} />
      <Scatter {...args} />
      <Legend {...legendProps} highlight />
      <Title text="Overlapping Points with Stroke Border" />
    </Chart>
  );
};

const StrokeWithOverlappingPoints = bindWithProps(OverlappingPointsStory);
StrokeWithOverlappingPoints.args = {
  dimension: 'speedNormal',
  metric: 'handlingNormal',
  color: 'weightClass',
  stroke: { value: 'gray-300' },
  lineWidth: { value: 2 },
  blend: 'normal',
  opacity: { value: 0.7 },
  size: { value: 60 },
};

export { Basic, Color, ColorScaleType, LineType, OnMouseInputs, Opacity, Popover, Size, Stroke, StrokeWithOverlappingPoints, Tooltip };
