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
import { Axis, GroupMark, Mark, TextValueRef } from 'vega';

import { getColorValue } from '@spectrum-charts/themes';

import { getTextNumberFormat } from '../textUtils';
import { BulletSpecOptions } from '../types';

export const addMarks = produce<Mark[], [BulletSpecOptions]>((marks, bulletOptions) => {
  const markGroupEncodeUpdateDirection = bulletOptions.direction === 'column' ? 'y' : 'x';
  const bulletGroupWidth = bulletOptions.direction === 'column' ? 'width' : 'bulletGroupWidth';

  const bulletMark: GroupMark = {
    name: 'bulletGroup',
    type: 'group',
    from: {
      facet: { data: 'table', name: 'bulletGroups', groupby: `${bulletOptions.dimension}` },
    },
    encode: {
      update: {
        [markGroupEncodeUpdateDirection]: { scale: 'groupScale', field: `${bulletOptions.dimension}` },
        height: { signal: 'bulletGroupHeight' },
        width: { signal: bulletGroupWidth },
      },
    },
    marks: [],
  };

  const thresholds = bulletOptions.thresholds;

  if (Array.isArray(thresholds) && thresholds.length > 0) {
    bulletMark.data = [
      {
        name: 'thresholds',
        values: thresholds,
        transform: [{ type: 'identifier', as: 'id' }],
      },
    ];
    bulletMark.marks?.push(getBulletMarkThreshold(bulletOptions));
  } else if (bulletOptions.track) {
    bulletMark.marks?.push(getBulletTrack(bulletOptions));
  }

  bulletMark.marks?.push(getBulletMarkRect(bulletOptions));
  if (bulletOptions.target && bulletOptions.showTarget !== false) {
    bulletMark.marks?.push(getBulletMarkTarget(bulletOptions));
    if (bulletOptions.showTargetValue) {
      bulletMark.marks?.push(getBulletMarkTargetValueLabel(bulletOptions));
    }
  }

  if (bulletOptions.labelPosition === 'top' || bulletOptions.direction === 'row') {
    bulletMark.marks?.push(getBulletMarkLabel(bulletOptions));
    bulletMark.marks?.push(getBulletMarkValueLabel(bulletOptions));
  }

  marks.push(bulletMark);
});

export function getBulletMarkRect(bulletOptions: BulletSpecOptions): Mark {
  //The vertical positioning is calculated starting at the bulletgroupheight
  //and then subtracting two times the bullet height to center the bullet bar
  //in the middle of the threshold. The 3 is subtracted because the bulletgroup height
  //starts the bullet below the threshold area.
  //Additionally, the value of the targetValueLabelHeight is subtracted if the target value label is shown
  //to make sure that the bullet bar is not drawn over the target value label.
  const bulletMarkRectEncodeUpdateYSignal =
    bulletOptions.showTarget && bulletOptions.showTargetValue
      ? 'bulletGroupHeight - targetValueLabelHeight - 3 - 2 * bulletHeight'
      : 'bulletGroupHeight - 3 - 2 * bulletHeight';

  const fillColor =
    bulletOptions.thresholdBarColor && (bulletOptions.thresholds?.length ?? 0) > 0
      ? [{ field: 'barColor' }]
      : [{ value: bulletOptions.color }];

  const bulletMarkRect: Mark = {
    name: `${bulletOptions.name}Rect`,
    description: `${bulletOptions.name}Rect`,
    type: 'rect',
    from: { data: 'bulletGroups' },
    encode: {
      enter: {
        cornerRadiusTopLeft: [{ test: `datum.${bulletOptions.metric} < 0`, value: 3 }],
        cornerRadiusBottomLeft: [{ test: `datum.${bulletOptions.metric} < 0`, value: 3 }],
        cornerRadiusTopRight: [{ test: `datum.${bulletOptions.metric} > 0`, value: 3 }],
        cornerRadiusBottomRight: [{ test: `datum.${bulletOptions.metric} > 0`, value: 3 }],
        fill: fillColor,
      },
      update: {
        x: { scale: 'xscale', value: 0 },
        x2: { scale: 'xscale', field: `${bulletOptions.metric}` },
        height: { signal: 'bulletHeight' },
        y: { signal: bulletMarkRectEncodeUpdateYSignal },
      },
    },
  };

  return bulletMarkRect;
}

