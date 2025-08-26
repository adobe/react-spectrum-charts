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
  DATE_PATH,
  DEFAULT_COLOR_SCHEME,
  DEFAULT_FONT_COLOR,
  DEFAULT_GRANULARITY,
  DEFAULT_LABEL_ALIGN,
  DEFAULT_LABEL_FONT_WEIGHT,
  DEFAULT_LABEL_ORIENTATION,
} from '@spectrum-charts/constants';
import { spectrumColors } from '@spectrum-charts/themes';

import { AxisSpecOptions, ReferenceLineSpecOptions } from '../types';
import {
  getPositionEncoding,
  getReferenceLineLabelsEncoding,
  getReferenceLineMarks,
  getReferenceLineRuleMark,
  getReferenceLineSymbolMark,
  getReferenceLineTextMark,
  getReferenceLines,
  scaleTypeSupportsReferenceLines,
} from './axisReferenceLineUtils';

const defaultReferenceLineOptions: ReferenceLineSpecOptions = {
  value: 10,
  icon: 'date',
  color: 'gray-900',
  colorScheme: DEFAULT_COLOR_SCHEME,
  iconColor: DEFAULT_FONT_COLOR,
  labelColor: DEFAULT_FONT_COLOR,
  labelFontWeight: DEFAULT_LABEL_FONT_WEIGHT,
  layer: 'front',
  name: 'axis0ReferenceLine0',
  lineType: 'solid',
};

const defaultAxisOptions: AxisSpecOptions = {
  axisAnnotations: [],
  axisThumbnails: [],
  baseline: false,
  baselineOffset: 0,
  colorScheme: DEFAULT_COLOR_SCHEME,
  granularity: DEFAULT_GRANULARITY,
  grid: false,
  hideDefaultLabels: false,
  index: 0,
  labelAlign: DEFAULT_LABEL_ALIGN,
  labelFontWeight: DEFAULT_LABEL_FONT_WEIGHT,
  labelOrientation: DEFAULT_LABEL_ORIENTATION,
  labels: [],
  name: 'axis0',
  numberFormat: 'shortNumber',
  position: 'bottom',
  referenceLines: [defaultReferenceLineOptions],
  scaleType: 'linear',
  subLabels: [],
  ticks: false,
};

const defaultYPositionEncoding = { scale: 'yLinear', value: 10 };
const defaultXPositionEncoding = { scale: 'xLinear', value: 10 };

describe('getReferenceLines()', () => {
  test('should return the options for all reference lines', () => {
    const referenceLines = getReferenceLines({
      ...defaultAxisOptions,
      referenceLines: [{ value: 1 }, { value: 0, icon: 'date' }],
    });

    expect(referenceLines).toHaveLength(2);
    expect(referenceLines[0]).toHaveProperty('value', 1);
    expect(referenceLines[1]).toHaveProperty('value', 0);
    expect(referenceLines[1]).toHaveProperty('icon', 'date');
  });

  test('should return an empty array if there are no referenceLines', () => {
    expect(getReferenceLines({ ...defaultAxisOptions, axisAnnotations: [{}], referenceLines: [] })).toHaveLength(0);
  });
});

describe('scaleTypeSupportsRefenceLines()', () => {
  test('should identify supported and unsupported scaleTypes', () => {
    expect(scaleTypeSupportsReferenceLines('linear')).toBe(true);
    expect(scaleTypeSupportsReferenceLines('point')).toBe(true);
    expect(scaleTypeSupportsReferenceLines('time')).toBe(true);
    expect(scaleTypeSupportsReferenceLines('utc')).toBe(true);
    expect(scaleTypeSupportsReferenceLines('band')).toBe(true);
    expect(scaleTypeSupportsReferenceLines('quantile')).toBe(false);
  });
});

describe('getPositionEncoding()', () => {
  test('creates the correct mark when value is a string', () => {
    expect(
      getPositionEncoding(defaultAxisOptions, { ...defaultReferenceLineOptions, value: 'test' }, 'xLinear')
    ).toStrictEqual({ scale: 'xLinear', value: 'test' });
  });

  test('creates the correct mark when value is a number', () => {
    expect(
      getPositionEncoding(defaultAxisOptions, { ...defaultReferenceLineOptions, value: 10 }, 'xLinear')
    ).toStrictEqual({
      scale: 'xLinear',
      value: 10,
    });
  });

  test('creates the correct mark when value is a string and scaleType is band', () => {
    expect(
      getPositionEncoding(
        { ...defaultAxisOptions, scaleType: 'band' },
        { ...defaultReferenceLineOptions, value: 'value' },
        'xBand'
      )
    ).toStrictEqual({ signal: "scale('xBand', 'value') + bandwidth('xBand') / 2" });
  });

  test('creates the correct mark when value is a number and scaleType is band', () => {
    expect(
      getPositionEncoding(
        { ...defaultAxisOptions, scaleType: 'band' },
        { ...defaultReferenceLineOptions, value: 10 },
        'xBand'
      )
    ).toStrictEqual({ signal: "scale('xBand', 10) + bandwidth('xBand') / 2" });
  });
});

