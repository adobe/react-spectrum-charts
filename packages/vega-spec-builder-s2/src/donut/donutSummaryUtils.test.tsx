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
import { View, expressionFunction, parse } from 'vega';

import { DONUT_SUMMARY_LABEL_FONT_SIZES, DONUT_SUMMARY_VALUE_FONT_SIZES } from '@spectrum-charts/core-s2/constants';
import { spectrum2Colors } from '@spectrum-charts/core-s2/tokens';

import { DonutSummarySpecOptions } from '../types/index.js';
import {
  getBooleanDonutSummaryGroupMark,
  getDonutSummaryData,
  getDonutSummaryGroupMark,
  getDonutSummaryMarks,
  getDonutSummarySignals,
  getSummaryDeltaEncode,
  getSummaryDeltaFill,
  getSummaryDeltaText,
  getSummaryLabelEncode,
  getSummaryTextFontSize,
  getSummaryValueEncode,
  getSummaryValueLimit,
  getSummaryValueText,
} from './donutSummaryUtils.js';
import { defaultDonutOptions } from './donutTestUtils.js';

const defaultDonutSummaryOptions: DonutSummarySpecOptions = {
  donutOptions: defaultDonutOptions,
  hideValue: false,
  label: 'Visitors',
  numberFormat: 'shortNumber',
};

const evaluateSummarySignal = async (encoding: unknown, innerRadius = 100): Promise<number> => {
  if (!encoding || typeof encoding !== 'object' || !('signal' in encoding) || typeof encoding.signal !== 'string') {
    throw new Error('Expected a summary signal expression');
  }
  const view = new View(
    parse({
      height: 400,
      signals: [
        { name: 'testName_outerRadius', value: 200 },
        { name: 'testName_innerRadius', value: innerRadius },
        { name: 'testName_summaryValueFontSize', value: 50 },
        { name: 'testName_summaryLabelFontSize', value: 24 },
        { name: 'result', update: encoding.signal },
      ],
    }),
    { renderer: 'none' }
  );
  try {
    await view.runAsync();
    const result: unknown = view.signal('result');
    if (typeof result !== 'number') throw new Error('Expected a numeric summary signal');
    return result;
  } finally {
    view.finalize();
  }
};

describe('getDonutSummaryData()', () => {
  test('should return empty array if there is not a DonutSummary on the Donut', () => {
    const data = getDonutSummaryData(defaultDonutOptions);
    expect(data).toHaveLength(0);
  });

  test('should return summary data if there is a DonutSummary on the Donut', () => {
    const data = getDonutSummaryData({
      ...defaultDonutOptions,
      donutSummaries: [{ label: 'Visitors' }],
    });
    expect(data).toHaveLength(1);
    expect(data[0].name).toEqual('testName_summaryData');
  });
});

describe('getDonutSummarySignals()', () => {
  test('should return empty array if there is not a DonutSummary on the Donut', () => {
    const signals = getDonutSummarySignals(defaultDonutOptions);
    expect(signals).toHaveLength(0);
  });

  test('should return value and label font size signals if there is a DonutSummary on the Donut', () => {
    const signals = getDonutSummarySignals({
      ...defaultDonutOptions,
      donutSummaries: [{ label: 'Visitors' }],
    });
    expect(signals).toHaveLength(2);
    expect(signals[0]).toEqual({
      name: 'testName_summaryValueFontSize',
      update: `[${DONUT_SUMMARY_VALUE_FONT_SIZES.join(', ')}][testName_sizeTier]`,
    });
    expect(signals[1]).toEqual({
      name: 'testName_summaryLabelFontSize',
      update: `[${DONUT_SUMMARY_LABEL_FONT_SIZES.join(', ')}][testName_sizeTier]`,
    });
  });

  test.each([
    { delta: 0.025, label: 'Visitors' },
    { delta: 0.025 },
    { delta: 0.025, hideValue: true, label: 'Visitors' },
    { delta: 0.025, hideValue: true },
  ])('should not reserve delta space below a semicircle: %o', (summary) => {
    const signals = getDonutSummarySignals({
      ...defaultDonutOptions,
      variant: 'semicircle',
      donutSummaries: [summary],
    });
    expect(signals).toHaveLength(2);
    expect(signals.map(({ name }) => name)).toEqual(['testName_summaryValueFontSize', 'testName_summaryLabelFontSize']);
  });
});