export function getBulletMarkTarget(bulletOptions: BulletSpecOptions): Mark {
  const solidColor = getColorValue('gray-900', bulletOptions.colorScheme);

  //When the target value label is shown, we must subtract the height of the target value label
  //to make sure that the target line is not drawn over the target value label
  const bulletMarkTargetEncodeUpdateY =
    bulletOptions.showTarget && bulletOptions.showTargetValue
      ? 'bulletGroupHeight - targetValueLabelHeight - targetHeight'
      : 'bulletGroupHeight - targetHeight';
  const bulletMarkTargetEncodeUpdateY2 =
    bulletOptions.showTarget && bulletOptions.showTargetValue
      ? 'bulletGroupHeight - targetValueLabelHeight'
      : 'bulletGroupHeight';

  const bulletMarkTarget: Mark = {
    name: `${bulletOptions.name}Target`,
    description: `${bulletOptions.name}Target`,
    type: 'rule',
    from: { data: 'bulletGroups' },
    encode: {
      enter: {
        stroke: { value: `${solidColor}` },
        strokeWidth: { value: 2 },
      },
      update: {
        x: { scale: 'xscale', field: `${bulletOptions.target}` },
        y: { signal: bulletMarkTargetEncodeUpdateY },
        y2: { signal: bulletMarkTargetEncodeUpdateY2 },
      },
    },
  };

  return bulletMarkTarget;
}

export function getBulletMarkLabel(bulletOptions: BulletSpecOptions): Mark {
  const barLabelColor = getColorValue('gray-600', bulletOptions.colorScheme);

  const bulletMarkLabel: Mark = {
    name: `${bulletOptions.name}Label`,
    description: `${bulletOptions.name}Label`,
    type: 'text',
    from: { data: 'bulletGroups' },
    encode: {
      enter: {
        text: { signal: `datum.${bulletOptions.dimension}` },
        align: { value: 'left' },
        baseline: { value: 'top' },
        fill: { value: `${barLabelColor}` },
      },
      update: { x: { value: 0 }, y: { value: 0 } },
    },
  };

  return bulletMarkLabel;
}

/**
 * Gets the text production rules for a bullet value label.
 * Handles shortNumber, shortCurrency, and d3 format strings consistently.
 */
export function getBulletValueText(
  numberFormat: string,
  datumProperty: string
): ({ test?: string } & TextValueRef)[] {
  const textRules = getTextNumberFormat(numberFormat || 'standardNumber', datumProperty);
  return [...textRules];
}

export function getBulletMarkValueLabel(bulletOptions: BulletSpecOptions): Mark {
  const defaultColor = getColorValue(bulletOptions.color, bulletOptions.colorScheme);
  const solidColor = getColorValue('gray-900', bulletOptions.colorScheme);
  const encodeUpdateSignalWidth = bulletOptions.direction === 'column' ? 'width' : 'bulletGroupWidth';
  const fillExpr =
    bulletOptions.thresholdBarColor && (bulletOptions.thresholds?.length ?? 0) > 0
      ? `datum.barColor === '${defaultColor}' ? '${solidColor}' : datum.barColor`
      : `'${solidColor}'`;

  const bulletMarkValueLabel: Mark = {
    name: `${bulletOptions.name}ValueLabel`,
    description: `${bulletOptions.name}ValueLabel`,
    type: 'text',
    from: { data: 'bulletGroups' },
    encode: {
      enter: {
        text: getBulletValueText(bulletOptions.numberFormat || 'standardNumber', bulletOptions.metric),
        align: { value: 'right' },
        baseline: { value: 'top' },
        fill: { signal: fillExpr },
      },
      update: { x: { signal: encodeUpdateSignalWidth }, y: { value: 0 } },
    },
  };

  return bulletMarkValueLabel;
}

