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
import {
  EncodeEntry,
  GroupMark,
  GuideEncodeEntry,
  LabelAnchor,
  Mark,
  NumericValueRef,
  ProductionRule,
  RuleMark,
  ScaleType,
  SignalRef,
  SymbolEncodeEntry,
  SymbolMark,
  TextEncodeEntry,
} from 'vega';

import {
  AREA_HOVER_POINT,
  AREA_HOVER_RULE,
  DEFAULT_FONT_COLOR,
  DEFAULT_LABEL_FONT_WEIGHT,
  HOVER_RULE,
  SELECT_BORDER,
} from '@spectrum-charts/constants';
import { getColorValue } from '@spectrum-charts/themes';

import { getPathFromIcon, getStrokeDashFromLineType } from '../specUtils';
import { AxisSpecOptions, Position, ReferenceLineOptions, ReferenceLineSpecOptions } from '../types';
import { isVerticalAxis } from './axisUtils';

// distance from the line to the label for diagonal anchors (6px on each axis)
const REFERENCE_LINE_LABEL_BADGE_OFFSET = 8.49;
const REFERENCE_LINE_LABEL_BADGE_PADDING = 3;
// widest the label can be and still fit beside the line (offset + badge padding)
const REFERENCE_LINE_LABEL_LIMIT = `max(datum.x, width - datum.x) - ${6 + REFERENCE_LINE_LABEL_BADGE_PADDING}`;

export const getReferenceLines = (axisOptions: AxisSpecOptions): ReferenceLineSpecOptions[] => {
  return axisOptions.referenceLines.map((referenceLine, index) =>
    applyReferenceLineOptionDefaults(referenceLine, axisOptions, index)
  );
};

const applyReferenceLineOptionDefaults = (
  options: ReferenceLineOptions,
  axisOptions: AxisSpecOptions,
  index: number
): ReferenceLineSpecOptions => ({
  ...options,
  color: options.color || 'gray-800',
  colorScheme: axisOptions.colorScheme,
  iconColor: options.iconColor || DEFAULT_FONT_COLOR,
  labelColor: options.labelColor || DEFAULT_FONT_COLOR,
  labelFontWeight: options.labelFontWeight ?? DEFAULT_LABEL_FONT_WEIGHT,
  labelPosition: options.labelPosition ?? 'axis',
  layer: options.layer ?? 'front',
  name: `${axisOptions.name}ReferenceLine${index}`,
  lineType: options.lineType ?? 'solid',
});

export const scaleTypeSupportsReferenceLines = (scaleType: ScaleType | undefined): boolean => {
  const supportedScaleTypes: ScaleType[] = ['band', 'linear', 'point', 'time', 'utc'];
  return Boolean(scaleType && supportedScaleTypes.includes(scaleType));
};

/**
 * Returns the index at which 'front' reference line marks should be spliced in —
 * just before the first hover/interactive mark, or at the end if none exist.
 */
export const getFrontInsertionIndex = (marks: Mark[]): number => {
  const index = marks.findIndex(mark =>
    [HOVER_RULE, SELECT_BORDER, AREA_HOVER_RULE, AREA_HOVER_POINT].some(suffix => mark.name?.endsWith(suffix))
  );
  return index === -1 ? marks.length : index;
};

export const getReferenceLineMarks = (
  axisOptions: AxisSpecOptions,
  scaleName: string
): { back: Mark[]; front: Mark[] } => {
  const referenceLineMarks: { back: Mark[]; front: Mark[] } = { back: [], front: [] };
  const referenceLines = getReferenceLines(axisOptions);

  for (const referenceLine of referenceLines) {
    const { layer } = referenceLine;
    const positionEncoding = getPositionEncoding(axisOptions, referenceLine, scaleName);
    referenceLineMarks[layer].push(
      getReferenceLineRuleMark(axisOptions, referenceLine, positionEncoding),
      ...getReferenceLineSymbolMark(axisOptions, referenceLine, positionEncoding),
      ...getReferenceLineTextMark(axisOptions, referenceLine, positionEncoding)
    );
  }
  return referenceLineMarks;
};

