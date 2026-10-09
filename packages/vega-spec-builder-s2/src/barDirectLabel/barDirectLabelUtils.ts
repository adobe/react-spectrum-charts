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
import { Mark, RectMark, Signal, TextEncodeEntry, TextMark } from 'vega';

import {
  BACKGROUND_COLOR,
  CHART_SIZE_FONT_SIZE,
  DIRECT_LABEL_BACKGROUND_STROKE_WIDTH,
  DIRECT_LABEL_FONT_WEIGHT,
} from '@spectrum-charts/core-s2/constants';

import { getNumberFormatExpression } from '../specUtils.js';
import {
  BarDirectLabelOptions,
  BarDirectLabelOverflow,
  BarDirectLabelSpecOptions,
  BarSpecOptions,
} from '../types/index.js';

// Gap between the bar tip and an outside label
const VERTICAL_LABEL_OFFSET = 6;
const HORIZONTAL_LABEL_OFFSET = 8;
// Gap between an inside label and the bar edge
const INSIDE_LABEL_OFFSET = 8;
// Clearance along the bar's length needed to count as "fits inside"
const FIT_PADDING = 2 * INSIDE_LABEL_OFFSET;
// Clearance across the bar's thickness needed to count as "fits inside"
const THICKNESS_PADDING = 4;
const DEFAULT_NUMBER_FORMAT = ',.2~f';
const FONT_SIZE = CHART_SIZE_FONT_SIZE;

export interface LabelGeometry {
  x: string;
  y: string;
  align: string;
  baseline: string;
}

/**
 * Builds the expressions describing a bar item's edges. `bar` is the expression path to the bar's scenegraph item.
 * @param bar - expression path to the bar item (e.g. `datum`)
 * @param metric - the metric field name
 */
const getBarEdges = (bar: string, metric: string) => ({
  negative: `${bar}.datum[${JSON.stringify(metric)}] < 0`,
  left: `${bar}.x`,
  right: `(${bar}.x + ${bar}.width)`,
  top: `${bar}.y`,
  bottom: `(${bar}.y + ${bar}.height)`,
  centerX: `(${bar}.x + ${bar}.width / 2)`,
  centerY: `(${bar}.y + ${bar}.height / 2)`,
});

/**
 * Gets the label text expression for a bar item.
 * @param bar - expression path to the bar item
 * @param labelOptions
 */
export const getBarDirectLabelText = (bar: string, { format, metric }: BarDirectLabelSpecOptions): string =>
  getNumberFormatExpression(`${bar}.datum[${JSON.stringify(metric)}]`, format || DEFAULT_NUMBER_FORMAT);

const getTextWidth = (text: string) => `getLabelWidth(${text}, ${DIRECT_LABEL_FONT_WEIGHT}, ${FONT_SIZE})`;

/**
 * Gets the expression that tests whether the label fits inside its bar.
 * @param bar - expression path to the bar item
 * @param labelOptions
 */
export const getBarDirectLabelFitsTest = (bar: string, labelOptions: BarDirectLabelSpecOptions): string => {
  const textWidth = getTextWidth(getBarDirectLabelText(bar, labelOptions));
  return labelOptions.orientation === 'vertical'
    ? `${bar}.height >= ${FONT_SIZE} + ${FIT_PADDING} && ${bar}.width >= ${textWidth} + ${THICKNESS_PADDING}`
    : `${bar}.width >= ${textWidth} + ${FIT_PADDING} && ${bar}.height >= ${FONT_SIZE} + ${THICKNESS_PADDING}`;
};

/**
 * Gets the label geometry for a label placed inside its bar.
 * @param bar - expression path to the bar item
 * @param labelOptions
 */
export const getInsideLabelGeometry = (bar: string, { metric, orientation, position }: BarDirectLabelSpecOptions): LabelGeometry => {
  const { negative, left, right, top, bottom, centerX, centerY } = getBarEdges(bar, metric);
  const atStart = position === 'start';
  if (orientation === 'vertical') {
    if (position === 'middle') return { x: centerX, y: centerY, align: "'center'", baseline: "'middle'" };
    const [negY, posY] = atStart ? [top, bottom] : [bottom, top];
    const sign = atStart ? 1 : -1;
    const [negBaseline, posBaseline] = atStart ? ["'top'", "'bottom'"] : ["'bottom'", "'top'"];
    return {
      x: centerX,
      y: `(${negative} ? ${negY} + ${sign * INSIDE_LABEL_OFFSET} : ${posY} - ${sign * INSIDE_LABEL_OFFSET})`,
      align: "'center'",
      baseline: `(${negative} ? ${negBaseline} : ${posBaseline})`,
    };
  }
  if (position === 'middle') return { x: centerX, y: centerY, align: "'center'", baseline: "'middle'" };
  const [negX, posX] = atStart ? [right, left] : [left, right];
  const sign = atStart ? 1 : -1;
  const [negAlign, posAlign] = atStart ? ["'right'", "'left'"] : ["'left'", "'right'"];
  return {
    x: `(${negative} ? ${negX} - ${sign * INSIDE_LABEL_OFFSET} : ${posX} + ${sign * INSIDE_LABEL_OFFSET})`,
    y: centerY,
    align: `(${negative} ? ${negAlign} : ${posAlign})`,
    baseline: "'middle'",
  };
};