describe('getDonutSummaryGroupMark()', () => {
  test('should return a single mark if label is undefined', () => {
    const groupMark = getDonutSummaryGroupMark({ ...defaultDonutSummaryOptions, label: undefined });
    expect(groupMark.marks).toHaveLength(1);
    expect(groupMark.marks?.[0].name).toEqual('testName_summaryValue');
  });

  test('should return a metric label if label is defined', () => {
    const groupMark = getDonutSummaryGroupMark(defaultDonutSummaryOptions);
    expect(groupMark.marks).toHaveLength(2);
    expect(groupMark.marks?.[1].name).toEqual('testName_summaryLabel');
  });

  test('should not include value mark if hideValue is true', () => {
    const groupMark = getDonutSummaryGroupMark({ ...defaultDonutSummaryOptions, hideValue: true });
    expect(groupMark.marks).toHaveLength(1);
    expect(groupMark.marks?.[0].name).toEqual('testName_summaryLabel');
  });

  test('should return no marks if hideValue is true and label is undefined', () => {
    const groupMark = getDonutSummaryGroupMark({ ...defaultDonutSummaryOptions, hideValue: true, label: undefined });
    expect(groupMark.marks).toHaveLength(0);
  });
});

describe('getBooleanDonutSummaryGroupMark()', () => {
  test('should return a single mark if label is undefined', () => {
    const groupMark = getBooleanDonutSummaryGroupMark({ ...defaultDonutSummaryOptions, label: undefined });
    expect(groupMark.marks).toHaveLength(1);
    expect(groupMark.marks?.[0].name).toEqual('testName_booleanSummaryValue');
  });

  test('should return a metric label if label is defined', () => {
    const groupMark = getBooleanDonutSummaryGroupMark(defaultDonutSummaryOptions);
    expect(groupMark.marks).toHaveLength(2);
    expect(groupMark.marks?.[1].name).toEqual('testName_booleanSummaryLabel');
  });

  test('should not include value mark if hideValue is true', () => {
    const groupMark = getBooleanDonutSummaryGroupMark({ ...defaultDonutSummaryOptions, hideValue: true });
    expect(groupMark.marks).toHaveLength(1);
    expect(groupMark.marks?.[0].name).toEqual('testName_booleanSummaryLabel');
  });

  test('should return no marks if hideValue is true and label is undefined', () => {
    const groupMark = getBooleanDonutSummaryGroupMark({
      ...defaultDonutSummaryOptions,
      hideValue: true,
      label: undefined,
    });
    expect(groupMark.marks).toHaveLength(0);
  });
});

describe('getSummaryValueText()', () => {
  test('should return the correct text for boolean metric', () => {
    const result = getSummaryValueText({
      ...defaultDonutSummaryOptions,
      donutOptions: { ...defaultDonutOptions, isBoolean: true },
    });
    expect(result).toEqual({ signal: `format(datum['testMetric'], '.0%')` });
  });

  test('should return the correct text for non-boolean metric', () => {
    const result = getSummaryValueText(defaultDonutSummaryOptions);
    expect(result).toEqual([
      {
        signal: "formatShortNumber(datum['sum'])",
        test: "isNumber(datum['sum'])",
      },
      { field: 'sum' },
    ]);
  });
});

