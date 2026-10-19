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
  title: 'React Spectrum Charts 2/Line/Regressions/Highlighted Item',
  component: Chart,
};

const data = lineVariationDatasets.standard;
const peakIds = data.filter(({ isPeak }) => isPeak).map(({ id }) => id);

const HighlightedItemStory: StoryFn<typeof Chart> = (args): ReactElement => {
  const chartProps = useChartProps(args);
  return (
    <Chart {...chartProps}>
      <Axis position="left" grid numberFormat="shortNumber" />
      <Axis position="bottom" labelFormat="time" baseline ticks />
      <Line color="series" />
      <Legend highlight />
    </Chart>
  );
};

// Every series' peak is a highlighted item; only Email's peak should show.
const HighlightedItemInHighlightedSeries = bindWithProps(HighlightedItemStory);
HighlightedItemInHighlightedSeries.args = {
  data,
  width: 600,
  height: 300,
  idKey: 'id',
  highlightedItem: peakIds,
  highlightedSeries: 'Email',
};
HighlightedItemInHighlightedSeries.parameters = {
  ...HighlightedItemInHighlightedSeries.parameters,
  regression: {
    description:
      'With highlightedSeries and highlightedItem both set, highlighted items in other series still showed their points without fading.',
    pr: 1036,
  },
};

export { HighlightedItemInHighlightedSeries };
