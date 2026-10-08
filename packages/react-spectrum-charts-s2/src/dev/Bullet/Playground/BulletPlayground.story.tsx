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

/* eslint-disable react/prop-types */
import { ReactElement } from 'react';

import { StoryFn } from '@storybook/react';
import { action } from 'storybook/actions';

import { Chart } from '../../../Chart.js';
import { ChartInspect, Title } from '../../../components/index.js';
import useChartProps from '../../../hooks/useChartProps.js';
import { Bullet } from '../../../pre-alpha/index.js';
import { bindWithProps } from '../../../test-utils/index.js';
import { BulletProps } from '../../../types/index.js';
import { BulletDataPreset, getBulletData, playgroundThresholds } from '../../playgroundData.js';
import { category, chartArgTypes, chartArgs, inspectArgTypes, renderInspectContent } from '../../playgroundUtils.js';

interface BulletPlaygroundArgs extends BulletProps {
  dataPreset: BulletDataPreset;
  chartTitle?: string;
  height: number;
  maxWidth: number;
  colorScheme?: 'light' | 'dark';
  backgroundColor?: string;
  showInspect: boolean;
  inspectHighlightBy: 'item' | 'series' | 'dimension';
  inspectTargets: ('item' | 'dimensionArea')[];
}

export default {
  title: 'React Spectrum Charts 2/Pre-Alpha/Bullet/Playground',
  component: Bullet,
  argTypes: {
    ...chartArgTypes,
    dataPreset: { ...chartArgTypes.dataPreset, options: ['progress', 'ranked', 'overTarget'] },
    ...inspectArgTypes,
    ...category('Bullet', [
      'color',
      'dimension',
      'direction',
      'labelPosition',
      'maxScaleValue',
      'metric',
      'metricLabel',
      'metricAxis',
      'name',
      'numberFormat',
      'scaleType',
      'showTarget',
      'showTargetValue',
      'target',
      'targetLabel',
      'thresholdBarColor',
      'thresholds',
      'track',
    ]),
    direction: { control: 'select', options: ['row', 'column'], table: { category: 'Bullet' } },
    labelPosition: { control: 'select', options: ['side', 'top'], table: { category: 'Bullet' } },
    scaleType: { control: 'select', options: ['normal', 'fixed', 'flexible'], table: { category: 'Bullet' } },
    maxScaleValue: { control: { type: 'range', min: 50, max: 200, step: 5 }, table: { category: 'Bullet' } },
  },
};

const BulletPlaygroundStory: StoryFn<BulletPlaygroundArgs> = ({
  dataPreset,
  chartTitle,
  height,
  maxWidth,
  colorScheme,
  backgroundColor,
  showInspect,
  inspectHighlightBy,
  inspectTargets,
  ...bulletProps
}): ReactElement => {
  const chartProps = useChartProps({ data: getBulletData(dataPreset), height, maxWidth });
  return (
    <Chart {...chartProps} colorScheme={colorScheme} backgroundColor={backgroundColor}>
      {chartTitle ? <Title text={chartTitle} /> : undefined}
      <Bullet {...bulletProps}>
        {showInspect ? (
          <ChartInspect highlightBy={inspectHighlightBy} targets={inspectTargets}>
            {(datum) => {
              action('Bullet ChartInspect:hover')(datum);
              return renderInspectContent(['graphLabel', 'currentAmount', 'target'])(datum);
            }}
          </ChartInspect>
        ) : undefined}
      </Bullet>
    </Chart>
  );
};

export const Playground = bindWithProps(BulletPlaygroundStory);
Playground.args = {
  ...chartArgs,
  dataPreset: 'progress',
  chartTitle: 'Quarterly funnel progress',
  height: 360,
  maxWidth: 760,
  showInspect: true,
  inspectHighlightBy: 'item',
  inspectTargets: ['item'],
  name: 'bullet0',
  dimension: 'graphLabel',
  metric: 'currentAmount',
  target: 'target',
  thresholds: playgroundThresholds,
  color: 'blue-900',
  direction: 'column',
  labelPosition: 'side',
  maxScaleValue: 100,
  metricLabel: 'currentAmountLabel',
  metricAxis: true,
  numberFormat: 'shortNumber',
  scaleType: 'fixed',
  showTarget: true,
  showTargetValue: true,
  targetLabel: 'targetLabel',
  thresholdBarColor: false,
  track: true,
} satisfies BulletPlaygroundArgs;
