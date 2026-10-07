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

import { Datum } from '@spectrum-charts/vega-spec-builder-s2';

import { Chart } from '../../../Chart.js';
import { Axis, Bar, ChartInspect, Legend } from '../../../components/index.js';
import useChartProps from '../../../hooks/useChartProps.js';
import { frequencyOfUseData } from '../../../storyShared/components/Bar/data.js';
import { BarProps } from '../../../types/index.js';
import { bindStory } from './storyUtils.js';

export default {
  title: 'React Spectrum Charts 2/Bar/Features',
  component: Bar,
};

// Folds the 11-15 bucket into "6+ times" so the smaller events don't stack into thin slivers on the shared scale.
const usageData = Object.values(
  frequencyOfUseData.reduce<Record<string, (typeof frequencyOfUseData)[number]>>((usage, datum) => {
    const bucket = datum.order === 0 ? datum.bucket : '6+ times';
    const key = [datum.event, datum.segment, bucket].join('|');
    const value = (usage[key]?.value ?? 0) + datum.value;
    usage[key] = { ...datum, bucket, order: Math.min(datum.order, 1), value };
    return usage;
  }, {})
);

// Stacking the trellis cells vertically splits the height three ways, so show fewer platforms and a taller chart.
const topPlatformsData = usageData.filter(({ segment }) => ['All users', 'Roku', 'Chromecast'].includes(segment));

const TrellisStory: StoryFn<typeof Bar> = (args: BarProps): ReactElement => {
  const isHorizontal = args.orientation === 'horizontal';
  const isVerticalTrellis = args.trellisOrientation === 'vertical';
  const chartProps = useChartProps({
    data: isVerticalTrellis ? topPlatformsData : usageData,
    width: 760,
    height: isVerticalTrellis ? 600 : 480,
  });

  return (
    <Chart {...chartProps}>
      <Axis position={isHorizontal ? 'bottom' : 'left'} title="Users" grid />
      <Axis position={isHorizontal ? 'left' : 'bottom'} title="Platform" baseline />
      <Bar {...args}>
        <ChartInspect>
          {(item: Datum) => (
            <div>
              <div>{item.event}</div>
              <div>
                {item.segment}, {item.bucket}: {Number(item.value).toLocaleString()} users
              </div>
            </div>
          )}
        </ChartInspect>
      </Bar>
      <Legend title="Usage frequency" />
    </Chart>
  );
};

const defaultProps: BarProps = {
  type: 'stacked',
  trellis: 'event',
  dimension: 'segment',
  color: 'bucket',
  order: 'order',
  orientation: 'horizontal',
};

const Trellis = bindStory<BarProps>(TrellisStory);
Trellis.args = { ...defaultProps };
Trellis.parameters = { controls: { include: ['trellis'] } };

const TrellisOrientation = bindStory<BarProps>(TrellisStory);
TrellisOrientation.args = { ...defaultProps, trellisOrientation: 'vertical' };
TrellisOrientation.parameters = { controls: { include: ['trellisOrientation'] } };

const TrellisPadding = bindStory<BarProps>(TrellisStory);
TrellisPadding.args = { ...defaultProps, trellisPadding: 0.5 };
TrellisPadding.parameters = { controls: { include: ['trellisPadding'] } };

export { Trellis, TrellisOrientation, TrellisPadding };
