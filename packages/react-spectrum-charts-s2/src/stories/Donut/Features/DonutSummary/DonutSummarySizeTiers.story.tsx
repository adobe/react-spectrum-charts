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

import { Chart } from '../../../../Chart';
import useChartProps from '../../../../hooks/useChartProps';
import { Donut, DonutSummary } from '../../../../pre-alpha';
import { bindWithProps } from '../../../../test-utils';
import { ChartProps } from '../../../../types';

export default {
  title: 'React Spectrum Charts 2/Donut/Features/Donut Summary',
  component: DonutSummary,
};

const data = [
  { count: 10390, browser: 'Chrome' },
  { count: 8281, browser: 'Firefox' },
  { count: 7045, browser: 'Safari' },
];

// named size tiers (XS/S/M/L/XL) with their design-token outer diameters
const sizeTiers = [
  { label: 'XS', diameter: 60 },
  { label: 'S', diameter: 120 },
  { label: 'M', diameter: 160 },
  { label: 'L', diameter: 200 },
  { label: 'XL', diameter: 400 },
];

const SizeTiersStory: StoryFn = (): ReactElement => {
  return (
    <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-end', gap: '16px' }}>
      {sizeTiers.map(({ label, diameter }) => (
        <SizeTierChart key={label} label={label} diameter={diameter} />
      ))}
    </div>
  );
};

const SizeTierChart = ({ label, diameter }: { label: string; diameter: number }): ReactElement => {
  const chartProps: ChartProps = useChartProps({ data, width: diameter, height: diameter });
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
      <Chart {...chartProps}>
        <Donut metric="count" color="browser">
          <DonutSummary label="Visitors" />
        </Donut>
      </Chart>
      <span>
        {label} ({diameter}px)
      </span>
    </div>
  );
};

const SizeTiers = bindWithProps(SizeTiersStory);

export { SizeTiers };