describe('getSummaryTextFontSize()', () => {
  const originalGetLabelWidth = expressionFunction('getLabelWidth');

  beforeAll(() => {
    expressionFunction('getLabelWidth', (text: string) =>
      Array.from(text).reduce((width, character) => width + (character === '\u2026' ? 12 : 8), 0)
    );
  });

  afterAll(() => {
    expressionFunction('getLabelWidth', originalGetLabelWidth);
  });

  test.each([
    ['circle', 'testName_innerRadius < 40'],
    ['semicircle', 'testName_innerRadius < 40'],
  ] as const)('should hide text below the minimum inner radius for a %s', (variant, test) => {
    const fontSize = getSummaryTextFontSize(
      { ...defaultDonutOptions, variant },
      "datum['sum']",
      'valueFontSize',
      800,
      'availableWidth'
    );
    expect(fontSize).toHaveProperty('0', { test, value: 0 });
  });

  test.each([
    { scenario: 'only an ellipsis fits', text: '123', limit: 19, hidden: true },
    { scenario: 'first character plus ellipsis exactly matches the limit', text: '123', limit: 20, hidden: true },
    { scenario: 'first character plus ellipsis fits', text: '123', limit: 21, hidden: false },
    { scenario: 'the full value fits', text: '123', limit: 25, hidden: false },
    { scenario: 'numeric zero fits without an ellipsis', text: 0, limit: 9, hidden: false },
    { scenario: 'a single character fits without an ellipsis', text: '1', limit: 9, hidden: false },
    { scenario: 'the text is empty', text: '', limit: 19, hidden: false },
    { scenario: 'the text is null', text: null, limit: 19, hidden: false },
    { scenario: 'surrounding whitespace is ignored', text: ' 123 ', limit: 19, hidden: true },
    { scenario: 'no width is available', text: '123', limit: 0, hidden: true },
    { scenario: 'the available width is negative', text: '123', limit: -1, hidden: true },
  ])('should select the correct font size when $scenario', async ({ text, limit, hidden }) => {
    const result = getSummaryTextFontSize(defaultDonutOptions, 'text', 'summaryFontSize', 800, 'availableWidth');
    if (!Array.isArray(result)) throw new Error('Expected summary font size production rules');
    const hideRule = result[1];
    const fallback = result[2];
    if (!hideRule?.test || !('value' in hideRule) || !fallback || !('signal' in fallback)) {
      throw new Error('Expected an ellipsis-only hiding rule and font size fallback');
    }
    const view = new View(
      parse({
        signals: [
          { name: 'text', value: text },
          { name: 'availableWidth', value: limit },
          { name: 'summaryFontSize', value: 22 },
          { name: 'shouldHide', update: hideRule.test },
          { name: 'fontSize', update: `shouldHide ? ${hideRule.value} : ${fallback.signal}` },
        ],
      }),
      { renderer: 'none' }
    );
    try {
      await view.runAsync();
      expect(view.signal('shouldHide')).toBe(hidden);
      expect(view.signal('fontSize')).toBe(hidden ? 0 : 22);
    } finally {
      view.finalize();
    }
  });
});

describe('summary stack centering', () => {
  test.each([
    { label: undefined, delta: undefined, hideValue: false, offsets: [0] },
    { label: 'Visitors', delta: undefined, hideValue: true, offsets: [0] },
    { label: undefined, delta: 0.025, hideValue: true, offsets: [0] },
    { label: 'Visitors', delta: undefined, hideValue: false, offsets: [-18.5, 31.5] },
    { label: undefined, delta: 0, hideValue: false, offsets: [-18.5, 31.5] },
    { label: 'Visitors', delta: -0.074, hideValue: true, offsets: [-15, 15] },
    { label: 'Visitors', delta: 0.025, hideValue: false, offsets: [-33.5, 16.5, 46.5] },
  ])('centers the visible rows with $offsets offsets', async ({ offsets, ...summary }) => {
    const group = getDonutSummaryGroupMark({ ...defaultDonutSummaryOptions, ...summary });
    expect(group.marks).toHaveLength(offsets.length);
    for (const [index, mark] of (group.marks ?? []).entries()) {
      if (mark.type !== 'text') throw new Error('Expected a summary text mark');
      expect(mark).toHaveProperty('encode.update.baseline', { value: 'middle' });
      expect(await evaluateSummarySignal(mark.encode?.update?.dy)).toBe(offsets[index]);
      expect(await evaluateSummarySignal(mark.encode?.update?.y)).toBe(200);
    }
  });
});

