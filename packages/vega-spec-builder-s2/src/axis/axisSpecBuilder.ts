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
import deepmerge from 'deepmerge';
import { produce } from 'immer';
import { Axis, AxisEncode, Data, GroupMark, Mark, ScaleType, Signal } from 'vega';

import {
  COLOR_SCALE,
  DEFAULT_COLOR_SCHEME,
  DEFAULT_FONT_COLOR,
  DEFAULT_GRANULARITY,
  DEFAULT_LABEL_ALIGN,
  DEFAULT_LABEL_FONT_WEIGHT,
  DEFAULT_LABEL_ORIENTATION,
  FADE_FACTOR,
  FIRST_RSC_SERIES_ID,
  HOVERED_ITEM,
  LAST_RSC_SERIES_ID,
  SERIES_ID,
} from '@spectrum-charts/constants';
import { spectrum2Colors } from '@spectrum-charts/themes';

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
import {
  addAxisLabelHoverSignalWiring,
  getAxisLabelDimensionFillOpacity,
  getAxisLabelHoverMarkName,
  getMatchingInteractiveBarDimensionFields,
} from './axisLabelHoverUtils';
import { getAxisLabelsEncoding, getControlledLabelAnchorValues, getLabelValue } from './axisLabelUtils';
import { getReferenceLineMarks, scaleTypeSupportsReferenceLines } from './axisReferenceLineUtils';
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
  hasSubLabels,
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
      // don't round values if there's a custom range
      scale.nice = false;
      // if there's a custom range set for linear scale types, we don't want to start the axis at 0
      if (scaleType === 'linear') {
        scale.zero = false;
      }
    }

    const usermeta = spec.usermeta;
    const data = spec.data ?? [];
    spec.axes = addAxes(spec.axes ?? [], {
      ...axisOptions,
      scaleName,
      scaleField,
      opposingScaleType,
      usermeta,
      data,
      signals: spec.signals ?? [],

      // we don't want to show the grid on top level
      // axes for trellised charts
      grid: axisOptions.grid && !isTrellisedChart(spec),
      dualMetricAxis,
    });

    spec.marks = addAxesMarks(spec.marks ?? [], {
      ...axisOptions,
      usermeta,
      data,
      signals: spec.signals ?? [],
      scaleName,
      scaleField,
      opposingScaleType,
      dualMetricAxis,
    });

    if (!hideDefaultLabels) {
      const matchingBars = getMatchingInteractiveBarDimensionFields(
        data,
        spec.signals ?? [],
        getEffectiveScaleField(spec, position, scaleField)
      );
      spec.signals = addAxisLabelHoverSignalWiring(
        spec.signals ?? [],
        matchingBars,
        getAxisLabelHoverMarkName(axisOptions.name)
      );
    }

    return spec;
  }
);

/**
 * For a trellised chart, the outer scale's field (e.g. the trellis/facet field) is not the field
 * that the trellis group's own inner per-panel axis actually renders - that lives on a separate
 * scale scoped to the trellis group. Resolves to that inner field when this axis's orientation
 * matches the trellis orientation, otherwise falls back to the outer scaleField unchanged.
 */
function getEffectiveScaleField(spec: ScSpec, position: Position, scaleField?: string): string | undefined {
  const trellisGroupMark = spec.marks?.find((mark) => mark.name?.includes('Trellis')) as GroupMark | undefined;
  if (!trellisGroupMark) return scaleField;

  const trellisOrientation = trellisGroupMark.name?.startsWith('x') ? 'horizontal' : 'vertical';
  const axisOrientation = position === 'bottom' || position === 'top' ? 'horizontal' : 'vertical';
  if (trellisOrientation !== axisOrientation) return scaleField;

  const scale = getScale(trellisGroupMark.scales ?? [], position);
  return getScaleField(scale);
}

