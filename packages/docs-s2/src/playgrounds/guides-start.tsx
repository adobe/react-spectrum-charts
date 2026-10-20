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
import React from 'react';

import { Axis, Legend, Line } from '@spectrum-charts/react-spectrum-charts-s2';

import { DocsChart as Chart } from '../components/examples/DocsChart';
import { PreviewSize, PropPlayground } from '../components/examples/PropPlayground';
import { guideVisitsData } from '../components/examples/data';

const FIRST_CHART_SIZE: PreviewSize = { width: 512, height: 340 };

/**
 * A minimal line chart with axes and a legend, used as the first example in the guides.
 * @returns playground element
 */
export const GuideFirstChartExample = () => (
  <PropPlayground
    previewSize={() => FIRST_CHART_SIZE}
    controls={[]}
    component="Chart"
    render={() => (
      <Chart data={guideVisitsData}>
        <Axis position="bottom" labelFormat="time" baseline ticks />
        <Axis position="left" grid />
        <Line dimension="date" metric="visits" color="device" />
        <Legend />
      </Chart>
    )}
  />
);