describe('getSummaryValueLimit()', () => {
  test('uses the value row edge in a two-row stack', async () => {
    const limit = getSummaryValueLimit({ ...defaultDonutSummaryOptions, label: 'Visitors' });
    expect(await evaluateSummarySignal(limit)).toBeCloseTo(2 * Math.sqrt(100 ** 2 - 43.5 ** 2));
  });

  test('uses half the font size for a centered single row', async () => {
    const limit = getSummaryValueLimit({ ...defaultDonutSummaryOptions, label: '' });
    expect(await evaluateSummarySignal(limit)).toBeCloseTo(2 * Math.sqrt(100 ** 2 - 25 ** 2));
  });

  test('clamps the width to zero when the stack extends outside the hole', async () => {
    const limit = getSummaryValueLimit({
      ...defaultDonutSummaryOptions,
      donutOptions: { ...defaultDonutOptions, variant: 'semicircle' },
    });
    expect(await evaluateSummarySignal(limit, 40)).toBe(0);
  });
});

describe('getSummaryLabelEncode() with hideValue', () => {
  test('should center label vertically when hideValue is true', async () => {
    const encode = getSummaryLabelEncode({
      ...defaultDonutSummaryOptions,
      hideValue: true,
      label: 'Visitors',
    });
    expect(encode).toHaveProperty('update.baseline', { value: 'middle' });
    expect(await evaluateSummarySignal(encode.update?.dy)).toBe(0);
  });

  test('should position label below value when hideValue is false', async () => {
    const encode = getSummaryLabelEncode({
      ...defaultDonutSummaryOptions,
      hideValue: false,
      label: 'Visitors',
    });
    expect(encode).toHaveProperty('update.baseline', { value: 'middle' });
    expect(await evaluateSummarySignal(encode.update?.dy)).toBe(31.5);
  });

  test('should use the label font size signal directly, not derived from the value font size', () => {
    const encode = getSummaryLabelEncode({
      ...defaultDonutSummaryOptions,
      hideValue: false,
      label: 'Visitors',
    });
    expect(encode).toHaveProperty('update.fontSize.0', {
      test: 'testName_innerRadius < 40',
      value: 0,
    });
    expect(encode).toHaveProperty('update.fontSize.2', { signal: 'testName_summaryLabelFontSize' });
  });

  test('should compute the limit from label height alone when hideValue is true', async () => {
    const encode = getSummaryLabelEncode({ ...defaultDonutSummaryOptions, hideValue: true, label: 'Visitors' });
    expect(await evaluateSummarySignal(encode.update?.limit)).toBeCloseTo(2 * Math.sqrt(100 ** 2 - 12 ** 2));
  });

  test('should compute the limit from the centered label row edge when hideValue is false', async () => {
    const encode = getSummaryLabelEncode({ ...defaultDonutSummaryOptions, hideValue: false, label: 'Visitors' });
    expect(await evaluateSummarySignal(encode.update?.limit)).toBeCloseTo(2 * Math.sqrt(100 ** 2 - 43.5 ** 2));
  });
});

describe('s2 styles', () => {
  describe('getSummaryValueEncode()', () => {
    test('should always add fontWeight 800 for S2', () => {
      const encode = getSummaryValueEncode(defaultDonutSummaryOptions);

      expect(encode.update?.fontWeight).toEqual({ value: 800 });
    });
  });

  describe('getSummaryLabelEncode()', () => {
    test('should always add fontWeight 700 for S2', () => {
      const encode = getSummaryLabelEncode({
        ...defaultDonutSummaryOptions,
        label: 'Visitors',
      });

      expect(encode.update?.fontWeight).toEqual({ value: 700 });
    });
  });
});