export const getPositionEncoding = (
  { scaleType }: AxisSpecOptions,
  { value, position }: ReferenceLineSpecOptions,
  scaleName: string
): ProductionRule<NumericValueRef> | SignalRef => {
  const signalValue = typeof value === 'string' ? `'${value}'` : value;
  const halfInnerPaddingFormula = `paddingInner * bandwidth('${scaleName}') / (2 * (1 - paddingInner))`;
  const beforePositionSignal = `scale('${scaleName}', ${signalValue}) - ${halfInnerPaddingFormula}`;
  const centeredPositionSignal = `scale('${scaleName}', ${signalValue}) + bandwidth('${scaleName}') / 2`;
  const afterPositionSignal = `scale('${scaleName}', ${signalValue}) + bandwidth('${scaleName}') + ${halfInnerPaddingFormula}`;
  if (scaleType === 'band') {
    if (position === 'before') return { signal: beforePositionSignal };
    if (position === 'after') return { signal: afterPositionSignal };
    return { signal: centeredPositionSignal };
  }
  return { scale: scaleName, value };
};

export const getReferenceLineRuleMark = (
  { position, ticks }: AxisSpecOptions,
  { color, colorScheme, name, lineType }: ReferenceLineSpecOptions,
  positionEncoding: ProductionRule<NumericValueRef> | SignalRef
): RuleMark => {
  const startOffset = ticks ? 9 : 0;

  const positionOptions: { [key in Position]: Partial<EncodeEntry> } = {
    top: {
      x: positionEncoding,
      y: { value: -startOffset },
      y2: { signal: 'height' },
    },
    bottom: {
      x: positionEncoding,
      y: { value: 0 },
      y2: { signal: `height + ${startOffset}` },
    },
    left: {
      x: { value: -startOffset },
      x2: { signal: 'width' },
      y: positionEncoding,
    },
    right: {
      x: { value: 0 },
      x2: { signal: `width + ${startOffset}` },
      y: positionEncoding,
    },
  };

  return {
    name,
    type: 'rule',
    interactive: false,
    encode: {
      enter: {
        stroke: { value: getColorValue(color, colorScheme) },
        strokeDash: { value: getStrokeDashFromLineType(lineType ?? 'solid') },
      },
      update: {
        ...positionOptions[position],
      },
    },
  };
};

/**
 * Gets position values for additional marks for the reference line.
 * @param offset
 * @param positionEncoding
 * @param horizontalOffset
 * @returns SymbolMark
 */
const getAdditiveMarkPositionOptions = (
  offset: number,
  positionEncoding: ProductionRule<NumericValueRef> | SignalRef,
  horizontalOffset?: number
) => ({
  top: {
    x: positionEncoding,
    y: { value: -offset },
  },
  bottom: {
    x: positionEncoding,
    y: { signal: `height + ${offset}` },
  },
  left: {
    x: { value: -offset },
    y: { ...positionEncoding, offset: horizontalOffset },
  },
  right: {
    x: { signal: `width + ${offset}` },
    y: { ...positionEncoding, offset: horizontalOffset },
  },
});

/**
 * Gets the reference line symbol mark
 * @param AxisSpecOptions
 * @param ReferenceLineSpecOptions
 * @param referenceLineIndex
 * @param positionEncoding
 * @returns SymbolMark
 */
export const getReferenceLineSymbolMark = (
  { colorScheme, position }: AxisSpecOptions,
  { icon, iconColor, name }: ReferenceLineSpecOptions,
  positionEncoding: ProductionRule<NumericValueRef> | SignalRef
): SymbolMark[] => {
  if (!icon) return [];

  // offset the icon from the edge of the chart area
  const OFFSET = 24;
  const positionOptions = getAdditiveMarkPositionOptions(OFFSET, positionEncoding);

  return [
    {
      name: `${name}_symbol`,
      description: `${name}_symbol`,
      type: 'symbol',
      encode: {
        enter: {
          shape: {
            value: getPathFromIcon(icon),
          },
          size: { value: 324 },
          fill: { value: getColorValue(iconColor, colorScheme) },
        },
        update: {
          ...positionOptions[position],
        },
      },
    },
  ];
};

