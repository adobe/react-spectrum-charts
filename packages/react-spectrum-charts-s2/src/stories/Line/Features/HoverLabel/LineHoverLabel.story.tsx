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

import { Chart } from '../../../../Chart.js';
import { Axis, ChartPopover, Legend, Line } from '../../../../components/index.js';
import useChartProps from '../../../../hooks/useChartProps.js';
import { bindWithProps } from '../../../../test-utils/index.js';
import { LineProps } from '../../../../types/index.js';
import { visitsByChannelData } from '../../lineData.js';
import { setControls } from '../../lineStoryUtils.js';

export default {
  title: 'React Spectrum Charts 2/Line/Features/Hover Label',
  component: Line,
};

// Hover labels only render on interactive lines, so each story includes a popover.
const HoverLabelStory: StoryFn<typeof Line> = (args): ReactElement => {
  const chartProps = useChartProps({ data: visitsByChannelData, minWidth: 400, maxWidth: 800, height: 400 });
  return (
    <Chart {...chartProps}>
      <Axis position="left" grid title="Visits" />
      <Axis position="bottom" labelFormat="time" baseline ticks />
      <Line {...args}>
        <ChartPopover>
          {(datum) => (
            <div>
              <div>{new Date(datum.datetime as number).toLocaleDateString()}</div>
              <div>{datum.channel}</div>
              <div>Visits: {Number(datum.visits).toLocaleString()}</div>
            </div>
          )}
        </ChartPopover>
      </Line>
      <Legend highlight />
    </Chart>
  );
};

const visitsProps: LineProps = { dimension: 'datetime', metric: 'visits', color: 'channel' };

const ShowHoverLabel = bindWithProps(HoverLabelStory);
ShowHoverLabel.args = { ...visitsProps, showHoverLabel: true };
setControls(ShowHoverLabel, ['showHoverLabel']);

const HoverLabelKey = bindWithProps(HoverLabelStory);
HoverLabelKey.args = { ...visitsProps, hoverLabelKey: 'visitsLabel' };
setControls(HoverLabelKey, ['hoverLabelKey']);

const DimensionHover = bindWithProps(HoverLabelStory);
DimensionHover.args = { ...visitsProps, dimensionHover: true };
setControls(DimensionHover, ['dimensionHover']);

export { ShowHoverLabel, HoverLabelKey, DimensionHover };