describe('semicircle summary anchoring', () => {
  const semicircleDonutOptions = { ...defaultDonutOptions, variant: 'semicircle' as const };
  const semicircleSummaryOptions: DonutSummarySpecOptions = {
    ...defaultDonutSummaryOptions,
    donutOptions: semicircleDonutOptions,
  };
  test('getSummaryValueEncode centers the stack within the inner half-disc', async () => {
    const encode = getSummaryValueEncode(semicircleSummaryOptions);
    expect(await evaluateSummarySignal(encode.update?.y)).toBe(250);
  });

  test('getSummaryLabelEncode uses the same centered anchor', async () => {
    const encode = getSummaryLabelEncode({ ...semicircleSummaryOptions, label: 'Visitors' });
    expect(await evaluateSummarySignal(encode.update?.y)).toBe(250);
  });

  test('hideValue removes the value and centers the remaining label', () => {
    const groupMark = getDonutSummaryGroupMark({ ...semicircleSummaryOptions, hideValue: true });
    expect(groupMark.marks).toHaveLength(1);
    expect(groupMark.marks?.[0]).toHaveProperty('name', 'testName_summaryLabel');
    expect(groupMark.marks?.[0]).toHaveProperty(
      'encode.update.y.signal',
      '(height + testName_outerRadius) / 2 - testName_innerRadius / 2'
    );
  });

  test.each([false, true])('ignores delta without changing summary layout when isBoolean=%s', (isBoolean) => {
    for (const summary of [{ label: 'Visitors' }, {}, { hideValue: true, label: 'Visitors' }, { hideValue: true }]) {
      const options = { ...semicircleDonutOptions, isBoolean, donutSummaries: [summary] };
      const expectedMarks = getDonutSummaryMarks(options);
      for (const delta of [0.025, -0.074, 0]) {
        const marks = getDonutSummaryMarks({ ...options, donutSummaries: [{ ...summary, delta }] });
        expect(marks).toEqual(expectedMarks);
      }
    }
  });

  test('a full circle still anchors directly at the arc center (no offset)', () => {
    const encode = getSummaryValueEncode(defaultDonutSummaryOptions);
    expect(encode.update?.y).toEqual({ signal: 'height / 2' });
  });

  test('getSummaryValueLimit accounts for the inner half-disc center', async () => {
    const limit = getSummaryValueLimit({ ...semicircleSummaryOptions, label: 'Visitors' });
    expect(await evaluateSummarySignal(limit)).toBeCloseTo(2 * Math.sqrt(100 ** 2 - 93.5 ** 2));
  });
});

describe('getSummaryDeltaText()', () => {
  test('should render an explicit-sign one-decimal percent for a positive delta', () => {
    expect(getSummaryDeltaText(0.025)).toEqual({ signal: `format(0.025, '+.1%')` });
  });
  test('should render an explicit-sign one-decimal percent for a negative delta', () => {
    expect(getSummaryDeltaText(-0.074)).toEqual({ signal: `format(-0.074, '+.1%')` });
  });
});

describe('getSummaryDeltaFill()', () => {
  test('should use sentiment-positive (green-800) for a positive delta', () => {
    expect(getSummaryDeltaFill(0.025, 'light')).toEqual({ value: spectrum2Colors.light['green-800'] });
  });
  test('should use sentiment-negative (red-800) for a negative delta', () => {
    expect(getSummaryDeltaFill(-0.074, 'light')).toEqual({ value: spectrum2Colors.light['red-800'] });
  });
  test('should default a zero delta to sentiment-positive', () => {
    expect(getSummaryDeltaFill(0, 'light')).toEqual({ value: spectrum2Colors.light['green-800'] });
  });
});

describe('getDonutSummaryGroupMark() with delta', () => {
  test('should add a third mark when delta is defined', () => {
    const groupMark = getDonutSummaryGroupMark({ ...defaultDonutSummaryOptions, delta: 0.025 });
    expect(groupMark.marks).toHaveLength(3);
    expect(groupMark.marks?.[2].name).toEqual('testName_summaryDelta');
  });

  test('should not add a delta mark when delta is undefined', () => {
    const groupMark = getDonutSummaryGroupMark(defaultDonutSummaryOptions);
    expect(groupMark.marks).toHaveLength(2);
  });
});