export function getBulletMarkTargetValueLabel(bulletOptions: BulletSpecOptions): Mark {
  const solidColor = getColorValue('gray-900', bulletOptions.colorScheme);
  const valueExpr = `datum.${bulletOptions.target}`;
  const formatSignal = buildFormatSignal(valueExpr, bulletOptions.numberFormat || 'standardNumber');

  const bulletMarkTargetValueLabel: Mark = {
    name: `${bulletOptions.name}TargetValueLabel`,
    description: `${bulletOptions.name}TargetValueLabel`,
    type: 'text',
    from: { data: 'bulletGroups' },
    encode: {
      enter: {
        text: {
          signal: `${valueExpr} != null ? 'Target: ' + (${formatSignal}) : 'No Target'`,
        },
        align: { value: 'center' },
        baseline: { value: 'top' },
        fill: { value: `${solidColor}` },
      },
      update: {
        x: { scale: 'xscale', field: `${bulletOptions.target}` },
        y: { signal: 'bulletGroupHeight - targetValueLabelHeight + 6' },
      },
    },
  };

  return bulletMarkTargetValueLabel;
}

export function getBulletMarkThreshold(bulletOptions: BulletSpecOptions): Mark {
  // Vertically center the threshold bar by offsetting from bulletGroupHeight.
  // Subtract 3 for alignment and targetValueLabelHeight if the label is shown.
  const baseHeightSignal = 'bulletGroupHeight - 3 - bulletThresholdHeight';
  const encodeUpdateYSignal =
    bulletOptions.showTarget && bulletOptions.showTargetValue
      ? `${baseHeightSignal} - targetValueLabelHeight`
      : baseHeightSignal;

  const bulletMarkThreshold: Mark = {
    name: `${bulletOptions.name}Threshold`,
    description: `${bulletOptions.name}Threshold`,
    type: 'rect',
    from: { data: 'thresholds' },
    clip: true,
    encode: {
      enter: {
        cornerRadiusTopLeft: [{ test: `!isDefined(datum.thresholdMin) && domain('xscale')[0] !== 0`, value: 3 }],
        cornerRadiusBottomLeft: [{ test: `!isDefined(datum.thresholdMin) && domain('xscale')[0] !== 0`, value: 3 }],
        cornerRadiusTopRight: [{ test: `!isDefined(datum.thresholdMax) && domain('xscale')[1] !== 0`, value: 3 }],
        cornerRadiusBottomRight: [{ test: `!isDefined(datum.thresholdMax) && domain('xscale')[1] !== 0`, value: 3 }],
        fill: { field: 'fill' },
        fillOpacity: { value: 0.2 },
      },
      update: {
        x: {
          signal: "isDefined(datum.thresholdMin) ? scale('xscale', datum.thresholdMin) : 0",
        },
        x2: {
          signal: "isDefined(datum.thresholdMax) ? scale('xscale', datum.thresholdMax) : width",
        },
        height: { signal: 'bulletThresholdHeight' },
        y: { signal: encodeUpdateYSignal },
      },
    },
  };
  return bulletMarkThreshold;
}

export function getBulletTrack(bulletOptions: BulletSpecOptions): Mark {
  const trackColor = getColorValue('gray-200', bulletOptions.colorScheme);
  const trackWidth = bulletOptions.direction === 'column' ? 'width' : 'bulletGroupWidth';
  // Subtracting 20 accounts for the space used by the target value label
  const trackY =
    bulletOptions.showTarget && bulletOptions.showTargetValue
      ? 'bulletGroupHeight - 3 - 2 * bulletHeight - 20'
      : 'bulletGroupHeight - 3 - 2 * bulletHeight';

  const bulletTrack: Mark = {
    name: `${bulletOptions.name}Track`,
    description: `${bulletOptions.name}Track`,
    type: 'rect',
    from: { data: 'bulletGroups' },
    encode: {
      enter: {
        fill: { value: trackColor },
        cornerRadiusTopRight: [{ test: "domain('xscale')[1] !== 0", value: 3 }],
        cornerRadiusBottomRight: [{ test: "domain('xscale')[1] !== 0", value: 3 }],
        cornerRadiusTopLeft: [{ test: "domain('xscale')[0] !== 0", value: 3 }],
        cornerRadiusBottomLeft: [{ test: "domain('xscale')[0] !== 0", value: 3 }],
      },
      update: {
        x: { value: 0 },
        width: { signal: trackWidth },
        height: { signal: 'bulletHeight' },
        y: { signal: trackY },
      },
    },
  };

  return bulletTrack;
}