/**
 * Gets the label geometry for a label placed outside the tip of its bar.
 * @param bar - expression path to the bar item
 * @param labelOptions
 */
export const getOutsideLabelGeometry = (bar: string, { metric, orientation }: BarDirectLabelSpecOptions): LabelGeometry => {
  const { negative, left, right, top, bottom, centerX, centerY } = getBarEdges(bar, metric);
  if (orientation === 'vertical') {
    return {
      x: centerX,
      y: `(${negative} ? ${bottom} + ${VERTICAL_LABEL_OFFSET} : ${top} - ${VERTICAL_LABEL_OFFSET})`,
      align: "'center'",
      baseline: `(${negative} ? 'top' : 'bottom')`,
    };
  }
  return {
    x: `(${negative} ? ${left} - ${HORIZONTAL_LABEL_OFFSET} : ${right} + ${HORIZONTAL_LABEL_OFFSET})`,
    y: centerY,
    align: `(${negative} ? 'right' : 'left')`,
    baseline: "'middle'",
  };
};

/**
 * Gets the bottom-center point of an outside label, used as the anchor for collision layout.
 * @param bar - expression path to the bar item
 * @param labelOptions
 */
const getOutsideAnchorPoint = (bar: string, labelOptions: BarDirectLabelSpecOptions) => {
  const { negative, left, right, top, bottom, centerX, centerY } = getBarEdges(bar, labelOptions.metric);
  if (labelOptions.orientation === 'vertical') {
    return {
      x: centerX,
      y: `(${negative} ? ${bottom} + ${VERTICAL_LABEL_OFFSET} + ${FONT_SIZE} : ${top} - ${VERTICAL_LABEL_OFFSET})`,
    };
  }
  const halfWidth = `${getTextWidth(getBarDirectLabelText(bar, labelOptions))} / 2`;
  return {
    x: `(${negative} ? ${left} - ${HORIZONTAL_LABEL_OFFSET} - ${halfWidth} : ${right} + ${HORIZONTAL_LABEL_OFFSET} + ${halfWidth})`,
    y: `${centerY} + ${FONT_SIZE} / 2`,
  };
};

const selectGeometry = (test: string, ifTrue: LabelGeometry, ifFalse: LabelGeometry): LabelGeometry => ({
  x: `(${test}) ? ${ifTrue.x} : ${ifFalse.x}`,
  y: `(${test}) ? ${ifTrue.y} : ${ifFalse.y}`,
  align: `(${test}) ? ${ifTrue.align} : ${ifFalse.align}`,
  baseline: `(${test}) ? ${ifTrue.baseline} : ${ifFalse.baseline}`,
});

const getGeometryEncoding = ({ x, y, align, baseline }: LabelGeometry): TextEncodeEntry => ({
  x: { signal: x },
  y: { signal: y },
  align: { signal: align },
  baseline: { signal: baseline },
});

const getFontSizeEncoding = (tests: (string | undefined)[]): TextEncodeEntry['fontSize'] => {
  const definedTests = tests.filter(Boolean);
  if (!definedTests.length) return { signal: FONT_SIZE };
  return { signal: `(${definedTests.join(') && (')}) ? ${FONT_SIZE} : 0` };
};

const getHaloMark = (name: string, from: string, update: TextEncodeEntry, strokeWidth: TextEncodeEntry['strokeWidth']): TextMark => ({
  name: `${name}_bg`,
  type: 'text',
  from: { data: from },
  interactive: false,
  encode: {
    update: {
      ...update,
      stroke: { signal: BACKGROUND_COLOR },
      strokeWidth,
      fill: { value: 'transparent' },
    },
  },
});

/**
 * Gets the mark name for a bar direct label.
 * @param labelOptions
 */
