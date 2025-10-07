/*
 * Copyright 2025 Adobe. All rights reserved.
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
  DEFAULT_GAUGE_DIRECTION,
  DEFAULT_COLOR_SCHEME,
  DEFAULT_LABEL_POSITION,
  DEFAULT_SCALE_TYPE,
  DEFAULT_SCALE_VALUE,
} from '@spectrum-charts/constants';
import { getColorValue, spectrumColors } from '@spectrum-charts/themes';
import { toCamelCase } from '@spectrum-charts/utils';

import { GaugeOptions, GaugeSpecOptions, ColorScheme, ScSpec } from '../types';
import { getGaugeTableData, getGaugeTransforms } from './gaugeDataUtils';
import { addAxes, addMarks } from './gaugeMarkUtils';

const DEFAULT_COLOR = spectrumColors.light['static-blue'];

export const addGauge = produce<
  ScSpec,
  [GaugeOptions & { colorScheme?: ColorScheme; index?: number; idKey: string }]
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
      direction = DEFAULT_GAUGE_DIRECTION,
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
    const gaugeOptions: GaugeSpecOptions = {
      colorScheme: colorScheme,
      index,
      color: getColorValue(color, colorScheme),
      metric: metric ?? 'currentAmount',
      dimension: dimension ?? 'graphLabel',
      target: target ?? 'target',
      name: toCamelCase(name ?? `gauge${index}`),
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

    spec.data = addData(spec.data ?? [], gaugeOptions);
    spec.marks = addMarks(spec.marks ?? [], gaugeOptions);
    spec.scales = addScales(spec.scales ?? [], gaugeOptions);
    spec.signals = addSignals(spec.signals ?? [], gaugeOptions);
    spec.axes = addAxes(spec.axes ?? [], gaugeOptions);
  }
);

export const addScales = produce<Scale[], [GaugeSpecOptions]>((scales, options) => {
  const groupScaleRangeSignal = options.direction === 'column' ? 'gaugeChartHeight' : 'width';
  const xRange = options.direction === 'column' ? 'width' : [0, { signal: 'gaugeGroupWidth' }];
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

export const addSignals = produce<Signal[], [GaugeSpecOptions]>((signals, options) => {
  signals.push({ name: 'gap', value: 12 });
  signals.push({ name: 'gaugeHeight', value: 8 });
  signals.push({ name: 'gaugeThresholdHeight', update: 'gaugeHeight * 3' });
  signals.push({ name: 'targetHeight', update: 'gaugeThresholdHeight + 6' });

  if (options.showTargetValue && options.showTarget) {
    signals.push({ name: 'targetValueLabelHeight', update: '20' });
  }

  signals.push({
    name: 'gaugeGroupHeight',
    update: getGaugeGroupHeightExpression(options),
  });

  if (options.direction === 'column') {
    signals.push({ name: 'paddingRatio', update: 'gap / (gap + gaugeGroupHeight)' });

    if (options.metricAxis && !options.showTargetValue) {
      signals.push({
        name: 'gaugeChartHeight',
        update: "length(data('table')) * gaugeGroupHeight + (length(data('table')) - 1) * gap + 10",
      });
      signals.push({
        name: 'axisOffset',
        update: 'gaugeChartHeight - height - 10',
      });
    } else {
      signals.push({
        name: 'gaugeChartHeight',
        update: "length(data('table')) * gaugeGroupHeight + (length(data('table')) - 1) * gap",
      });
    }
  } else {
    signals.push({ name: 'gaugeGroupWidth', update: "(width / length(data('table'))) - gap" });
    signals.push({ name: 'paddingRatio', update: 'gap / (gap + gaugeGroupWidth)' });
    signals.push({ name: 'gaugeChartHeight', update: 'gaugeGroupHeight' });
  }
});

/**
 * Returns the height of the bullet group based on the options
 * @param options the bullet spec options
 * @returns the height of the bullet group
 */
function getGaugeGroupHeightExpression(options: GaugeSpecOptions): string {
  if (options.showTargetValue && options.showTarget) {
    return options.labelPosition === 'side' && options.direction === 'column'
      ? 'gaugeThresholdHeight + targetValueLabelHeight + 10'
      : 'gaugeThresholdHeight + targetValueLabelHeight + 24';
  } else if (options.labelPosition === 'side' && options.direction === 'column') {
    return 'gaugeThresholdHeight + 10';
  }
  return 'gaugeThresholdHeight + 24';
}

export const addData = produce<Data[], [GaugeSpecOptions]>((data, options) => {
  const tableData = getGaugeTableData(data);
  tableData.transform = getGaugeTransforms(options);
});
