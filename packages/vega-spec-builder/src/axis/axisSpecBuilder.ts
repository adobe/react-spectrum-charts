/*
 * Copyright 2023 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
import deepmerge from 'deepmerge';
import { produce } from 'immer';
import {
  Axis,
  AxisEncode,
  Data,
  GroupMark,
  Mark,
  ScaleType,
  Signal
} from 'vega';

import {
  COLOR_SCALE,
  DEFAULT_COLOR_SCHEME,
  DEFAULT_FONT_COLOR,
  DEFAULT_GRANULARITY,
  DEFAULT_LABEL_ALIGN,
  DEFAULT_LABEL_FONT_WEIGHT,
  DEFAULT_LABEL_ORIENTATION,
  FIRST_RSC_SERIES_ID,
  FADE_FACTOR,
  LAST_RSC_SERIES_ID,
  MOUSE_OVER_SERIES
} from '@spectrum-charts/constants';
import { spectrumColors } from '@spectrum-charts/themes';

import {
  addAxisAnnotationAxis,
  addAxisAnnotationData,
  addAxisAnnotationMarks,
  addAxisAnnotationSignals,
  getAxisAnnotationsFromChildren,
} from '../axisAnnotation/axisAnnotationUtils';
import { getDualAxisScaleNames, getScaleField } from '../scale/scaleUtils';
import { getGenericValueSignal } from '../signal/signalSpecBuilder';
import { AxisOptions, AxisSpecOptions, ColorScheme, Label, Orientation, Position, ScSpec, UserMeta } from '../types';
import { getAxisLabelsEncoding, getControlledLabelAnchorValues, getLabelValue } from './axisLabelUtils';
import { getReferenceLineMarks, getReferenceLines, scaleTypeSupportsReferenceLines } from './axisReferenceLineUtils';
import {
  addAxisThumbnailSignals,
  getAxisThumbnailLabelOffset,
  getAxisThumbnailMarks,
  getAxisThumbnails,
  scaleTypeSupportsThumbnails,
} from './axisThumbnailUtils';
import { encodeAxisTitle, getTrellisAxisOptions, isTrellisedChart } from './axisTrellisUtils';
import {
  getBaselineRule,
  getDefaultAxis,
  getIsMetricAxis,
  getOpposingScaleType,
  getScale,
  getSubLabelAxis,
  getTimeAxes,
  hasSubLabels
} from './axisUtils';

export const addAxis = produce<ScSpec, [AxisOptions & { colorScheme?: ColorScheme; index?: number }]>(
  (
    spec,
    {
      name,
      axisAnnotations = [],
      axisThumbnails = [],
      baseline = false,
      baselineOffset = 0,
      colorScheme = DEFAULT_COLOR_SCHEME,
      granularity = DEFAULT_GRANULARITY,
      grid = false,
      hideDefaultLabels = false,
      index = 0,
      labelAlign = DEFAULT_LABEL_ALIGN,
      labelFontWeight = DEFAULT_LABEL_FONT_WEIGHT,
      labelLimit,
      labelOrientation = DEFAULT_LABEL_ORIENTATION,
      labels = [],
      numberFormat = 'shortNumber',
      position,
      range,
      referenceLines = [],
      subLabels = [],
      ticks = false,
      ...options
    }
  ) => {
    // get the scale that this axis will be associated with
    const scale = getScale(spec.scales ?? [], position);
    const scaleName = name || scale.name;
    const scaleType = scale.type;
    const scaleField = getScaleField(scale);

    // get the opposing scale
    const opposingScaleType = getOpposingScaleType(spec.scales ?? [], position);

    // reconstruct options with defaults
    const axisOptions: AxisSpecOptions = {
      axisAnnotations,
      axisThumbnails,
      baseline,
      baselineOffset,
      colorScheme,
      granularity,
      grid,
      hideDefaultLabels,
      index,
      labelAlign,
      labelFontWeight,
      labelLimit,
      labelOrientation,
      labels,
      name: `axis${index}`,
      numberFormat,
      position,
      range,
      referenceLines,
      subLabels,
      ticks,
      scaleType: scaleType ?? 'linear',
      ...options,
    };

    const dualMetricAxis = spec.signals?.some((signal) => signal.name === 'firstRscSeriesId');

    spec.data = addAxisData(spec.data ?? [], { ...axisOptions, scaleType: scaleType ?? 'linear' });
    spec.signals = addAxisSignals(spec.signals ?? [], axisOptions, scaleName);

    // set custom range if applicable
    if (range && (scaleType === 'linear' || scaleType === 'time')) {
      scale.domain = range;
    }

    const usermeta = spec.usermeta;
    spec.axes = addAxes(spec.axes ?? [], {
      ...axisOptions,
      scaleName,
      opposingScaleType,
      usermeta,

      // we don't want to show the grid on top level
      // axes for trellised charts
      grid: axisOptions.grid && !isTrellisedChart(spec),
      dualMetricAxis,
    });

    spec.marks = addAxesMarks(spec.marks ?? [], {
      ...axisOptions,
      usermeta,
      scaleName,
      scaleField,
      opposingScaleType,
      dualMetricAxis,
    });

    return spec;
  }
);

export const addAxisData = produce<Data[], [AxisSpecOptions & { scaleType: ScaleType }]>((data, options) => {
  const axisAnnotations = getAxisAnnotationsFromChildren(options);
  axisAnnotations.forEach((annotationOptions) => {
    addAxisAnnotationData(data, annotationOptions);
  });
});

export const addAxisSignals = produce<Signal[], [AxisSpecOptions, string]>((signals, options, scaleName) => {
  const { name, labels, position, subLabels, labelOrientation } = options;
  if (labels?.length) {
    // add all the label properties to a signal so that the axis encoding can use it to style each label correctly
    signals.push(getGenericValueSignal(`${name}_labels`, getLabelSignalValue(labels, position, labelOrientation)));
  }
  if (hasSubLabels(options)) {
    // add all the sublabel properties to a signal so that the axis encoding can use it to style each sublabel correctly
    signals.push(
      getGenericValueSignal(
        `${name}_subLabels`,
        subLabels.map((label) => ({
          ...label,
          // convert label align to vega align
          ...getControlledLabelAnchorValues(position, labelOrientation, label.align),
        }))
      )
    );
  }
  const axisAnnotations = getAxisAnnotationsFromChildren(options);
  axisAnnotations.forEach((annotationOptions) => {
    addAxisAnnotationSignals(signals, annotationOptions);
  });

  const axisThumbnails = getAxisThumbnails(options);
  axisThumbnails.forEach(({name}) => {
    addAxisThumbnailSignals(signals, name, scaleName);
  });
});

/**
 * Gets the labels that have style properties on them and gets the correct alignment value based on axis position
 * @param labels
 * @param position
 * @returns
 */
