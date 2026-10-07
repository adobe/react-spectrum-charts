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

import { Datum } from '@spectrum-charts/vega-spec-builder-s2';

import { Chart } from '../../../Chart.js';
import { Axis, Bar, Legend } from '../../../components/index.js';
import useChartProps from '../../../hooks/useChartProps.js';
import { barDataWithSeries } from '../../../storyShared/components/Bar/data.js';
import { bindWithProps } from '../../../test-utils/index.js';

export default {
  title: 'React Spectrum Charts 2/Bar/Coverage/Mouse Inputs',
  component: Bar,
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

  const chartProps = useChartProps({ data: barDataWithSeries, width: 640, height: 420 });
  return (
    <div>
      <div data-testid="hover-info" style={{ marginBottom: 8 }}>
        {isHovering && hoveredData ? (
          <div data-testid="hover-data">
            Previewing {hoveredData.browser}: {Number(hoveredData.downloads).toLocaleString()} downloads
          </div>
        ) : (
          <div data-testid="no-hover">Hover a browser to preview its downloads.</div>
        )}
      </div>
      <Chart {...chartProps}>
        <Axis position={args.orientation === 'horizontal' ? 'left' : 'bottom'} baseline title="Browser" />
        <Axis position={args.orientation === 'horizontal' ? 'bottom' : 'left'} grid title="Downloads" />
        <Bar {...args} onMouseOver={controlledMouseOver} onMouseOut={controlledMouseOut} />
        <Legend title="Metric" />
      </Chart>
    </div>
  );
};

export const OnMouseInputs = bindWithProps(OnMouseInputsStory);
OnMouseInputs.args = { dimension: 'browser', metric: 'downloads', color: 'series' };