/**
 * Gets the reference line text mark
 * @param AxisSpecOptions
 * @param ReferenceLineSpecOptions
 * @param referenceLineIndex
 * @param positionEncoding
 * @returns TextMark
 */
export const getReferenceLineTextMark = (
  axisOptions: AxisSpecOptions,
  referenceLineOptions: ReferenceLineSpecOptions,
  positionEncoding: ProductionRule<NumericValueRef> | SignalRef
): Mark[] => {
  const { label, labelPosition, name } = referenceLineOptions;
  if (!label) return [];

  if (labelPosition !== 'axis') {
    return [
      getReferenceLineInsideLabelMark(axisOptions, { ...referenceLineOptions, label, labelPosition }, positionEncoding),
    ];
  }

  return [
    {
      name: `${name}_label`,
      description: `${name}_label`,
      type: 'text',
      encode: {
        ...getReferenceLineLabelsEncoding(axisOptions, { ...referenceLineOptions, label }, positionEncoding),
      },
    },
  ];
};

/**
 * Gets the label anchors for an inside label, in order of preference, based on the line orientation and label position.
 * @param position
 * @param labelPosition
 * @returns LabelAnchor[]
 */
export const getReferenceLineInsideLabelAnchors = (
  position: Position,
  labelPosition: 'start' | 'end'
): LabelAnchor[] => {
  const isStart = labelPosition === 'start';
  if (isVerticalAxis(position)) {
    return isStart ? ['bottom-right', 'top-right'] : ['bottom-left', 'top-left'];
  }
  return isStart ? ['bottom-right', 'bottom-left'] : ['top-right', 'top-left'];
};

/**
 * Gets a badged label placed inside the chart area at the start or end of the reference line.
 * @param axisOptions
 * @param referenceLineOptions
 * @param positionEncoding
 * @returns GroupMark
 */
export const getReferenceLineInsideLabelMark = (
  { position }: AxisSpecOptions,
  {
    color,
    colorScheme,
    label,
    labelFontWeight,
    labelPosition,
    name,
  }: ReferenceLineSpecOptions & { label: string; labelPosition: 'start' | 'end' },
  positionEncoding: ProductionRule<NumericValueRef> | SignalRef
): GroupMark => {
  const isStart = labelPosition === 'start';
  const anchorPosition: SymbolEncodeEntry = isVerticalAxis(position)
    ? { x: isStart ? { value: 0 } : { signal: 'width' }, y: positionEncoding as NumericValueRef }
    : { x: positionEncoding as NumericValueRef, y: isStart ? { value: 0 } : { signal: 'height' } };
  const badgeColor = getColorValue(color, colorScheme);
  const textColors = [getColorValue('gray-50', colorScheme), getColorValue('gray-900', colorScheme)];
  const anchors = getReferenceLineInsideLabelAnchors(position, labelPosition);

  return {
    name: `${name}_labelGroup`,
    type: 'group',
    interactive: false,
    marks: [
      {
        name: `${name}_labelAnchor`,
        type: 'symbol',
        interactive: false,
        encode: {
          update: { ...anchorPosition, opacity: { value: 0 }, size: { value: 1 } },
        },
      },
      {
        name: `${name}_label`,
        description: `${name}_label`,
        type: 'text',
        from: { data: `${name}_labelAnchor` },
        zindex: 1,
        interactive: false,
        encode: {
          enter: {
            text: { value: label },
            fontWeight: { value: labelFontWeight },
            fill: [
              { test: `contrast('${badgeColor}', '${textColors[0]}') >= 4.5`, value: textColors[0] },
              { value: textColors[1] },
            ],
          },
          update: {
            limit: { signal: REFERENCE_LINE_LABEL_LIMIT },
          },
        },
        transform: [
          {
            type: 'label',
            size: { signal: '[width, height]' },
            offset: anchors.map(() => REFERENCE_LINE_LABEL_BADGE_OFFSET),
            anchor: anchors,
          },
        ],
      },
      {
        name: `${name}_labelBadge`,
        description: `${name}_labelBadge`,
        type: 'rect',
        from: { data: `${name}_label` },
        interactive: false,
        encode: {
          update: {
            cornerRadius: { value: 2 },
            fill: { value: badgeColor },
            opacity: { field: 'opacity' },
            x: { signal: `datum.bounds.x1 - ${REFERENCE_LINE_LABEL_BADGE_PADDING}` },
            x2: { signal: `datum.bounds.x2 + ${REFERENCE_LINE_LABEL_BADGE_PADDING}` },
            y: { signal: `datum.bounds.y1 - ${REFERENCE_LINE_LABEL_BADGE_PADDING}` },
            y2: { signal: `datum.bounds.y2 + ${REFERENCE_LINE_LABEL_BADGE_PADDING}` },
          },
        },
      },
    ],
  };
};