export const getBarDirectLabelMarkName = ({ barName, index }: BarDirectLabelSpecOptions) =>
  `${barName}DirectLabel${index}`;

/**
 * Whether outside labels for this direct label are laid out with collision detection.
 * @param labelOptions
 */
export const usesCollisionLayout = ({ overflow, position }: BarDirectLabelSpecOptions) =>
  position === 'end-outside' || overflow === 'spill';

/**
 * Gets the expression that tests whether the bar's data row is selected by `dataKey`.
 * @param bar - expression for the bar mark item
 * @param labelOptions
 */
const getRowTest = (bar: string, { dataKey }: BarDirectLabelSpecOptions): string | undefined =>
  dataKey ? `${bar}.datum[${JSON.stringify(dataKey)}]` : undefined;

/**
 * Gets direct label marks derived from the bar mark's geometry, with no collision detection.
 * @param labelOptions
 */
const getStaticLabelMarks = (labelOptions: BarDirectLabelSpecOptions): Mark[] => {
  const { barName, overflow, position } = labelOptions;
  const name = getBarDirectLabelMarkName(labelOptions);
  const isEndOutside = position === 'end-outside';
  const canSpill = isEndOutside || overflow === 'spill';
  const fits = getBarDirectLabelFitsTest('datum', labelOptions);
  const isOutside = isEndOutside ? 'true' : `!(${fits})`;

  const inside = getInsideLabelGeometry('datum', labelOptions);
  const outside = getOutsideLabelGeometry('datum', labelOptions);
  let geometry = inside;
  if (isEndOutside) geometry = outside;
  else if (canSpill) geometry = selectGeometry(isOutside, outside, inside);

  const update: TextEncodeEntry = {
    ...getGeometryEncoding(geometry),
    text: { signal: getBarDirectLabelText('datum', labelOptions) },
    fontSize: getFontSizeEncoding([getRowTest('datum', labelOptions), canSpill ? undefined : fits]),
    fontWeight: { value: DIRECT_LABEL_FONT_WEIGHT },
    opacity: { signal: 'datum.opacity' },
  };

  const mainMark: TextMark = {
    name,
    type: 'text',
    from: { data: barName },
    interactive: false,
    encode: {
      update: {
        ...update,
        fill: canSpill ? { signal: `${isOutside} ? datum.fill : ${BACKGROUND_COLOR}` } : { signal: BACKGROUND_COLOR },
      },
    },
  };
  if (!canSpill) return [mainMark];

  const strokeWidth = isEndOutside
    ? { value: DIRECT_LABEL_BACKGROUND_STROKE_WIDTH }
    : { signal: `${isOutside} ? ${DIRECT_LABEL_BACKGROUND_STROKE_WIDTH} : 0` };
  return [getHaloMark(name, barName, update, strokeWidth), mainMark];
};

/**
 * Gets direct label marks where outside labels are hidden if they collide with bars or previously placed labels.
 * @param labelOptions
 * @param avoidMarks - names of marks that outside labels must not overlap
 */
