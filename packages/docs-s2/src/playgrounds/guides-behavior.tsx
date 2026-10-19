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

import { Axis, Bar, Donut, Legend, Line } from '@spectrum-charts/react-spectrum-charts-s2';

import { DocsChart as Chart } from '../components/examples/DocsChart';
import { PlaygroundControl, PreviewSize, PropPlayground } from '../components/examples/PropPlayground';
import { barChannelDeviceData, browserData, lineTrafficData } from '../components/examples/data';

type AnimationType = 'hover' | 'drawIn';

// Plot of about 480 × 288, plus room for the axes and a bottom legend.
const PREVIEW_SIZE: PreviewSize = { width: 560, height: 380 };

const drawInControls: PlaygroundControl[] = [
  { name: 'mark', type: 'select', options: ['Line', 'Bar', 'Donut'], defaultValue: 'Line' },
  { name: 'drawIn', type: 'boolean', defaultValue: true, doc: 'Chart.animationTypes' },
];

/**
 * Playground that replays the draw-in animation on each mark that supports it.
 * @returns playground element
 */
export const GuideDrawInPlayground = () => (
  <PropPlayground
    previewSize={() => PREVIEW_SIZE}
    controls={drawInControls}
    component="Chart"
    replay
    render={({ mark = 'Line', drawIn = true }) => {
      const animationTypes: AnimationType[] | undefined = drawIn ? undefined : ['hover'];
      if (mark === 'Donut') {
        return (
          <Chart data={browserData} animationTypes={animationTypes}>
            <Donut metric="count" color="browser" />
            <Legend />
          </Chart>
        );
      }
      if (mark === 'Bar') {
        return (
          <Chart data={barChannelDeviceData} animationTypes={animationTypes}>
            <Axis position="left" grid />
            <Axis position="bottom" baseline />
            <Bar dimension="channel" metric="visits" color="device" />
            <Legend />
          </Chart>
        );
      }
      return (
        <Chart data={lineTrafficData} animationTypes={animationTypes}>
          <Axis position="left" grid />
          <Axis position="bottom" labelFormat="time" baseline ticks />
          <Line color="series" />
          <Legend />
        </Chart>
      );
    }}
  />
);
