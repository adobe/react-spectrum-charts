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

export default {
  title: 'React Spectrum Charts 2/Line/Regressions/Non-Highlighting Legend Overlays',
  tags: ['alpha'],
  component: Chart,
  parameters: {
    regression: {
      description:
        'Hover-only metric ranges and trendlines referenced missing legend hover signals when legend highlighting was disabled, preventing the chart from rendering.',
      pr: 1128,
    },
  },
};

const NonHighlightingLegendStory: StoryFn<typeof Chart> = (args): ReactElement => {
  const chartProps = useChartProps(args);
  return (
    <Chart {...chartProps}>
      <Axis position="left" grid />
      <Axis position="bottom" labelFormat="time" />
      <Line
        color="series"
        interpolate="linear"
        showHoverLabel={false}
        metricRanges={[{ metricStart: 'lower', metricEnd: 'upper', displayOnHover: true }]}
        trendlines={[{ method: 'linear', displayOnHover: true, lineType: 'dashed', size: 'L' }]}
      />
      <Legend highlight={false} />
    </Chart>
  );
};

const HoverOnlyOverlays = bindWithProps(NonHighlightingLegendStory);
HoverOnlyOverlays.args = {
  data: ['Search', 'Email'].flatMap((series, seriesIndex) =>
    [20, 35, 25, 45, 40].map((value, index) => ({
      datetime: Date.UTC(2026, 0, index + 1),
      series,
      value: value + seriesIndex * 50,
      lower: value + seriesIndex * 50 - 8,
      upper: value + seriesIndex * 50 + 8,
    }))
  ),
  // Keep one hover-only overlay visible in snapshots without enabling legend highlighting.
  highlightedSeries: 'Search',
  width: 560,
  height: 280,
  animations: false,
  renderer: 'svg',
};

export { HoverOnlyOverlays };