export const getLabelSignalValue = (
  labels: (Label | string | number)[],
  position: Position,
  labelOrientation: Orientation
) =>
  labels
    .map((label) => {
      // if this label is a string or number, then it doesn't need to be a signal
      if (typeof label !== 'object') {
        return;
      }
      return {
        ...label,
        ...getControlledLabelAnchorValues(position, labelOrientation, label.align),
      };
    })
    .filter(Boolean);

/**
 * Applies fill and opacity encoding rules to the secondary metric axis
 * @param axis Axis to apply encoding rules to
 */
export function applySecondaryMetricAxisEncodings(axis: Axis): void {
  const secondaryAxisFillRules = [{ signal: `scale('${COLOR_SCALE}', ${LAST_RSC_SERIES_ID})` }];

  const secondaryAxisFillOpacityRules = [
    {
      test: `isValid(${MOUSE_OVER_SERIES}) && ${MOUSE_OVER_SERIES} !== ${LAST_RSC_SERIES_ID}`,
      value: FADE_FACTOR,
    },
  ];

  const encodings = {
    labels: {
      enter: {
        fill: secondaryAxisFillRules,
      },
      update: {
        fillOpacity: secondaryAxisFillOpacityRules,
      },
    },
    title: {
      enter: {
        fill: secondaryAxisFillRules,
      },
      update: {
        fillOpacity: secondaryAxisFillOpacityRules,
      },
    },
  };

  if (!axis.encode) {
    axis.encode = encodings;
  } else {
    axis.encode = deepmerge(axis.encode, encodings);
  }
}