export function getBulletLabelAxesLeft(labelOffset): Axis {
  return {
    scale: 'groupScale',
    orient: 'left',
    tickSize: 0,
    labelOffset: labelOffset,
    labelPadding: 10,
    labelColor: '#797979',
    domain: false,
  };
}

/**
 * Builds a format signal expression for the given value expression and numberFormat.
 * This would make sense as a re-usable utility, but keeping it here for now since bullet is alpha
 * and we don't have another component that needs the utility yet.
 */
function buildFormatSignal(valueExpr: string, numberFormat: string): string {
  if (numberFormat === 'shortNumber') {
    return `formatShortNumber(${valueExpr})`;
  }
  if (numberFormat === 'shortCurrency') {
    return String.raw`abs(${valueExpr}) >= 1000 ? upper(replace(format(${valueExpr}, '$.3~s'), /(\d+)G/, '$1B')) : format(${valueExpr}, '$')`;
  }
  if (numberFormat === 'currency') {
    return `format(${valueExpr}, '$,.2f')`;
  }
  if (numberFormat === 'standardNumber') {
    return `format(${valueExpr}, ',')`;
  }
  // Default: use d3 format string
  return `format(${valueExpr}, '${numberFormat}')`;
}

export function getBulletLabelAxesRight(bulletOptions: BulletSpecOptions, labelOffset): Axis {
  const valueExpr = `info(data('table')[datum.index * (length(data('table')) - 1)].${bulletOptions.metric})`;
  const formatSignal = buildFormatSignal(valueExpr, bulletOptions.numberFormat || 'standardNumber');

  return {
    scale: 'groupScale',
    orient: 'right',
    tickSize: 0,
    labelOffset: labelOffset,
    labelPadding: 10,
    domain: false,
    encode: {
      labels: {
        update: {
          text: {
            // Wrap formatSignal in parens to handle ternary expressions
            signal: `${valueExpr} != null ? (${formatSignal}) : ''`,
          },
        },
      },
    },
  };
}

export function getBulletScaleAxes(bulletOptions: BulletSpecOptions): Axis {
  const formatSignal = buildFormatSignal('datum.value', bulletOptions.numberFormat || 'standardNumber');

  return {
    labelOffset: 2,
    scale: 'xscale',
    orient: 'bottom',
    ticks: false,
    labelColor: 'gray',
    domain: false,
    tickCount: 5,
    offset: { signal: 'axisOffset' },
    encode: {
      labels: {
        update: {
          text: {
            // Wrap formatSignal in parens to handle ternary expressions
            signal: `(${formatSignal})`,
          },
        },
      },
    },
  };
}

export const addAxes = produce<Axis[], [BulletSpecOptions]>((axes, bulletOptions) => {
  if (bulletOptions.metricAxis && bulletOptions.direction === 'column' && !bulletOptions.showTargetValue) {
    axes.push(getBulletScaleAxes(bulletOptions));
  }

  if (bulletOptions.labelPosition === 'side' && bulletOptions.direction === 'column') {
    const labelOffset = bulletOptions.showTargetValue && bulletOptions.showTarget ? -8 : 2;
    axes.push(getBulletLabelAxesLeft(labelOffset), getBulletLabelAxesRight(bulletOptions, labelOffset));
  }
});
