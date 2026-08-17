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

import { Chart } from '../../../Chart';
import { Axis, Bar, Legend } from '../../../components';
import useChartProps from '../../../hooks/useChartProps';
import { bindWithProps } from '../../../test-utils';
import { BarProps } from '../../../types';
import { barData } from './data';

export default {
  title: 'React Spectrum Charts 2/Bar/Features/Pattern Fill',
  component: Bar,
};

// Real pattern/patterns props (planning/specs/bar/pattern-scale.json) - pattern behaves exactly like color's
// dual-facet: [region, period] dodges by region, stacks by period. Current is listed first per region so it
// stacks on the bottom (Vega preserves data order for stacking when no explicit sort is given).
const dodgedStackedPeriodData = barData.flatMap(({ browser, downloads }) =>
  (['East', 'West'] as const).flatMap((region, i) => {
    const current = Math.round(downloads * (i === 0 ? 0.6 : 0.4));
    const previous = Math.round(current * 0.8);
    return [
      { browser, region, period: 'Current', downloads: current },
      { browser, region, period: 'Previous', downloads: previous },
    ];
  })
);

const PreviousCurrentStory: StoryFn<typeof Bar> = (args): ReactElement => {
  const chartProps = useChartProps({
    data: dodgedStackedPeriodData,
    width: 800,
    height: 600,
    // One row per region (East, West), each its own S2 categorical color token, mirroring DodgedStacked's
    // per-OS color family - patterns resolves S2 tokens the same way colors does. A built-in name paired
    // with a color in the same row is recolored to match it, so the stripe renders in that region's own
    // color rather than a fixed neutral tile. Order is [Current, Previous] to match the secondaryPattern
    // domain order (data order): index 0 solid, index 1 stripe.
    patterns: [
      ['categorical-100', 'diagonal-stripe'],
      ['categorical-200', 'diagonal-stripe'],
    ],
    // Pattern fill is only implemented for the canvas renderer - the SVG phase is a separate,
    // not-yet-built spec (planning/specs/chart/pattern-fill-rendering.json).
    renderer: 'canvas',
  });
  return (
    <Chart {...chartProps}>
      <Axis position="bottom" baseline title="Browser" />
      <Axis position="left" grid title="Downloads" />
      <Bar {...args} />
      {/* No `keys` - matches DodgedStacked's own dual-facet legend, which shows the full region x period cross-product. */}
      <Legend title="Region / Period" highlight />
    </Chart>
  );
};

const defaultProps: BarProps = {
  type: 'dodged',
  dimension: 'browser',
  metric: 'downloads',
};

// pattern takes precedence over color for fill; the [region, period] tuple dodges by region and stacks by
// period, exactly like a color dual-facet tuple would.
const PreviousCurrentComparison = bindWithProps(PreviousCurrentStory);
PreviousCurrentComparison.args = {
  ...defaultProps,
  pattern: ['region', 'period'],
};

const DefaultPaletteStory: StoryFn<typeof Bar> = (args): ReactElement => {
  const chartProps = useChartProps({ data: barData, width: 800, height: 600, renderer: 'canvas' });
  return (
    <Chart {...chartProps}>
      <Axis position="bottom" baseline title="Browser" />
      <Axis position="left" grid title="Downloads" />
      <Bar {...args} />
      <Legend title="Browser" />
    </Chart>
  );
};

// No patterns override - each browser gets a distinct tile from the built-in default palette.
const DefaultPalette = bindWithProps(DefaultPaletteStory);
DefaultPalette.args = {
  ...defaultProps,
  pattern: 'browser',
};

export { PreviousCurrentComparison, DefaultPalette };