/**
 * Applies fill and opacity encoding rules to the primary metric axis
 * @param axis Axis to apply encoding rules to
 * @param colorScheme The color scheme (light or dark)
 */
export function applyPrimaryMetricAxisEncodings(axis: Axis, colorScheme: ColorScheme = DEFAULT_COLOR_SCHEME): void {
  // Get the appropriate font color value based on the colorScheme (light/dark theme)
  const defaultFontColor = spectrumColors[colorScheme][DEFAULT_FONT_COLOR];

  const primaryAxisFillRules = [
    {
      test: `length(domain('${COLOR_SCALE}')) -1 === 1`,
      signal: `scale('${COLOR_SCALE}', ${FIRST_RSC_SERIES_ID})`,
    },
    { value: defaultFontColor },
  ];
  const primaryAxisFillOpacityRules = [
    {
      test: `${MOUSE_OVER_SERIES} === ${LAST_RSC_SERIES_ID}`,
      value: FADE_FACTOR,
    },
  ];

  const encodings = {
    labels: {
      update: {
        fill: primaryAxisFillRules,
        fillOpacity: primaryAxisFillOpacityRules,
      },
    },
    title: {
      update: {
        fill: primaryAxisFillRules,
        fillOpacity: primaryAxisFillOpacityRules,
      },
    },
  };

  if (!axis.encode) {
    axis.encode = encodings;
  } else {
    axis.encode = deepmerge(axis.encode, encodings);
  }
}

/**
 * Handles the dual Y axis logic for axis styling
 * @param axis The axis to process
 * @param usermeta The user metadata
 * @param scaleName The name of the scale
 */
export function addDualMetricAxisConfig(
  axis: Axis,
  isPrimaryMetricAxis: boolean,
  scaleName: string,
  colorScheme: ColorScheme = DEFAULT_COLOR_SCHEME
) {
  const scaleNames = getDualAxisScaleNames(scaleName);
  const { primaryScale, secondaryScale } = scaleNames;

  if (isPrimaryMetricAxis) {
    axis.scale = primaryScale;
    applyPrimaryMetricAxisEncodings(axis, colorScheme);
  } else {
    axis.scale = secondaryScale;
    applySecondaryMetricAxisEncodings(axis);
  }
}

export interface AxisAddOptions extends AxisSpecOptions {
  scaleName: string;
  opposingScaleType?: ScaleType;
  usermeta?: UserMeta;
  dualMetricAxis?: boolean;
}

/**
 * Add axes to the spec
 * @param axes The axes to add
 * @param options The axis options
 * @returns The updated axes
 */
export const addAxes = produce<
  Axis[],
  [
    AxisSpecOptions & {
      scaleName: string;
      opposingScaleType?: string;
      dualMetricAxis?: boolean;
      usermeta: UserMeta;
    }
  ]