describe('getReferenceLineMarks()', () => {
  test('should put reference lines in the correct group based on layer', () => {
    let referenceLines = getReferenceLineMarks(
      {
        ...defaultAxisOptions,
        referenceLines: [{ ...defaultReferenceLineOptions, layer: 'back' }],
      },
      'xLinear'
    );

    expect(referenceLines.back.filter((mark) => mark.type === 'rule')).toHaveLength(1);
    expect(referenceLines.front.filter((mark) => mark.type === 'rule')).toHaveLength(0);

    referenceLines = getReferenceLineMarks(
      {
        ...defaultAxisOptions,
        referenceLines: [{ ...defaultReferenceLineOptions, layer: 'front' }],
      },
      'xLinear'
    );
    expect(referenceLines.back.filter((mark) => mark.type === 'rule')).toHaveLength(0);
    expect(referenceLines.front.filter((mark) => mark.type === 'rule')).toHaveLength(1);
  });
});

describe('getReferenceLineRuleMark()', () => {
  test('should generate rule mark', () => {
    const rule = getReferenceLineRuleMark(defaultAxisOptions, defaultReferenceLineOptions, defaultXPositionEncoding);
    expect(rule).toStrictEqual({
      encode: {
        enter: { stroke: { value: spectrumColors.light['gray-900'] }, strokeDash: { value: [] } },
        update: { x: defaultXPositionEncoding, y: { value: 0 }, y2: { signal: 'height + 0' } },
      },
      interactive: false,
      name: 'axis0ReferenceLine0',
      type: 'rule',
    });
  });

  test('should apply the correct position encodings based on axis position', () => {
    const topAxisRule = getReferenceLineRuleMark(
      { ...defaultAxisOptions, position: 'top' },

      defaultReferenceLineOptions,
      defaultXPositionEncoding
    );
    expect(topAxisRule.encode?.update?.x).toStrictEqual(defaultXPositionEncoding);
    expect(topAxisRule.encode?.update?.y).toStrictEqual({ value: -0 });
    expect(topAxisRule.encode?.update?.y2).toStrictEqual({ signal: 'height' });

    const bottomAxisRule = getReferenceLineRuleMark(
      defaultAxisOptions,
      defaultReferenceLineOptions,
      defaultXPositionEncoding
    );
    expect(bottomAxisRule.encode?.update?.x).toStrictEqual(defaultXPositionEncoding);
    expect(bottomAxisRule.encode?.update?.y).toStrictEqual({ value: 0 });
    expect(bottomAxisRule.encode?.update?.y2).toStrictEqual({ signal: 'height + 0' });

    const leftAxisRule = getReferenceLineRuleMark(
      { ...defaultAxisOptions, position: 'left' },

      defaultReferenceLineOptions,
      defaultYPositionEncoding
    );
    expect(leftAxisRule.encode?.update?.x).toStrictEqual({ value: -0 });
    expect(leftAxisRule.encode?.update?.x2).toStrictEqual({ signal: 'width' });
    expect(leftAxisRule.encode?.update?.y).toStrictEqual(defaultYPositionEncoding);

    const rightAxisRule = getReferenceLineRuleMark(
      { ...defaultAxisOptions, position: 'right' },
      defaultReferenceLineOptions,
      defaultYPositionEncoding
    );
    expect(rightAxisRule.encode?.update?.x).toStrictEqual({ value: 0 });
    expect(rightAxisRule.encode?.update?.x2).toStrictEqual({ signal: 'width + 0' });
    expect(rightAxisRule.encode?.update?.y).toStrictEqual(defaultYPositionEncoding);
  });

  test('should offset start of rule by 9 pixels if ticks are present', () => {
    const bottomAxisRule = getReferenceLineRuleMark(
      { ...defaultAxisOptions, ticks: true },

      defaultReferenceLineOptions,
      defaultXPositionEncoding
    );
    expect(bottomAxisRule.encode?.update?.y2).toStrictEqual({ signal: 'height + 9' });

    const topAxisRule = getReferenceLineRuleMark(
      { ...defaultAxisOptions, position: 'top', ticks: true },

      defaultReferenceLineOptions,
      defaultXPositionEncoding
    );
    expect(topAxisRule.encode?.update?.y).toStrictEqual({ value: -9 });
  });
});