export const addAxisData = produce<Data[], [AxisSpecOptions & { scaleType: ScaleType }]>((data, options) => {
  const axisAnnotations = getAxisAnnotationsFromChildren(options);
  for (const annotation of axisAnnotations) {
    addAxisAnnotationData(data, annotation);
  }
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
  for (const annotation of getAxisAnnotationsFromChildren(options)) {
    addAxisAnnotationSignals(signals, annotation);
  }
  for (const axisThumbnail of getAxisThumbnails(options)) {
    addAxisThumbnailSignals(signals, axisThumbnail.name, scaleName);
  }
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
export function applySecondaryMetricAxisEncodings(axis: Axis, interactiveMarks: string[]): void {
  const secondaryAxisFillRules = [{ signal: `scale('${COLOR_SCALE}', ${LAST_RSC_SERIES_ID})` }];

  const fillOpacity = interactiveMarks.map((interactiveMark) => ({
    test: `isValid(${interactiveMark}_${HOVERED_ITEM})`,
    signal: `${interactiveMark}_${HOVERED_ITEM}.${SERIES_ID} === ${LAST_RSC_SERIES_ID} ? 1 : ${FADE_FACTOR}`,
  }));

  const encodings = {
    labels: {
      enter: {
        fill: secondaryAxisFillRules,
      },
      update: {
        fillOpacity,
      },
    },
    title: {
      enter: {
        fill: secondaryAxisFillRules,
      },
      update: {
        fillOpacity,
      },
    },
  };

  if (axis.encode) {
    axis.encode = deepmerge(axis.encode, encodings);
  } else {
    axis.encode = encodings;
  }
}

/**
 * Applies fill and opacity encoding rules to the primary metric axis
 * @param axis Axis to apply encoding rules to
 * @param colorScheme The color scheme (light or dark)
 */
export function applyPrimaryMetricAxisEncodings(
  axis: Axis,
  interactiveMarks: string[],
  colorScheme: ColorScheme = DEFAULT_COLOR_SCHEME
): void {
  // Get the appropriate font color value based on the colorScheme (light/dark theme)
  const defaultFontColor = spectrum2Colors[colorScheme][DEFAULT_FONT_COLOR];

  const primaryAxisFillRules = [
    {
      test: `length(domain('${COLOR_SCALE}')) -1 === 1`,
      signal: `scale('${COLOR_SCALE}', ${FIRST_RSC_SERIES_ID})`,
    },
    { value: defaultFontColor },
  ];

  const fillOpacity = interactiveMarks.map((interactiveMark) => ({
    test: `isValid(${interactiveMark}_${HOVERED_ITEM})`,
    signal: `${interactiveMark}_${HOVERED_ITEM}.${SERIES_ID} !== ${LAST_RSC_SERIES_ID} ? 1 : ${FADE_FACTOR}`,
  }));

  const encodings = {
    labels: {
      update: {
        fill: primaryAxisFillRules,
        fillOpacity,
      },
    },
    title: {
      update: {
        fill: primaryAxisFillRules,
        fillOpacity,
      },
    },
  };

  if (axis.encode) {
    axis.encode = deepmerge(axis.encode, encodings);
  } else {
    axis.encode = encodings;
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
  interactiveMarks: string[],
  colorScheme: ColorScheme = DEFAULT_COLOR_SCHEME
) {
  const scaleNames = getDualAxisScaleNames(scaleName);
  const { primaryScale, secondaryScale } = scaleNames;

  if (isPrimaryMetricAxis) {
    axis.scale = primaryScale;
    applyPrimaryMetricAxisEncodings(axis, interactiveMarks, colorScheme);
  } else {
    axis.scale = secondaryScale;
    applySecondaryMetricAxisEncodings(axis, interactiveMarks);
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
      scaleField?: string;
      opposingScaleType?: string;
      dualMetricAxis?: boolean;
      usermeta: UserMeta;
      data?: Data[];
      signals?: Signal[];
    }
  ]
>((axes, { scaleName, scaleField, opposingScaleType, dualMetricAxis, data = [], signals = [], ...axisOptions }) => {
  const newAxes: Axis[] = [];
  // adds all the trellis axis options if this is a trellis axis
  axisOptions = { ...axisOptions, ...getTrellisAxisOptions(scaleName) };
  const { baseline, labelFormat, position } = axisOptions;

  if (labelFormat === 'time') {
    // time axis actually needs two axes. A primary and secondary.
    newAxes.push(...getTimeAxes(scaleName, axisOptions));
  } else {
    buildStandardAxes(newAxes, axisOptions, scaleName, data, signals, scaleField, dualMetricAxis);
  }

  // add baseline
  if (opposingScaleType !== 'linear') {
    newAxes[0] = setAxisBaseline(newAxes[0], baseline);
  }

  applyAxisThumbnailEncodings(newAxes, axisOptions, position);

  const axisAnnotations = getAxisAnnotationsFromChildren(axisOptions);
  for (const axisAnnotation of axisAnnotations) {
    addAxisAnnotationAxis(newAxes, axisAnnotation, scaleName);
  }

  axes.push(...newAxes);
});

/**
 * Builds the standard (non-time-format) axis - and, if configured, its paired sub-label axis -
 * and pushes them onto `newAxes`. Split out of `addAxes` to keep cognitive complexity down.
 */
function buildStandardAxes(
  newAxes: Axis[],
  axisOptions: AxisSpecOptions & { usermeta: UserMeta },
  scaleName: string,
  data: Data[],
  signals: Signal[],
  scaleField?: string,
  dualMetricAxis?: boolean
): void {
  const { colorScheme, position, usermeta } = axisOptions;
  const axis = getDefaultAxis(axisOptions, scaleName);

  applyAxisLabelEncodings(axis, axisOptions, data, signals, scaleField);

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

/**
 * Stamps hover-mark-name/interactive/fillOpacity encoding onto an axis's labels, for both the
 * default (auto-generated) label case and the custom `labels` prop case. Split out of `addAxes`
 * to keep cognitive complexity down.
 */
function applyAxisLabelEncodings(
  axis: Axis,
  axisOptions: AxisSpecOptions,
  data: Data[],
  signals: Signal[],
  scaleField?: string
): void {
  const { hideDefaultLabels, labelAlign, labelFontWeight, labelOrientation, name, position, hasTooltip } = axisOptions;

  const matchingBarDimensionFields = hideDefaultLabels
    ? []
    : getMatchingInteractiveBarDimensionFields(data, signals, scaleField);
  const hasMatchingDimensionBar = matchingBarDimensionFields.length > 0;

  if (hasMatchingDimensionBar) {
    axis.encode = deepmerge(axis.encode ?? {}, {
      labels: {
        name: getAxisLabelHoverMarkName(name),
        interactive: true,
        update: {
          fillOpacity: getAxisLabelDimensionFillOpacity(matchingBarDimensionFields),
        },
      },
    });
  }

  // if labels exist, add them to the axis
  if (!axisOptions.labels.length) return;

  const labels = axisOptions.labels;
  const signalName = `${name}_labels`;
  axis.values = labels.map((label) => getLabelValue(label));
  const baseEncoding = getAxisLabelsEncoding(labelAlign, labelFontWeight, 'label', labelOrientation, position, signalName);
  const encodingWithOptionalTooltip = hasTooltip
    ? { ...baseEncoding, update: { ...baseEncoding.update, tooltip: { signal: 'datum.value' } } }
    : baseEncoding;

  axis.encode = {
    labels: {
      name: getAxisLabelHoverMarkName(name),
      interactive: hasTooltip || hasMatchingDimensionBar,
      ...encodingWithOptionalTooltip,
      ...(hasMatchingDimensionBar && {
        update: {
          ...encodingWithOptionalTooltip.update,
          fillOpacity: getAxisLabelDimensionFillOpacity(matchingBarDimensionFields),
        },
      }),
    },
  };
}

/**
 * Applies axis-thumbnail label offset encodings to every axis built for this scale. Split out of
 * `addAxes` to keep cognitive complexity down (this was the deepest-nested block: if -> for -> for -> if/else).
 */
function applyAxisThumbnailEncodings(newAxes: Axis[], axisOptions: AxisSpecOptions, position: Position): void {
  if (!scaleTypeSupportsThumbnails(axisOptions.scaleType)) return;

  for (const axisThumbnail of getAxisThumbnails(axisOptions)) {
    const encodings: AxisEncode = {
      labels: {
        update: {
          ...getAxisThumbnailLabelOffset(axisThumbnail.name, position),
        },
      },
    };

    // apply encodings to all axes
    for (const axis of newAxes) {
      axis.encode = axis.encode ? deepmerge(axis.encode, encodings) : encodings;
    }
  }
}

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
    addDualMetricAxisConfig(
      axis,
      usermeta.metricAxisCount === 0,
      scaleName,
      usermeta.interactiveMarks ?? [],
      colorScheme
    );
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
      data?: Data[];
      signals?: Signal[];
    }
  ]
>((marks, options) => {
  const {
    baseline,
    baselineOffset,
    opposingScaleType,
    position,
    scaleField,
    scaleName,
    scaleType,
    usermeta,
    data = [],
    signals = [],
  } = options;

  // only add reference lines to linear or time scales
  if (scaleTypeSupportsReferenceLines(scaleType)) {
    marks.push(...getReferenceLineMarks(options, scaleName));
  }

  const trellisGroupMark = marks.find((mark) => mark.name?.includes('Trellis')) as GroupMark;
  const isTrellised = Boolean(trellisGroupMark);

  if (baseline && opposingScaleType === 'linear') {
    addBaseline(marks, baselineOffset, position, trellisGroupMark);
  }

  if (isTrellised) {
    addAxesToTrellisGroup(options, trellisGroupMark, scaleName, usermeta, data, signals, scaleField);
  }

  for (const axisAnnotation of getAxisAnnotationsFromChildren(options)) {
    addAxisAnnotationMarks(marks, axisAnnotation, scaleName);
  }

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
  usermeta: UserMeta,
  data: Data[],
  signals: Signal[],
  scaleField?: string
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
    // the trellis group's inner per-panel scale has its own field, distinct from the outer
    // trellis/facet scale's field - must be recomputed here or axis-label-hover matching
    // (and anything else keyed on scaleField) silently compares against the wrong field.
    scaleField = getScaleField(scale);
  } else {
    // if the axis is not the same orientation as the trellis, then we don't display the title
    // because it will be displayed on the root axis at the spec level
    options.title = undefined;
  }

  let newAxes = addAxes([], {
    ...options,
    hideDefaultLabels,
    scaleName,
    scaleField,
    scaleType,
    dualMetricAxis: false, // trellis axes don't support dualMetricAxis scaling
    usermeta,
    data,
    signals,
  });

  // titles on axes within the trellis group have special encodings so that the title is only shown on the first axis
  newAxes = encodeAxisTitle(newAxes, trellisGroupMark);

  trellisGroupMark.axes = [...(trellisGroupMark.axes ?? []), ...newAxes];
}

export function setAxisBaseline(axis: Axis, baseline = false): Axis {
  // Vega's property is "domain" - we use "baseline"
  return { ...axis, domain: baseline, domainWidth: 2 };
}
