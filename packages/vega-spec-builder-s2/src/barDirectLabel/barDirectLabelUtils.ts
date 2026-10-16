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
import { Data, GroupMark, Mark, TextEncodeEntry, TextMark } from 'vega';

import {
  BACKGROUND_COLOR,
  CHART_SIZE_FONT_SIZE,
  DIRECT_LABEL_BACKGROUND_STROKE_WIDTH,
  DIRECT_LABEL_FONT_WEIGHT,
  MARK_ID,
} from '@spectrum-charts/core-s2/constants';

import { isDodgedAndStacked } from '../bar/barUtils.js';
import { getDrawInLabelFadeExpr } from '../marks/drawInAnimationUtils.js';
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
const LAYOUT_PADDING = 'directLabelLayoutPadding';

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
export const getInsideLabelGeometry = (
  bar: string,
  { metric, orientation, position }: BarDirectLabelSpecOptions
): LabelGeometry => {
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

const getHaloMark = (
  name: string,
  from: string,
  update: TextEncodeEntry,
  strokeWidth: TextEncodeEntry['strokeWidth']
): TextMark => ({
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
 * Gets an inside label, hidden when the text does not fit.
 * @param labelOptions
 */
const getInsideLabelMark = (labelOptions: BarDirectLabelSpecOptions): TextMark => {
  const name = getBarDirectLabelMarkName(labelOptions);
  return {
    name: `${name}_inside`,
    type: 'text',
    from: { data: getLabelBarsName(labelOptions.barName) },
    interactive: false,
    encode: {
      update: {
        ...getGeometryEncoding(getInsideLabelGeometry('datum', labelOptions)),
        text: { signal: getBarDirectLabelText('datum', labelOptions) },
        fontSize: getFontSizeEncoding([
          getRowTest('datum', labelOptions),
          getBarDirectLabelFitsTest('datum', labelOptions),
        ]),
        fontWeight: { value: DIRECT_LABEL_FONT_WEIGHT },
        fill: { signal: BACKGROUND_COLOR },
        opacity: { field: 'labelOpacity' },
      },
    },
  };
};

/**
 * Places outside labels at the bar tip using Vega's native anchors and collision detection.
 * @param labelOptions
 * @param negative
 * @param avoidMarks - names of marks that outside labels must not overlap
 */
const getOutsideLabelMarks = (
  labelOptions: BarDirectLabelSpecOptions,
  negative: boolean,
  avoidMarks: string[]
): Mark[] => {
  const { orientation } = labelOptions;
  const name = getOutsideLabelName(labelOptions, negative);
  const vertical = orientation === 'vertical';
  const anchors = vertical ? (['top', 'bottom'] as const) : (['right', 'left'] as const);
  const obstacles = avoidMarks.map((mark) => `data(${JSON.stringify(mark)}) || []`).join(', ');
  // Vega's obstacle rasterizer requires integer canvas dimensions.
  const placementMark: TextMark = {
    name: `${name}_placement`,
    type: 'text',
    from: { data: `${name}_candidates` },
    interactive: false,
    encode: {
      update: {
        text: { signal: getBarDirectLabelText('datum', labelOptions) },
        fontSize: { signal: FONT_SIZE },
        fontWeight: { value: DIRECT_LABEL_FONT_WEIGHT },
        fill: { value: 'transparent' },
      },
    },
    transform: [
      {
        type: 'label',
        size: { signal: `[ceil(width + 2 * ${LAYOUT_PADDING}), ceil(height + 2 * ${LAYOUT_PADDING})]` },
        anchor: [anchors[negative ? 1 : 0]],
        offset: [vertical ? VERTICAL_LABEL_OFFSET : HORIZONTAL_LABEL_OFFSET],
        avoidBaseMark: false,
        // @ts-expect-error Vega supports signal-valued data parameters; its LabelTransform type omits them.
        avoidMarks: { signal: `[${obstacles}]` },
        padding: null,
      },
      { type: 'formula', as: 'x', expr: `datum.opacity > 0 ? datum.x : ${LAYOUT_PADDING}` },
      { type: 'formula', as: 'y', expr: `datum.opacity > 0 ? datum.y : ${LAYOUT_PADDING}` },
      { type: 'formula', as: 'fontSize', expr: `datum.opacity > 0 ? ${FONT_SIZE} : 0` },
    ],
  };

  // datum is the placed label; datum.datum is the chart-relative bar geometry.
  const update: TextEncodeEntry = {
    x: { field: 'x' },
    y: { field: 'y' },
    align: { field: 'align' },
    baseline: { field: 'baseline' },
    text: { field: 'text' },
    fontSize: { field: 'fontSize' },
    fontWeight: { value: DIRECT_LABEL_FONT_WEIGHT },
    opacity: { signal: 'datum.opacity * datum.datum.labelOpacity' },
  };

  return [
    placementMark,
    getHaloMark(name, `${name}_placement`, update, { value: DIRECT_LABEL_BACKGROUND_STROKE_WIDTH }),
    {
      name,
      type: 'text',
      from: { data: `${name}_placement` },
      interactive: false,
      encode: { update: { ...update, fill: { field: 'datum.fill' } } },
    },
  ];
};

const getLabelBarsName = (barName: string) => `${barName}_directLabelBars`;
const getOutsideLabelName = (options: BarDirectLabelSpecOptions, negative: boolean) =>
  `${getBarDirectLabelMarkName(options)}_${negative ? 'negative' : 'positive'}`;

/**
 * Collects rendered bars in a shared coordinate system without changing the visible bar marks.
 * @param options
 */
const getLabelBars = (options: BarSpecOptions): Data => {
  const grouped = options.type === 'dodged' || isDodgedAndStacked(options);
  const geometry = options.isDrawInAnimate ? 'layoutBar' : 'bar';
  const backgroundName = `${options.name}_background`;
  const background = `datum.bar.mark.group.items[indexof(pluck(datum.bar.mark.group.items, 'name'), ${JSON.stringify(
    backgroundName
  )})]`;
  const markId = `datum.${MARK_ID}`;
  const backgroundItem = `${background}.items[indexof(pluck(${background}.items, '${markId}'), datum.bar.${markId})]`;
  const fields = ['datum', 'mark', 'fill', 'opacity'];
  return {
    name: `${getLabelBarsName(options.name)}_source`,
    source: grouped ? `${options.name}_group` : options.name,
    transform: [
      ...(grouped
        ? [
            { type: 'formula' as const, expr: 'datum', as: 'group' },
            { type: 'flatten' as const, fields: ['items'], as: ['childMark'] },
            { type: 'filter' as const, expr: `datum.childMark.name === ${JSON.stringify(options.name)}` },
            { type: 'flatten' as const, fields: ['childMark.items'], as: ['bar'] },
          ]
        : [{ type: 'formula' as const, expr: 'datum', as: 'bar' }]),
      ...(options.isDrawInAnimate ? [{ type: 'formula' as const, as: 'layoutBar', expr: backgroundItem }] : []),
      {
        type: 'project',
        fields: [
          ...fields.map((field) => `bar.${field}`),
          `${geometry}.width`,
          `${geometry}.height`,
          `${geometry}.x`,
          `${geometry}.y`,
          ...(grouped ? ['group.x', 'group.y'] : []),
        ],
        as: [...fields, 'width', 'height', 'barX', 'barY', ...(grouped ? ['groupX', 'groupY'] : [])],
      },
      { type: 'formula', as: 'x', expr: grouped ? 'datum.barX + (datum.groupX || 0)' : 'datum.barX' },
      { type: 'formula', as: 'y', expr: grouped ? 'datum.barY + (datum.groupY || 0)' : 'datum.barY' },
      {
        type: 'formula',
        as: 'labelOpacity',
        expr: 'datum.opacity',
      },
      {
        type: 'formula',
        as: 'bounds',
        expr: '{x1: datum.x, x2: datum.x + datum.width, y1: datum.y, y2: datum.y + datum.height}',
      },
    ],
  };
};

/**
 * Gets the marks for every direct label on a bar. Later labels avoid earlier ones.
 * @param barOptions
 */
export const getBarDirectLabelsMarks = (barOptions: BarSpecOptions): Mark[] => {
  if (!barOptions.barDirectLabels.length) return [];
  const labels = barOptions.barDirectLabels.map((label, i) => getBarDirectLabelSpecOptions(label, i, barOptions));
  const barsName = getLabelBarsName(barOptions.name);
  const source = getLabelBars(barOptions);
  const textWidths = labels.map((label) => getTextWidth(getBarDirectLabelText('datum', label))).join(', ');
  const sizesName = `${barsName}_sizes`;
  // Keep outside labels inside the collision bitmap without changing their rendered coordinates.
  const data: Data[] = [
    source,
    {
      name: sizesName,
      source: source.name,
      transform: [
        { type: 'formula', as: 'labelWidth', expr: `max(${textWidths})` },
        { type: 'aggregate', fields: ['labelWidth'], ops: ['max'], as: ['labelWidth'] },
      ],
    },
    {
      name: barsName,
      source: source.name,
      transform: [
        { type: 'formula', as: 'x', expr: `datum.x + ${LAYOUT_PADDING}` },
        { type: 'formula', as: 'y', expr: `datum.y + ${LAYOUT_PADDING}` },
        {
          type: 'formula',
          as: 'bounds',
          expr: '{x1: datum.x, x2: datum.x + datum.width, y1: datum.y, y2: datum.y + datum.height}',
        },
      ],
    },
  ];
  const insideLabels = labels.filter((label) => label.position !== 'end-outside');
  const marks: Mark[] = insideLabels.map(getInsideLabelMark);
  const avoidMarks = [barsName, ...insideLabels.map((label) => `${getBarDirectLabelMarkName(label)}_inside`)];
  for (const label of labels.filter(usesCollisionLayout)) {
    for (const negative of [false, true]) {
      const name = getOutsideLabelName(label, negative);
      const rowTest = getRowTest('datum', label) ?? 'true';
      const outside = label.position === 'end-outside' ? 'true' : `!(${getBarDirectLabelFitsTest('datum', label)})`;
      const signTest = `datum.datum[${JSON.stringify(label.metric)}] ${negative ? '<' : '>='} 0`;
      data.push({
        name: `${name}_candidates`,
        source: barsName,
        transform: [{ type: 'filter', expr: `(${rowTest}) && (${outside}) && (${signTest})` }],
      });
      marks.push(...getOutsideLabelMarks(label, negative, [...avoidMarks]));
      avoidMarks.push(name);
    }
  }
  const group: GroupMark = {
    name: `${barOptions.name}_directLabels`,
    type: 'group',
    interactive: false,
    signals: [
      {
        name: LAYOUT_PADDING,
        update: `max(${FONT_SIZE}, length(data('${sizesName}')) ? data('${sizesName}')[0].labelWidth || 0 : 0) + ${
          HORIZONTAL_LABEL_OFFSET + DIRECT_LABEL_BACKGROUND_STROKE_WIDTH
        }`,
      },
    ],
    encode: {
      update: { opacity: barOptions.isDrawInAnimate ? { signal: getDrawInLabelFadeExpr('1') } : { value: 1 } },
    },
    data,
    marks: [
      {
        type: 'group',
        name: `${barOptions.name}_directLabelLayout`,
        interactive: false,
        encode: { update: { x: { signal: `-${LAYOUT_PADDING}` }, y: { signal: `-${LAYOUT_PADDING}` } } },
        marks,
      },
    ],
  };
  return [group];
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
