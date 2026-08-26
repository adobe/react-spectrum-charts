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

import { Chart } from '../../../Chart';
import { Axis, Bar, Legend } from '../../../components';
import useChartProps from '../../../hooks/useChartProps';
import { barData } from '../Bar/data';

export default {
  title: 'React Spectrum Charts 2/NavigationPrototype/Features/Legend Toggle',
};

/**
 * Legend toggle. A button toggles between the built-in Vega legend (OLD) and the custom
 * accessible-navigation legend (NEW). Both get the same legend props so each feature can be
 * checked on both. In NEW mode, Tab into the chart and use arrow keys to navigate the legend —
 * focus rings appear.
 */
const LegendToggleStory: StoryFn = (): ReactElement => {
  const [useOldLegend, setUseOldLegend] = useState(false);
  const chartProps = useChartProps({
    data: barData,
    width: 600,
    height: 600,
    accessibleNavigation: !useOldLegend,
  });
  return (
    <div>
      <button type="button" onClick={() => setUseOldLegend((v) => !v)} style={{ marginBottom: 12, padding: '6px 12px' }}>
        {useOldLegend ? 'Legend: OLD (built-in) — click for NEW' : 'Legend: NEW (custom) — click for OLD'}
      </button>
      <Chart {...chartProps}>
        <Axis position="bottom" baseline title="Browser" />
        <Axis position="left" grid title="Downloads" />
        <Bar dimension="browser" metric="downloads" color="browser" />
        <Legend title="Browser" color="browser" highlight />
      </Chart>
    </div>
  );
};

export const LegendToggle = LegendToggleStory.bind({});