describe('getReferenceLineSymbolMark()', () => {
  test('should return empty array if the icon property is not set', () => {
    const symbols = getReferenceLineSymbolMark(
      defaultAxisOptions,
      { ...defaultReferenceLineOptions, icon: undefined },
      defaultXPositionEncoding
    );
    expect(symbols).toHaveLength(0);
  });
  test('should generate symbol mark if icon id defined', () => {
    const symbols = getReferenceLineSymbolMark(
      defaultAxisOptions,
      defaultReferenceLineOptions,
      defaultXPositionEncoding
    );
    expect(symbols).toStrictEqual([
      {
        encode: {
          enter: {
            fill: { value: spectrumColors.light[DEFAULT_FONT_COLOR] },
            shape: {
              value: DATE_PATH,
            },
            size: { value: 324 },
          },
          update: {
            x: defaultXPositionEncoding,
            y: { signal: 'height + 24' },
          },
        },
        name: 'axis0ReferenceLine0_symbol',
        type: 'symbol',
      },
    ]);
  });
  test('should set the color of the icon based on labelColor', () => {
    const symbols = getReferenceLineSymbolMark(
      defaultAxisOptions,
      { ...defaultReferenceLineOptions, iconColor: 'green-700' },
      defaultXPositionEncoding
    );
    expect(symbols[0].encode?.enter?.fill).toStrictEqual({ value: spectrumColors.light['green-700'] });
  });
  test('should apply the correct position encodings based on axis position', () => {
    const topAxisSymbol = getReferenceLineSymbolMark(
      { ...defaultAxisOptions, position: 'top' },
      defaultReferenceLineOptions,
      defaultXPositionEncoding
    )[0];
    expect(topAxisSymbol.encode?.update).toStrictEqual({
      x: defaultXPositionEncoding,
      y: { value: -24 },
    });

    const bottomAxisSymbol = getReferenceLineSymbolMark(
      defaultAxisOptions,
      defaultReferenceLineOptions,
      defaultXPositionEncoding
    )[0];
    expect(bottomAxisSymbol.encode?.update).toStrictEqual({
      x: defaultXPositionEncoding,
      y: { signal: 'height + 24' },
    });

    const leftAxisSymbol = getReferenceLineSymbolMark(
      { ...defaultAxisOptions, position: 'left' },
      defaultReferenceLineOptions,
      defaultYPositionEncoding
    )[0];
    expect(leftAxisSymbol.encode?.update).toStrictEqual({
      x: { value: -24 },
      y: { ...defaultYPositionEncoding, offset: undefined },
    });

    const rightAxisSymbol = getReferenceLineSymbolMark(
      { ...defaultAxisOptions, position: 'right' },
      defaultReferenceLineOptions,
      defaultYPositionEncoding
    )[0];
    expect(rightAxisSymbol.encode?.update).toStrictEqual({
      x: { signal: 'width + 24' },
      y: { ...defaultYPositionEncoding, offset: undefined },
    });
  });
});

describe('getReferenceLineTextMark()', () => {
  test('should return an empty array if there is no label', () => {
    const marks = getReferenceLineTextMark(
      defaultAxisOptions,
      { ...defaultReferenceLineOptions, label: undefined },
      defaultYPositionEncoding
    );
    expect(marks).toHaveLength(0);
  });

  test('should return a text mark if label is defined', () => {
    const marks = getReferenceLineTextMark(
      defaultAxisOptions,
      { ...defaultReferenceLineOptions, label: 'Hello world!' },
      defaultYPositionEncoding
    );
    expect(marks).toHaveLength(1);
    expect(marks[0]).toHaveProperty('type', 'text');
    expect(marks[0]?.encode?.update?.text?.[0]).toHaveProperty('value', 'Hello world!');
  });
});

describe('getReferenceLineLabelsEncoding()', () => {
  test('should use a vertical offset of 50 if there is an icon', () => {
    const encoding = getReferenceLineLabelsEncoding(
      defaultAxisOptions,
      { ...defaultReferenceLineOptions, icon: 'sentimentPositive', label: 'Hello world!' },
      defaultYPositionEncoding
    );
    expect(encoding.update?.y).toHaveProperty('signal', 'height + 50');
  });
  test('should use a vertical offset of 28 if icon is undefined', () => {
    const encoding = getReferenceLineLabelsEncoding(
      defaultAxisOptions,
      { ...defaultReferenceLineOptions, icon: undefined, label: 'Hello world!' },
      defaultYPositionEncoding
    );
    expect(encoding.update?.y).toHaveProperty('signal', 'height + 28');
  });
  test('should use a horizontal offset of 4 if there is an icon', () => {
    const encoding = getReferenceLineLabelsEncoding(
      { ...defaultAxisOptions, position: 'left' },
      { ...defaultReferenceLineOptions, icon: 'sentimentPositive', label: 'Hello world!' },
      defaultXPositionEncoding
    );
    expect(encoding.update?.y).toHaveProperty('offset', 4);
  });
  test('should use a horizontal offset of 4 if icon is undefined', () => {
    const encoding = getReferenceLineLabelsEncoding(
      { ...defaultAxisOptions, position: 'left' },
      { ...defaultReferenceLineOptions, icon: undefined, label: 'Hello world!' },
      defaultXPositionEncoding
    );
    expect(encoding.update?.y).toHaveProperty('offset', 4);
  });
});