describe('getBooleanDonutSummaryGroupMark() with delta', () => {
  test('should add a third mark when delta is defined', () => {
    const groupMark = getBooleanDonutSummaryGroupMark({ ...defaultDonutSummaryOptions, delta: 0.025 });
    expect(groupMark.marks).toHaveLength(3);
    expect(groupMark.marks?.[2].name).toEqual('testName_booleanSummaryDelta');
  });
});

describe('getSummaryDeltaEncode() stacking', () => {
  test('value + label + delta: delta stacks below the label', async () => {
    const encode = getSummaryDeltaEncode({ ...defaultDonutSummaryOptions, label: 'Visitors', delta: 0.025 });
    expect(await evaluateSummarySignal(encode.update?.dy)).toBe(46.5);
    expect(encode).toHaveProperty('update.baseline', { value: 'middle' });
  });

  test('value + delta, no label: delta sits below the centered value', async () => {
    const encode = getSummaryDeltaEncode({
      ...defaultDonutSummaryOptions,
      label: undefined,
      delta: 0.025,
    });
    expect(await evaluateSummarySignal(encode.update?.dy)).toBe(31.5);
    expect(encode).toHaveProperty('update.baseline', { value: 'middle' });
  });

  test('label + delta, hideValue: delta sits below the centered label', async () => {
    const encode = getSummaryDeltaEncode({
      ...defaultDonutSummaryOptions,
      hideValue: true,
      label: 'Visitors',
      delta: 0.025,
    });
    expect(await evaluateSummarySignal(encode.update?.dy)).toBe(15);
  });

  test('delta alone (hideValue, no label): centered with no dy offset', async () => {
    const encode = getSummaryDeltaEncode({
      ...defaultDonutSummaryOptions,
      hideValue: true,
      label: undefined,
      delta: 0.025,
    });
    expect(await evaluateSummarySignal(encode.update?.dy)).toBe(0);
    expect(encode).toHaveProperty('update.baseline', { value: 'middle' });
  });

  test('reuses the label font-size signal directly rather than a separate delta signal', () => {
    const encode = getSummaryDeltaEncode({ ...defaultDonutSummaryOptions, label: 'Visitors', delta: 0.025 });
    expect(encode).toHaveProperty('update.fontSize.0', {
      test: 'testName_innerRadius < 40',
      value: 0,
    });
    expect(encode).toHaveProperty('update.fontSize.2', { signal: 'testName_summaryLabelFontSize' });
  });

  test('should always use fontWeight 800', () => {
    const encode = getSummaryDeltaEncode({ ...defaultDonutSummaryOptions, label: 'Visitors', delta: 0.025 });
    expect(encode.update?.fontWeight).toEqual({ value: 800 });
  });
});

describe('interaction: value/label centering when delta is present', () => {
  test('value retains the middle baseline when only a delta follows', () => {
    const encode = getSummaryValueEncode({ ...defaultDonutSummaryOptions, label: undefined, delta: 0.025 });
    expect(encode).toHaveProperty('update.baseline', { value: 'middle' });
  });

  test('value limit uses its centered row edge when only a delta follows', async () => {
    const limit = getSummaryValueLimit({ ...defaultDonutSummaryOptions, label: undefined, delta: 0.025 });
    expect(await evaluateSummarySignal(limit)).toBeCloseTo(2 * Math.sqrt(100 ** 2 - 43.5 ** 2));
  });

  test('label sits above center when hideValue and a delta follows it', async () => {
    const encode = getSummaryLabelEncode({
      ...defaultDonutSummaryOptions,
      hideValue: true,
      label: 'Visitors',
      delta: 0.025,
    });
    expect(encode).toHaveProperty('update.baseline', { value: 'middle' });
    expect(await evaluateSummarySignal(encode.update?.dy)).toBe(-15);
  });
});
