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
import { produce } from 'immer';
import { Data, Scale, Signal } from 'vega';

import {
  DEFAULT_BULLET_DIRECTION,
  DEFAULT_COLOR_SCHEME,
  DEFAULT_LABEL_POSITION,
  DEFAULT_SCALE_TYPE,
  DEFAULT_SCALE_VALUE,
} from '@spectrum-charts/constants';
import { getS2ColorValue, spectrum2Colors } from '@spectrum-charts/themes';
import { toCamelCase } from '@spectrum-charts/utils';

import { BulletOptions, BulletSpecOptions, ColorScheme, ScSpec } from '../types';
import { getBulletTableData, getBulletTransforms } from './bulletDataUtils';
import { addAxes, addMarks } from './bulletMarkUtils';

const DEFAULT_COLOR = spectrum2Colors.light['blue-900'];

export const addBullet = produce<
  ScSpec,
  [BulletOptions & { colorScheme?: ColorScheme; index?: number; idKey: string }]
>(
  (
    spec,
    {
      colorScheme = DEFAULT_COLOR_SCHEME,
      index = 0,
      name,
      metric,
      dimension,
      target,
      color = DEFAULT_COLOR,
      direction = DEFAULT_BULLET_DIRECTION,
      numberFormat,
      showTarget = true,
      showTargetValue = false,
      labelPosition = DEFAULT_LABEL_POSITION,
      scaleType = DEFAULT_SCALE_TYPE,
      maxScaleValue = DEFAULT_SCALE_VALUE,
      thresholds = [],
      track = false,
      thresholdBarColor = false,
      metricAxis = false,
      ...options
    }
  ) => {
    const bulletOptions: BulletSpecOptions = {
      colorScheme: colorScheme,
      index,
      color: getS2ColorValue(color, colorScheme),
      metric: metric ?? 'currentAmount',
      dimension: dimension ?? 'graphLabel',
      target: target ?? 'target',
      name: toCamelCase(name ?? `bullet${index}`),
      direction: direction,
      numberFormat: numberFormat ?? '',
      showTarget: showTarget,
      showTargetValue: showTargetValue,
      labelPosition: labelPosition,
      scaleType: scaleType,
      maxScaleValue: maxScaleValue,
      track: track,
      thresholds: thresholds,
      thresholdBarColor: thresholdBarColor,
      metricAxis: metricAxis,
      ...options,
    };

    spec.data = addData(spec.data ?? [], bulletOptions);
    spec.marks = addMarks(spec.marks ?? [], bulletOptions);
    spec.scales = addScales(spec.scales ?? [], bulletOptions);
    spec.signals = addSignals(spec.signals ?? [], bulletOptions);
    spec.axes = addAxes(spec.axes ?? [], bulletOptions);
  }
);

export const addScales = produce<Scale[], [BulletSpecOptions]>((scales, options) => {
  const groupScaleRangeSignal = options.direction === 'column' ? 'bulletChartHeight' : 'width';
  const xRange = options.direction === 'column' ? 'width' : [0, { signal: 'bulletGroupWidth' }];
  let domainFields;

  if (options.scaleType === 'flexible' && options.maxScaleValue > 0) {
    domainFields = { data: 'table', fields: ['xPaddingForTarget', options.metric, 'flexibleScaleValue'] };
  } else if (options.scaleType === 'fixed' && options.maxScaleValue > 0) {
    domainFields = [0, `${options.maxScaleValue}`];
  } else {
    domainFields = { data: 'table', fields: ['xPaddingForTarget', options.metric] };
  }

  scales.push(
    {
      name: 'groupScale',
      type: 'band',
      domain: { data: 'table', field: options.dimension },
      range: [0, { signal: groupScaleRangeSignal }],
      paddingInner: { signal: 'paddingRatio' },
    },
    {
      name: 'xscale',
      type: 'linear',
      domain: domainFields,
      range: xRange,
      round: true,
      clamp: true,
      zero: true,
    }
  );
});

export const addSignals = produce<Signal[], [BulletSpecOptions]>((signals, options) => {
  signals.push(
    { name: 'gap', value: 12 },
    { name: 'bulletHeight', value: 8 },
    { name: 'bulletThresholdHeight', update: 'bulletHeight * 3' },
    { name: 'targetHeight', update: 'bulletThresholdHeight + 6' }
  );

  if (options.showTargetValue && options.showTarget) {
    signals.push({ name: 'targetValueLabelHeight', update: '20' });
  }

  signals.push({
    name: 'bulletGroupHeight',
    update: getBulletGroupHeightExpression(options),
  });

  if (options.direction === 'column') {
    signals.push({ name: 'paddingRatio', update: 'gap / (gap + bulletGroupHeight)' });

    if (options.metricAxis && !options.showTargetValue) {
      signals.push(
        {
          name: 'bulletChartHeight',
          update: "length(data('table')) * bulletGroupHeight + (length(data('table')) - 1) * gap + 10",
        },
        {
          name: 'axisOffset',
          update: 'bulletChartHeight - height - 10',
        }
      );
    } else {
      signals.push({
        name: 'bulletChartHeight',
        update: "length(data('table')) * bulletGroupHeight + (length(data('table')) - 1) * gap",
      });
    }
  } else {
    signals.push(
      { name: 'bulletGroupWidth', update: "(width / length(data('table'))) - gap" },
      { name: 'paddingRatio', update: 'gap / (gap + bulletGroupWidth)' },
      { name: 'bulletChartHeight', update: 'bulletGroupHeight' }
    );
  }
});

/**
 * Returns the height of the bullet group based on the options
 * @param options the bullet spec options
 * @returns the height of the bullet group
 */
function getBulletGroupHeightExpression(options: BulletSpecOptions): string {
  if (options.showTargetValue && options.showTarget) {
    return options.labelPosition === 'side' && options.direction === 'column'
      ? 'bulletThresholdHeight + targetValueLabelHeight + 10'
      : 'bulletThresholdHeight + targetValueLabelHeight + 24';
  } else if (options.labelPosition === 'side' && options.direction === 'column') {
    return 'bulletThresholdHeight + 10';
  }
  return 'bulletThresholdHeight + 24';
}

export const addData = produce<Data[], [BulletSpecOptions]>((data, options) => {
  const tableData = getBulletTableData(data);
  tableData.transform = getBulletTransforms(options);
});
