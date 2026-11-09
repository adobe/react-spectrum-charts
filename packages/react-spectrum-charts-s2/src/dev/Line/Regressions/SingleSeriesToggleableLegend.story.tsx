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

import { Chart } from '../../../Chart.js';
import { Axis, Legend, Line } from '../../../components/index.js';
import useChartProps from '../../../hooks/useChartProps.js';
import { bindWithProps } from '../../../test-utils/index.js';
import { lineVariationDatasets } from '../Dashboards/lineVariationData.js';

export default {
  title: 'React Spectrum Charts 2/Line/Regressions/Toggleable Legend',
  component: Chart,
};

const SingleSeriesToggleableLegendStory: StoryFn<typeof Chart> = (args): ReactElement => {
  const chartProps = useChartProps(args);
  return (
    <Chart {...chartProps}>
      <Axis position="left" grid />
      <Axis position="bottom" labelFormat="time" />
      <Line color="series" />
      <Legend defaultHiddenSeries={['Paid search']} isToggleable />
    </Chart>
  );
};

const SingleSeriesToggleableLegend = bindWithProps(SingleSeriesToggleableLegendStory);
SingleSeriesToggleableLegend.args = {
  data: lineVariationDatasets.single,
  width: 360,
  height: 216,
  animationTypes: ['hover', 'drawIn'],
};
SingleSeriesToggleableLegend.parameters = {
  regression: {
    description: 'Hiding the only series emptied the axis domains instead of preserving valid axes.',
  },
};

const ToggleableLegendRescalingStory: StoryFn<typeof Chart> = (args): ReactElement => {
  const chartProps = useChartProps(args);
  return (
    <Chart {...chartProps}>
      <Axis position="left" grid />
      <Axis position="bottom" />
      <Line color="series" dimension="x" scaleType="linear" />
      <Legend isToggleable />
    </Chart>
  );
};

const ToggleableLegendRescaling = bindWithProps(ToggleableLegendRescalingStory);
ToggleableLegendRescaling.args = {
  data: [
    { series: 'A', x: 1, value: 1000 },
    { series: 'A', x: 2, value: 1000 },
    { series: 'B', x: 1, value: 10 },
    { series: 'B', x: 2, value: 10 },
  ],
  width: 360,
  height: 216,
};
ToggleableLegendRescaling.parameters = {
  regression: {
    description: 'Hiding the larger series must rescale the axes while hiding every series keeps valid axes.',
  },
};

export { SingleSeriesToggleableLegend, ToggleableLegendRescaling };