>((axes, { scaleName, opposingScaleType, dualMetricAxis, ...axisOptions }) => {
  const newAxes: Axis[] = [];
  // adds all the trellis axis options if this is a trellis axis
  axisOptions = { ...axisOptions, ...getTrellisAxisOptions(scaleName) };
  const {
    baseline,
    colorScheme,
    usermeta,
    labelAlign,
    labelFontWeight,
    labelFormat,
    labelOrientation,
    name,
    position,
    hasTooltip,
  } = axisOptions;

  if (labelFormat === 'time') {
    // time axis actually needs two axes. A primary and secondary.
    newAxes.push(...getTimeAxes(scaleName, axisOptions));
  } else {
    const axis = getDefaultAxis(axisOptions, scaleName);
    // if labels exist, add them to the axis
    if (axisOptions.labels.length) {
      const labels = axisOptions.labels;
      const signalName = `${name}_labels`;
      axis.values = labels.map((label) => getLabelValue(label));
      const baseEncoding = getAxisLabelsEncoding(
        labelAlign,
        labelFontWeight,
        'label',
        labelOrientation,
        position,
        signalName
      );
      const encodingWithOptionalTooltip = hasTooltip
        ? {
            ...baseEncoding,
            update: {
              ...baseEncoding.update,
              tooltip: { signal: 'datum.value' },
            },
          }
        : baseEncoding;
      axis.encode = {
        labels: {
          interactive: hasTooltip,
          ...encodingWithOptionalTooltip,
        },
      };
    }

    // if sublabels exist, create a new axis for the sub labels
    if (hasSubLabels(axisOptions)) {
      axis.titlePadding = 24;

      // add sublabel axis
      const subLabelAxis = getSubLabelAxis(axisOptions, scaleName);

      handleDualMetricAxisConfig({
        dualMetricAxis,
        axis: subLabelAxis,
        usermeta,
        scaleName,
        colorScheme,
        position,
        incrementMetricAxisCount: false,
      });

      newAxes.push(subLabelAxis);
    }

    handleDualMetricAxisConfig({
      dualMetricAxis,
      axis,
      usermeta,
      scaleName,
      colorScheme,
      position,
      incrementMetricAxisCount: true,
    });

    newAxes.unshift(axis);
  }

  // add baseline
  if (opposingScaleType !== 'linear') {
    newAxes[0] = setAxisBaseline(newAxes[0], baseline);
  }

  if (scaleTypeSupportsReferenceLines(axisOptions.scaleType)) {
    // encode axis to hide labels that overlap reference line icons
    const referenceLines = getReferenceLines(axisOptions);
    referenceLines.forEach((referenceLineOptions) => {
      const { label: referenceLineLabel, icon, value, position: linePosition } = referenceLineOptions;
      const text = newAxes[0].encode?.labels?.update?.text;
      if ((icon || referenceLineLabel) && text && Array.isArray(text) && (!linePosition || linePosition === 'center')) {
        // if the label is within 30 pixels of the reference line icon, hide it
        text.unshift({
          test: `abs(scale('${scaleName}', ${value}) - scale('${scaleName}', datum.value)) < 30`,
          value: '',
        });
      }
    });
  }

  if (scaleTypeSupportsThumbnails(axisOptions.scaleType)) {
    const axisThumbnails = getAxisThumbnails(axisOptions);
    axisThumbnails.forEach((axisThumbnailOptions) => {
      const encodings: AxisEncode = {
        labels: {
          update: {
            ...getAxisThumbnailLabelOffset(axisThumbnailOptions.name, position),
          },
        },
      };

      // apply encodings to all axes
      newAxes.forEach((axis) => {
        if (!axis.encode) {
          axis.encode = encodings;
        } else {
          axis.encode = deepmerge(axis.encode, encodings);
        }
      });
    });
  }

  const axisAnnotations = getAxisAnnotationsFromChildren(axisOptions);
  axisAnnotations.forEach((annotationOptions) => {
    addAxisAnnotationAxis(newAxes, annotationOptions, scaleName);
  });

  axes.push(...newAxes);
});

/**
 * Adds dual metric axis configuration to the axis
 * This applies color and opacity encodings based on the series involved
 */
const handleDualMetricAxisConfig = ({
  dualMetricAxis,
  axis,
  usermeta,
  scaleName,
  colorScheme,
  position,
  incrementMetricAxisCount,
}: {
  dualMetricAxis: boolean | undefined;
  axis: Axis;
  usermeta: UserMeta;
  scaleName: string;
  colorScheme: ColorScheme;
  position: Position;
  incrementMetricAxisCount: boolean;
}) => {
  const chartOrientation = usermeta?.chartOrientation ?? 'vertical';
  if (dualMetricAxis && getIsMetricAxis(position, chartOrientation)) {
    if (!usermeta.metricAxisCount) {
      usermeta.metricAxisCount = 0;
    }
    addDualMetricAxisConfig(axis, usermeta.metricAxisCount === 0, scaleName, colorScheme);
    if (incrementMetricAxisCount) {
      usermeta.metricAxisCount++;
    }
  }
};