const getCollisionLabelMarks = (labelOptions: BarDirectLabelSpecOptions, avoidMarks: string[]): Mark[] => {
  const { barName, position } = labelOptions;
  const name = getBarDirectLabelMarkName(labelOptions);
  const isEndOutside = position === 'end-outside';
  const marks: Mark[] = [];

  if (!isEndOutside) {
    marks.push({
      name: `${name}_inside`,
      type: 'text',
      from: { data: barName },
      interactive: false,
      encode: {
        update: {
          ...getGeometryEncoding(getInsideLabelGeometry('datum', labelOptions)),
          text: { signal: getBarDirectLabelText('datum', labelOptions) },
          fontSize: getFontSizeEncoding([getRowTest('datum', labelOptions), getBarDirectLabelFitsTest('datum', labelOptions)]),
          fontWeight: { value: DIRECT_LABEL_FONT_WEIGHT },
          fill: { signal: BACKGROUND_COLOR },
          opacity: { signal: 'datum.opacity' },
        },
      },
    });
  }

  const anchorPoint = getOutsideAnchorPoint('datum', labelOptions);
  const anchorMark: RectMark = {
    name: `${name}_anchor`,
    type: 'rect',
    from: { data: barName },
    interactive: false,
    encode: {
      update: { x: { signal: anchorPoint.x }, y: { signal: anchorPoint.y }, width: { value: 0 }, height: { value: 0 } },
    },
  };

  // datum is the anchor item, datum.datum is the bar item
  const isOutside = isEndOutside ? undefined : `!(${getBarDirectLabelFitsTest('datum.datum', labelOptions)})`;
  const placementMark: TextMark = {
    name: `${name}_placement`,
    type: 'text',
    from: { data: anchorMark.name as string },
    interactive: false,
    encode: {
      update: {
        text: { signal: getBarDirectLabelText('datum.datum', labelOptions) },
        fontSize: getFontSizeEncoding([getRowTest('datum.datum', labelOptions), isOutside]),
        fontWeight: { value: DIRECT_LABEL_FONT_WEIGHT },
        fill: { value: 'transparent' },
      },
    },
    transform: [
      {
        type: 'label',
        size: { signal: getBarDirectLabelLayoutSizeSignalName(barName) },
        anchor: ['top'],
        offset: [0],
        avoidBaseMark: false,
        avoidMarks,
        padding: null,
      },
    ],
  };

  // datum is the placed label, datum.datum.datum is the bar item
  const update: TextEncodeEntry = {
    x: { field: 'x' },
    y: { field: 'y' },
    align: { field: 'align' },
    baseline: { field: 'baseline' },
    text: { field: 'text' },
    fontSize: { field: 'fontSize' },
    fontWeight: { value: DIRECT_LABEL_FONT_WEIGHT },
    opacity: { signal: 'datum.opacity * datum.datum.datum.opacity' },
  };

  marks.push(
    anchorMark,
    placementMark,
    getHaloMark(name, `${name}_placement`, update, { value: DIRECT_LABEL_BACKGROUND_STROKE_WIDTH }),
    {
      name,
      type: 'text',
      from: { data: `${name}_placement` },
      interactive: false,
      encode: { update: { ...update, fill: { signal: 'datum.datum.datum.fill' } } },
    }
  );
  return marks;
};

const getBarDirectLabelLayoutSizeSignalName = (barName: string) => `${barName}_directLabelLayoutSize`;

/**
 * Gets the chart size signal for label collision layout; defined at the top level because `width` is the band width inside dodged groups.
 * @param barName
 * @returns Signal
 */
export const getBarDirectLabelLayoutSizeSignal = (barName: string): Signal => ({
  name: getBarDirectLabelLayoutSizeSignalName(barName),
  update: '[width, height]',
});

/**
 * Whether any direct label on the bar uses collision layout.
 * @param barOptions
 */
export const hasCollisionDirectLabels = (barOptions: BarSpecOptions): boolean =>
  barOptions.barDirectLabels.some((label, i) => usesCollisionLayout(getBarDirectLabelSpecOptions(label, i, barOptions)));

/**
 * Gets the marks for a single bar direct label. Marks read the rendered bar items, so they must share the bar's scope.
 * @param labelOptions
 * @param avoidMarks - names of marks that outside labels must not overlap
 */
export const getBarDirectLabelMarks = (labelOptions: BarDirectLabelSpecOptions, avoidMarks: string[]): Mark[] =>
  usesCollisionLayout(labelOptions)
    ? getCollisionLabelMarks(labelOptions, avoidMarks)
    : getStaticLabelMarks(labelOptions);

/**
 * Gets the marks for every direct label on a bar. Later labels avoid earlier ones.
 * @param barOptions
 */
export const getBarDirectLabelsMarks = (barOptions: BarSpecOptions): Mark[] => {
  const labels = barOptions.barDirectLabels.map((label, i) => getBarDirectLabelSpecOptions(label, i, barOptions));
  const placedMarks: string[] = [];
  return labels.flatMap((label) => {
    const marks = getBarDirectLabelMarks(label, [barOptions.name, ...placedMarks]);
    placedMarks.push(getBarDirectLabelMarkName(label));
    return marks;
  });
};

const getDefaultOverflow = (labelOptions: BarDirectLabelOptions): BarDirectLabelOverflow =>
  labelOptions.position === 'start' ? 'spill' : 'hide';

/**
 * Applies defaults and inherits context from the parent bar, producing BarDirectLabelSpecOptions.
 */
export const getBarDirectLabelSpecOptions = (
  labelOptions: BarDirectLabelOptions,
  index: number,
  barOptions: BarSpecOptions
): BarDirectLabelSpecOptions => ({
  barName: barOptions.name,
  dataKey: labelOptions.dataKey,
  format: labelOptions.format ?? '',
  index,
  metric: barOptions.metric,
  orientation: barOptions.orientation,
  overflow: labelOptions.overflow ?? getDefaultOverflow(labelOptions),
  position: labelOptions.position ?? 'end-outside',
});