/**
 * Calculates the vertical and horizontal offsets for reference line labels based on axis position and icon presence
 * @param position The axis position
 * @param icon Whether an icon is present
 * @returns Object containing verticalOffset and horizontalOffset values
 */
const calculateReferenceLineOffsets = (
  position: Position,
  icon?: string,
  ticks?: boolean
): { verticalOffset: number; horizontalOffset: number } => {
  const isVertical = isVerticalAxis(position);
  // match tick label spacing: labelPadding (8), plus tickSize (8) when ticks are shown
  const tickOffset = ticks && !icon ? 8 : 0;
  let verticalOffset = isVertical ? 8 + tickOffset : 28;
  let horizontalOffset = isVertical ? 4 : 5;

  if (icon) {
    if (isVertical) {
      verticalOffset += 29;
    } else {
      verticalOffset += 20;
    }
    if (!isVertical) {
      horizontalOffset += 25;
      verticalOffset += 2;
    }
  }

  return { verticalOffset, horizontalOffset };
};

/**
 * Gets the reference line label encoding
 * @param labelFontWeight
 * @param label
 * @param position
 * @param positionEncoding
 * @param icon
 * @returns updateEncoding
 */
export const getReferenceLineLabelsEncoding = (
  { position, ticks }: AxisSpecOptions,
  { colorScheme, icon, label, labelColor, labelFontWeight }: ReferenceLineSpecOptions & { label: string },
  positionEncoding: ProductionRule<NumericValueRef> | SignalRef
): GuideEncodeEntry<TextEncodeEntry> => {
  const { verticalOffset, horizontalOffset } = calculateReferenceLineOffsets(position, icon, ticks);
  const positionOptions = getAdditiveMarkPositionOptions(verticalOffset, positionEncoding, horizontalOffset);

  return {
    update: {
      text: [
        {
          value: label,
        },
      ],
      fontWeight: [
        // default to the primary label font weight
        { value: labelFontWeight },
      ],
      fill: { value: getColorValue(labelColor, colorScheme) },
      ...getEncodedLabelBaselineAlign(position),
      ...positionOptions[position],
    },
  };
};

/**
 * Will return the label align or baseline based on the position
 * These properties are used within the reference line label encoding
 * If this is a vertical axis, it will return the correct baseline property and value
 * Otherwise, it will return the correct align property and value
 * @param position
 * @returns align | baseline
 */
export const getEncodedLabelBaselineAlign = (position: Position): EncodeEntry => {
  switch (position) {
    case 'top':
    case 'bottom':
      return {
        align: { value: 'center' },
      };
    case 'left':
      return {
        align: { value: 'right' },
        baseline: { value: 'center' },
      };
    case 'right':
      return {
        align: { value: 'left' },
        baseline: { value: 'center' },
      };
  }
};