export const addAxesMarks = produce<
  Mark[],
  [
    AxisSpecOptions & {
      scaleName: string;
      scaleField?: string;
      scaleType?: ScaleType;
      opposingScaleType?: string;
      dualMetricAxis?: boolean;
      usermeta: UserMeta;
    }
  ]
>((marks, options) => {
  const { baseline, baselineOffset, opposingScaleType, position, scaleField, scaleName, scaleType, usermeta } = options;

  // only add reference lines to linear or time scales
  if (scaleTypeSupportsReferenceLines(scaleType)) {
    const { back, front } = getReferenceLineMarks(options, scaleName);
    marks.unshift(...back);
    marks.push(...front);
  }

  const trellisGroupMark = marks.find((mark) => mark.name?.includes('Trellis')) as GroupMark;
  const isTrellised = Boolean(trellisGroupMark);

  if (baseline && opposingScaleType === 'linear') {
    addBaseline(marks, baselineOffset, position, trellisGroupMark);
  }

  if (isTrellised) {
    addAxesToTrellisGroup(options, trellisGroupMark, scaleName, usermeta);
  }

  const axisAnnotations = getAxisAnnotationsFromChildren(options);
  axisAnnotations.forEach((annotationOptions) => {
    addAxisAnnotationMarks(marks, annotationOptions, scaleName);
  });

  if (scaleTypeSupportsThumbnails(scaleType) && scaleField) {
    const axisThumbnailMarks = getAxisThumbnailMarks(options, scaleName, scaleField);
    marks.push(...axisThumbnailMarks);
  }
});

function addBaseline(marks: Mark[], baselineOffset: number, position: Position, trellisGroupMark: GroupMark) {
  const baselineRule = getBaselineRule(baselineOffset, position);

  // if the chart is trellised, add the baseline to the trellis mark group
  if (trellisGroupMark && 'marks' in trellisGroupMark) {
    if (baselineOffset === 0) {
      trellisGroupMark.marks?.push(baselineRule);
    } else {
      trellisGroupMark.marks?.unshift(baselineRule);
    }
  } else if (baselineOffset === 0) {
    marks.push(baselineRule);
  } else {
    marks.unshift(baselineRule);
  }
}

function addAxesToTrellisGroup(
  options: AxisSpecOptions,
  trellisGroupMark: GroupMark,
  scaleName: string,
  usermeta: UserMeta
) {
  const trellisOrientation = trellisGroupMark.name?.startsWith('x') ? 'horizontal' : 'vertical';
  const axisOrientation = options.position === 'bottom' || options.position === 'top' ? 'horizontal' : 'vertical';

  // hide labels if the axis is not in the same orientation as the trellis
  // for example, we don't want x-axis labels on a vertical trellis
  const hideDefaultLabels = options.hideDefaultLabels || trellisOrientation !== axisOrientation;

  let scaleType = options.scaleType;
  // get the scale that this axis will be associated with
  if (trellisOrientation === axisOrientation) {
    const scale = getScale(trellisGroupMark.scales ?? [], options.position);
    scaleName = scale.name;
    scaleType = scale.type ?? 'linear';
  } else {
    // if the axis is not the same orientation as the trellis, then we don't display the title
    // because it will be displayed on the root axis at the spec level
    options.title = undefined;
  }

  let newAxes = addAxes([], {
    ...options,
    hideDefaultLabels,
    scaleName,
    scaleType,
    dualMetricAxis: false, // trellis axes don't support dualMetricAxis scaling
    usermeta,
  });

  // titles on axes within the trellis group have special encodings so that the title is only shown on the first axis
  newAxes = encodeAxisTitle(newAxes, trellisGroupMark);

  trellisGroupMark.axes = [...(trellisGroupMark.axes ?? []), ...newAxes];
}

export function setAxisBaseline(axis: Axis, baseline = false): Axis {
  // Vega's property is "domain" - we use "baseline"
  return { ...axis, domain: baseline, domainWidth: 2 };
}
